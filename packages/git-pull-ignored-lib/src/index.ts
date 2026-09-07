import { spawnSync } from "node:child_process";
import {
  cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, renameSync, rmSync, writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join, relative, sep } from "node:path";

/** A failure the caller is expected to print and exit on, rather than a bug. */
export class PullError extends Error {
  readonly attempted: string[];

  constructor(message: string, { attempted = [] }: { attempted?: string[] } = {}) {
    super(message);
    this.name = "PullError";
    this.attempted = attempted;
  }
}

const GIT_MISSING = "cannot ask git whether the destination is ignored: git is not on PATH";

/** What a caller may set on one git invocation. */
export interface GitOptions {
  timeout?: number;
  env?: NodeJS.ProcessEnv;
}

/** The outcome of one git invocation. A failure arrives in these fields, never as a throw. */
export interface GitResult {
  status: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  /**
   * Set when git could not be run or was killed, never when git ran and exited non-zero.
   * `code` is node's own string: `ENOENT` for no git binary, `ETIMEDOUT` for one the
   * `timeout` killed.
   */
  error?: NodeJS.ErrnoException;
}

/**
 * How git is run. It takes the arguments that would follow `git` on a command line, and
 * returns the outcome instead of throwing.
 *
 * Injected so a test can present a machine with no git, which cannot be arranged in
 * process.
 */
export type GitRunner = (args: string[], options?: GitOptions) => GitResult;

const realGit: GitRunner = (args, options = {}) => {
  const result = spawnSync("git", args, { encoding: "utf8", ...options });
  return {
    status: result.status,
    signal: result.signal,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    error: result.error,
  };
};

function failedWith(result: GitResult, code: string): boolean {
  return result.error?.code === code;
}

/**
 * git reads a leading dash as an option wherever the argument sits, and
 * `--upload-pack=<command>` makes a clone run that command. Nothing legitimate here starts
 * with a dash.
 *
 * Each call also puts `--` before its filenames, which tells git to read everything after
 * it as a value. That does not cover a value git expects right after a flag, such as the
 * ref after `--branch`, which is why both defences are here.
 */
function refuseOptionLike(value: string, what: string): void {
  if (value.startsWith("-")) {
    throw new PullError(
      `refusing to run git: ${what} starts with a dash, which git reads as an option, not a value: ${value}`,
    );
  }
}

/** A machine with no git cannot answer any question this module asks, so stop there. */
function refuseIfGitMissing(result: GitResult): void {
  if (failedWith(result, "ENOENT")) throw new PullError(GIT_MISSING);
}

/**
 * Whether git ignores `path`. Asked of git rather than read out of .gitignore, so nested
 * and negated patterns give the same answer here as they do to git.
 *
 * `git check-ignore --quiet <path>` prints nothing and answers with its exit code: 0 for
 * ignored, 1 for not. Any other code means git could not answer, and false is the safe
 * reading of that, because the caller refuses to delete anything it is not sure about.
 */
export function isGitIgnored(path: string, cwd: string, git: GitRunner = realGit): boolean {
  refuseOptionLike(cwd, "cwd");
  // Relative, because git rejects an absolute path it reads as outside the repository, and
  // on macOS /var/... resolves to /private/var/..., which makes an inside path look outside.
  // Forward slashes, because `relative()` returns `\` on win32 and git takes only `/`.
  const rel = (isAbsolute(path) ? relative(cwd, path) : path).split(sep).join("/");
  if (rel === "" || rel.startsWith("..")) return false;
  refuseOptionLike(rel, "dest");
  // The trailing slash tells git this is a directory. A .gitignore usually says `name/`,
  // which git matches only against a path it knows is a directory, so without it a
  // destination that does not exist yet reads as not ignored and the first pull is refused.
  const asDirectory = rel.endsWith("/") ? rel : `${rel}/`;
  const result = git(["-C", cwd, "check-ignore", "--quiet", "--", asDirectory]);
  refuseIfGitMissing(result);
  return result.status === 0;
}

/**
 * Whether `cwd` is inside a git work tree, so an ignore answer means anything.
 *
 * A machine with no git is reported as such, rather than as a directory that is not a
 * repository. This runs before `isGitIgnored`, so it is where that diagnosis would first
 * go wrong.
 */
