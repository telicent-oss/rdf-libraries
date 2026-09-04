import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, sep } from "node:path";

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

/** What a caller may set on one git invocation. Deliberately narrower than node's. */
export interface GitOptions {
  timeout?: number;
  env?: NodeJS.ProcessEnv;
}

/** The outcome of one git invocation. Nothing here throws, so every field is readable. */
export interface GitResult {
  status: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  /** Set when the process could not run or was killed. `code` is node's: ENOENT, ETIMEDOUT. */
  error?: NodeJS.ErrnoException;
}

/**
 * How git is run. The command is always git, so only its arguments are passed.
 *
 * Injected because one condition cannot be produced in process: a machine with no git.
 * Emptying PATH does not do it under jest, which hands the test a copy of `process.env`
 * while the child reads the real one. A caller with its own reason to control the
 * invocation can supply one too.
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

/** Raised on the spot: a machine that cannot run git has no answer to any question here. */
function refuseIfGitMissing(result: GitResult): void {
  if (failedWith(result, "ENOENT")) throw new PullError(GIT_MISSING);
}

/**
 * Whether git ignores `path`, asked of git rather than inferred by reading .gitignore,
 * so nested and negated patterns give the same answer here as they do to git itself.
 *
 * `check-ignore` exits 1 for a path that is NOT ignored, which is not an error, so a
 * non-zero exit is read as false. A path outside any repository is not ignored either.
 *
 * Three details decide whether this answers correctly:
 *
 * The path is made relative to `cwd`. git rejects an absolute path it reads as outside
 * the repository, and on macOS a temp directory reached as /var/... resolves to
 * /private/var/..., so an absolute path that IS inside the repo can be read as outside it.
 *
 * Separators are rewritten to `/`. `relative()` returns `\` on win32 and git takes only
 * `/`, so the trailing-slash test below and git's own pattern matching would both miss.
 *
 * A trailing slash is added, which tells git the path is a directory. The usual pattern
 * for a pulled directory is `name/`, which git matches only against something it knows is
 * a directory, so without the slash a destination that does not exist YET reads as not
 * ignored, and every first pull would be refused.
 */
export function isGitIgnored(path: string, cwd: string, git: GitRunner = realGit): boolean {
  const rel = (isAbsolute(path) ? relative(cwd, path) : path).split(sep).join("/");
  if (rel === "" || rel.startsWith("..")) return false;
  const asDirectory = rel.endsWith("/") ? rel : `${rel}/`;
  const result = git(["-C", cwd, "check-ignore", "--quiet", asDirectory]);
  refuseIfGitMissing(result);
  return result.status === 0;
}

/**
 * Whether `cwd` is inside a git work tree, so an ignore answer means anything.
 *
 * A missing git binary is separated out rather than folded into the false answer. Every
 * real caller reaches this before `isGitIgnored`, so without the check a machine that
 * cannot run git is told its repository "is not inside a git work tree" — the same wrong
 * diagnosis, on the path that is actually taken.
 */
function insideWorkTree(cwd: string, git: GitRunner): boolean {
  const result = git(["-C", cwd, "rev-parse", "--is-inside-work-tree"]);
  refuseIfGitMissing(result);
  return result.status === 0 && result.stdout.trim() === "true";
}

/** How long a single clone may take before it is killed. */
const CLONE_TIMEOUT_MS = 60_000;

/**
 * A clone with no deadline waits forever, silently, and this one runs inside setup
 * scripts where nothing is watching it. Three stalls have to be bounded separately,
 * because none of the three catches the other two:
 *
 * - `timeout` bounds a clone that connects and then stops sending
 * - `ConnectTimeout` bounds a clone that never connects, which `timeout` would otherwise
 *   sit through for the whole window
 * - `GIT_TERMINAL_PROMPT=0` stops git blocking on a username prompt when no credential
 *   works, which no timeout catches because git is waiting on a terminal
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
 * Clone `ref` and keep it only if it carries `subpath`, which is what the caller is
 * looking for. A clone that misses is removed here, so the caller holds at most one
 * directory to clean up.
 *
 * git's stderr is carried out rather than dropped. A ref that does not exist, a repository
 * that does not exist, a refused credential and an unreachable network all fail the same
 * clone, and collapsing them to "could not clone" sends someone hunting for a missing
 * branch when the real answer is in the line git already wrote.
 *
 * A killed clone has no stderr to carry, so each way of being killed is named. Without
 * that it reports "could not clone (git exited null)", which reads like a git bug.
 */
function shallowClone(
  repo: string,
  ref: string,
  subpath: string,
  timeoutMs: number,
  git: GitRunner,
): CloneAttempt {
  const tmp = mkdtempSync(join(tmpdir(), "pull-gitignored-"));
  const discard = (reason: string): CloneAttempt => {
    rmSync(tmp, { recursive: true, force: true });
    return { reason };
  };

  const result = git(["clone", "--quiet", "--depth", "1", "--branch", ref, repo, tmp], cloneLimits(timeoutMs));
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
   * Bounds each clone attempt, not the call: a caller passing three refs waits up to
   * three times this in the worst case, which is the same shape as the retries.
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
 * `dest` is deleted outright, so this REFUSES to run unless git ignores it. That check is
 * the reason this function exists: every caller's comment claimed the destination was
 * gitignored and therefore safe to destroy, and nothing verified the claim. A wrong path,
 * a moved directory or an edited .gitignore turns a pull into data loss, and the files it
 * takes are the ones git is not tracking, so there is nothing to restore from.
 *
 * The new content is assembled beside `dest` and swapped in, so `dest` survives until
 * there is something complete to replace it with. Copying into `dest` directly means a
 * failed copy — a full disk, a file where a directory was expected — leaves the caller
 * with neither the old content nor the new.
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
    // mkdtemp rather than a name derived from dest: it cannot collide with something
    // already there, so nothing outside dest is ever deleted to make room for it.
    mkdirSync(dirname(dest), { recursive: true });
    staging = mkdtempSync(join(dirname(dest), ".pull-gitignored-"));
    rmSync(staging, { recursive: true, force: true });
    cpSync(join(clone.dir, subpath), staging, { recursive: true });
    if (writeShaFile) writeFileSync(join(staging, ".commitSha"), `${sha}\n`);
    rmSync(dest, { recursive: true, force: true });
    renameSync(staging, dest);
    staging = null;
    return { sha, ref: clone.ref };
  } finally {
    if (clone !== null) rmSync(clone.dir, { recursive: true, force: true });
    if (staging !== null) rmSync(staging, { recursive: true, force: true });
  }
}
