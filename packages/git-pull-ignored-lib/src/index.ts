import { ExecFileSyncOptions, execFileSync, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join, relative } from "node:path";

/** A failure the caller is expected to print and exit on, rather than a bug. */
export class PullError extends Error {
  readonly attempted: string[];

  constructor(message: string, { attempted = [] }: { attempted?: string[] } = {}) {
    super(message);
    this.name = "PullError";
    this.attempted = attempted;
  }
}

/** What node attaches to a failed child process, beyond the Error itself. */
type ChildProcessError = Error & {
  code?: string;
  status?: number | null;
  signal?: NodeJS.Signals | null;
  stderr?: Buffer | string;
};

/**
 * Narrows without `instanceof`. An error thrown by node's child_process is not always an
 * instance of the `Error` the caller can see: a vm context, a worker or a jest test
 * environment each supply their own global, and `instanceof` is false across that
 * boundary. Replacing the error there would drop `code`, `status`, `signal` and `stderr`,
 * which are the only things the branches below read, so every one would silently stop
 * firing.
 */
const asChildProcessError = (error: unknown): ChildProcessError =>
  (typeof error === "object" && error !== null
    ? error
    : new Error(String(error))) as ChildProcessError;

/**
 * How git is run. The command is always git, so only its arguments are passed.
 *
 * Injected because one condition cannot be produced in process: a machine with no git.
 * Emptying PATH does not do it under jest, which hands the test a copy of `process.env`
 * while the child reads the real one. A caller with its own reason to control the
 * invocation can supply one too.
 */
export type GitRunner = {
  /** Returns stdout. Throws node's own error, carrying code, status, signal and stderr. */
  exec: (args: string[], options: ExecFileSyncOptions) => string;
  /** Never throws, so a missing binary can be told apart from a command that failed. */
  spawn: (args: string[]) => { status: number | null; stdout: string; error?: unknown };
};

const realGit: GitRunner = {
  exec: (args, options) => String(execFileSync("git", args, options) ?? ""),
  spawn: (args) => {
    const result = spawnSync("git", args, { encoding: "utf8" });
    return { status: result.status, stdout: result.stdout ?? "", error: result.error };
  },
};

/**
 * Whether git ignores `path`, asked of git rather than inferred by reading .gitignore,
 * so nested and negated patterns give the same answer here as they do to git itself.
 *
 * `check-ignore` exits 1 for a path that is NOT ignored, which is not an error, so a
 * non-zero exit is read as false. A path outside any repository is not ignored either.
 *
 * Two details decide whether this answers correctly:
 *
 * The path is made relative to `cwd`. git rejects an absolute path it reads as outside
 * the repository, and on macOS a temp directory reached as /var/... resolves to
 * /private/var/..., so an absolute path that IS inside the repo can be read as outside it.
 *
 * A trailing slash is added, which tells git the path is a directory. The usual pattern
 * for a pulled directory is `name/`, which git matches only against something it knows is
 * a directory, so without the slash a destination that does not exist YET reads as not
 * ignored, and every first pull would be refused.
 */
export function isGitIgnored(path: string, cwd: string, git: GitRunner = realGit): boolean {
  const rel = isAbsolute(path) ? relative(cwd, path) : path;
  if (rel === "" || rel.startsWith("..")) return false;
  const asDirectory = rel.endsWith("/") ? rel : `${rel}/`;
  try {
    git.exec(["-C", cwd, "check-ignore", "--quiet", asDirectory], {
      stdio: ["ignore", "ignore", "ignore"],
    });
    return true;
  } catch (error) {
    // A missing git binary and an unignored path both land here, and answering false for
    // the first would report "git does not ignore it" about a machine that cannot run git
    // at all. Only the second is an answer.
    if (asChildProcessError(error).code === "ENOENT") {
      throw new PullError(GIT_MISSING);
    }
    return false;
  }
}

const GIT_MISSING = "cannot ask git whether the destination is ignored: git is not on PATH";

/**
 * Whether `cwd` is inside a git work tree, so an ignore answer means anything.
 *
 * A missing git binary is separated out rather than folded into the false answer.
 * `spawnSync` reports it on `result.error` instead of throwing, and every real caller
 * reaches this before `isGitIgnored`, so without the check a machine that cannot run git
 * is told its repository "is not inside a git work tree" — the same wrong diagnosis the
 * guard in `isGitIgnored` exists to prevent, on the path that is actually taken.
 */