function insideWorkTree(cwd: string, git: GitRunner): boolean {
  refuseOptionLike(cwd, "cwd");
  const result = git(["-C", cwd, "rev-parse", "--is-inside-work-tree"]);
  refuseIfGitMissing(result);
  return result.status === 0 && result.stdout.trim() === "true";
}

/** How long a single clone may take before it is killed. */
const CLONE_TIMEOUT_MS = 60_000;

/**
 * A clone with no deadline waits forever, silently, and this one runs inside setup
 * scripts where nothing is watching it. `timeout` alone would catch every stall, on the
 * wall clock, but only after the full window. The other two turn a 60-second wait into a
 * fast failure:
 *
 * - `ConnectTimeout=10` gives up on an ssh host that never answers. It is an ssh option,
 *   so an https clone falls back to `timeout`
 * - `GIT_TERMINAL_PROMPT=0` makes git fail instead of asking for a username when no
 *   credential works
 *
 * An existing `GIT_SSH_COMMAND` is extended rather than replaced, so a caller's own ssh
 * settings survive.
 */
function cloneLimits(timeoutMs: number): GitOptions {
  const ssh = process.env.GIT_SSH_COMMAND ?? "ssh";
  return {
    timeout: timeoutMs,
    env: { ...process.env, GIT_SSH_COMMAND: `${ssh} -o ConnectTimeout=10`, GIT_TERMINAL_PROMPT: "0" },
  };
}

type CloneAttempt = { dir: string; ref: string } | { reason: string };

/**
 * Clone `ref`, and keep it only if it carries `subpath`. A clone that misses is deleted
 * here, so the caller has at most one directory to clean up.
 *
 * The reason a clone failed is git's own stderr line, because "could not clone" on its own
 * sends the reader hunting for a missing branch when the repository or the credential was
 * the problem. A killed clone writes no stderr, so each way of being killed is named.
 */
function shallowClone(
  repo: string,
  ref: string,
  subpath: string,
  timeoutMs: number,
  git: GitRunner,
): CloneAttempt {
  refuseOptionLike(repo, "repo");
  refuseOptionLike(ref, "ref");
  const tmp = mkdtempSync(join(tmpdir(), "pull-gitignored-"));
  const discard = (reason: string): CloneAttempt => {
    rmSync(tmp, { recursive: true, force: true });
    return { reason };
  };

  const result = git(
    ["clone", "--quiet", "--depth", "1", "--branch", ref, "--", repo, tmp],
    cloneLimits(timeoutMs),
  );
  if (failedWith(result, "ENOENT")) {
    rmSync(tmp, { recursive: true, force: true });
    throw new PullError(GIT_MISSING);
  }
  if (failedWith(result, "ETIMEDOUT")) return discard(`timed out after ${timeoutMs}ms`);
  if (result.signal !== null) return discard(`killed by ${result.signal}`);
  if (result.status !== 0) {
    const lastLine = result.stderr.trim().split("\n").filter(Boolean).pop() ?? "";
    return discard(lastLine === "" ? `could not clone (git exited ${result.status})` : lastLine);
  }
  if (!existsSync(join(tmp, subpath))) return discard(`cloned, but has no ${subpath}`);
  return { dir: tmp, ref };
}

function headSha(dir: string, git: GitRunner): string {
  const result = git(["-C", dir, "rev-parse", "HEAD"]);
  refuseIfGitMissing(result);
  if (result.status !== 0) {
    throw new PullError(`cloned ${dir} but could not read its HEAD: ${result.stderr.trim()}`);
  }
  return result.stdout.trim();
}

export interface PullOptions {
  repo: string;
  /**
   * Tried in order, which lets a caller prefer a feature branch and fall back to the
   * default one. A ref that exists but lacks `subpath` counts as a miss, because the
   * point is to find a ref carrying the content.
   *
   * Branch and tag names only. The clone is `--branch <ref>`, which a commit sha does not
   * satisfy, so a sha is reported as a ref that does not carry the content.
   */
  refs: string[];
  subpath: string;
  dest: string;
  cwd: string;
  writeShaFile?: boolean;
  /**
   * Bounds each clone attempt, not the call: three refs can wait three times this.
   */
  cloneTimeoutMs?: number;
  /** Defaults to running the real git binary. */
  git?: GitRunner;
}