function insideWorkTree(cwd: string, git: GitRunner): boolean {
  const result = git.spawn(["-C", cwd, "rev-parse", "--is-inside-work-tree"]);
  if (result.error && asChildProcessError(result.error).code === "ENOENT") {
    throw new PullError(GIT_MISSING);
  }
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
function cloneLimits(timeoutMs: number) {
  const ssh = process.env.GIT_SSH_COMMAND ?? "ssh";
  return {
    timeout: timeoutMs,
    env: { ...process.env, GIT_SSH_COMMAND: `${ssh} -o ConnectTimeout=10`, GIT_TERMINAL_PROMPT: "0" },
  };
}

type CloneResult = { dir: string } | { reason: string };

/**
 * git's stderr is carried out rather than dropped. A ref that does not exist, a repository
 * that does not exist, a refused credential and an unreachable network all fail the same
 * clone, and collapsing them to "could not clone" sends someone hunting for a missing
 * branch when the real answer is in the line git already wrote.
 *
 * A killed clone has no stderr to carry, so it is named directly. Without that it reports
 * "could not clone (git exited null)", which reads like a git bug rather than a deadline.
 */
function shallowClone(repo: string, ref: string, timeoutMs: number, git: GitRunner): CloneResult {
  const tmp = mkdtempSync(join(tmpdir(), "pull-gitignored-"));
  try {
    git.exec(["clone", "--quiet", "--depth", "1", "--branch", ref, repo, tmp], {
      stdio: ["ignore", "ignore", "pipe"],
      ...cloneLimits(timeoutMs),
    });
  } catch (error) {
    rmSync(tmp, { recursive: true, force: true });
    const failure = asChildProcessError(error);
    if (failure.signal !== undefined && failure.signal !== null) {
      return { reason: `timed out after ${timeoutMs}ms` };
    }
    const stderr = (failure.stderr ?? "").toString().trim();
    const firstLine = stderr.split("\n").filter(Boolean).pop() ?? "";
    return {
      reason: firstLine === "" ? `could not clone (git exited ${failure.status})` : firstLine,
    };
  }
  return { dir: tmp };
}

function headSha(dir: string, git: GitRunner): string {
  return git.exec(["-C", dir, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
}

export type PullOptions = {
  repo: string;
  /**
   * Tried in order, which lets a caller prefer a feature branch and fall back to the
   * default one. A ref that exists but lacks `subpath` counts as a miss, because the
   * point is to find a ref carrying the content.
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
};

export type PullResult = {
  sha: string;
  ref: string;
};

/**
 * Replace `dest` with `subpath` taken from `repo`, and record the commit it came from.
 *
 * `dest` is deleted outright, so this REFUSES to run unless git ignores it. That check is
 * the reason this function exists: every caller's comment claimed the destination was
 * gitignored and therefore safe to destroy, and nothing verified the claim. A wrong path,
 * a moved directory or an edited .gitignore turns a pull into data loss, and the files it
 * takes are the ones git is not tracking, so there is nothing to restore from.
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
  let clone: string | null = null;
  let usedRef: string | null = null;
  try {
    for (const ref of refs) {
      const result = shallowClone(repo, ref, cloneTimeoutMs, git);
      if (!("dir" in result)) {
        attempted.push(`${ref}: ${result.reason}`);
        continue;
      }
      if (!existsSync(join(result.dir, subpath))) {
        attempted.push(`${ref}: cloned, but has no ${subpath}`);
        rmSync(result.dir, { recursive: true, force: true });
        continue;
      }
      clone = result.dir;
      usedRef = ref;
      break;
    }

    if (clone === null || usedRef === null) {
      throw new PullError(`no ref of ${repo} carries ${subpath}:\n  ${attempted.join("\n  ")}`, {
        attempted,
      });
    }

    const sha = headSha(clone, git);
    rmSync(dest, { recursive: true, force: true });
    cpSync(join(clone, subpath), dest, { recursive: true });
    if (writeShaFile) writeFileSync(join(dest, ".commitSha"), `${sha}\n`);
    return { sha, ref: usedRef };
  } finally {
    if (clone !== null) rmSync(clone, { recursive: true, force: true });
  }
}