export interface PullResult {
  sha: string;
  ref: string;
}

/**
 * Replace `dest` with `subpath` taken from `repo`, and record the commit it came from.
 *
 * `dest` is deleted outright, so this refuses to run unless git says it is ignored.
 *
 * The clone goes to a temp directory. Inside the caller's own tree, `dest` is the only
 * path written to, because it is the only one git was asked about.
 *
 * The new content is built in a directory inside `dest` and moved up once it is complete,
 * so a copy that fails part-way leaves the old content in place. Once the move starts the
 * old content is gone, and a failure there leaves `dest` half-written; the next run
 * replaces it.
 */
export function pullGitignored({
  repo,
  refs,
  subpath,
  dest,
  cwd,
  writeShaFile = true,
  cloneTimeoutMs = CLONE_TIMEOUT_MS,
  git = realGit,
}: PullOptions): PullResult {
  if (!insideWorkTree(cwd, git)) {
    throw new PullError(
      `refusing to replace ${dest}: ${cwd} is not inside a git work tree.\n` +
        `This directory is deleted and rewritten, so the only thing that makes it safe is\n` +
        `git saying it is ignored, and outside a repository git has no answer to give.\n` +
        `Point cwd at the repository that ignores dest.`,
    );
  }

  if (!isGitIgnored(dest, cwd, git)) {
    throw new PullError(
      `refusing to replace ${dest}: git does not ignore it.\n` +
        `This directory is deleted and rewritten, so it has to be gitignored, otherwise a\n` +
        `pull would destroy tracked or untracked work with nothing to restore from.\n` +
        `Add it to .gitignore, or point dest at a directory that is already ignored.`,
    );
  }

  const attempted: string[] = [];
  let clone: { dir: string; ref: string } | null = null;
  let staging: string | null = null;
  try {
    for (const ref of refs) {
      const attempt = shallowClone(repo, ref, subpath, cloneTimeoutMs, git);
      if ("reason" in attempt) {
        attempted.push(`${ref}: ${attempt.reason}`);
        continue;
      }
      clone = attempt;
      break;
    }

    if (clone === null) {
      throw new PullError(`no ref of ${repo} carries ${subpath}:\n  ${attempted.join("\n  ")}`, {
        attempted,
      });
    }

    const sha = headSha(clone.dir, git);
    // Staged INSIDE dest, which is the only path git has said is disposable. Beside dest
    // would be a directory nobody ignores, and a process killed between the copy and the
    // swap would leave a full copy of another repository in the caller's tree for
    // `git add -A` to pick up.
    mkdirSync(dest, { recursive: true });
    // mkdtemp makes a uniquely named directory, so nothing already there is disturbed.
    // It is removed again because the copy below wants to create the path itself: the
    // name is what is being reserved, not the directory.
    staging = mkdtempSync(join(dest, ".pull-gitignored-"));
    rmSync(staging, { recursive: true, force: true });
    try {
      cpSync(join(clone.dir, subpath), staging, { recursive: true });
      if (writeShaFile) writeFileSync(join(staging, ".commitSha"), `${sha}\n`);
    } catch (error) {
      // Nothing has been removed yet, so the old content is still there. Reported as a
      // PullError because the caller prints these and exits, rather than showing a stack.
      throw new PullError(
        `could not assemble ${subpath} from ${repo} in ${dest}: ${(error as Error).message}\n` +
          `Nothing was removed: the previous contents of ${dest} are untouched.`,
      );
    }
    // The copy is done, so the risky part is over. Removing the old entries and moving the
    // new ones up can still fail on a permission or a locked file, and would leave dest
    // half-written; the next run replaces it.
    for (const entry of readdirSync(dest)) {
      if (join(dest, entry) !== staging) rmSync(join(dest, entry), { recursive: true, force: true });
    }
    for (const entry of readdirSync(staging)) {
      renameSync(join(staging, entry), join(dest, entry));
    }
    return { sha, ref: clone.ref };
  } finally {
    if (clone !== null) rmSync(clone.dir, { recursive: true, force: true });
    if (staging !== null) rmSync(staging, { recursive: true, force: true });
  }
}
