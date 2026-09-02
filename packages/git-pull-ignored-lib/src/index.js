import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join, relative } from "node:path";
// Imported rather than taken off the global, so the package needs no node globals in its
// lint config to read one environment variable.
import process from "node:process";

/** A failure the caller is expected to print and exit on, rather than a bug. */
export class PullError extends Error {
  constructor(message, { attempted = [] } = {}) {
    super(message);
    this.name = "PullError";
    this.attempted = attempted;
  }
}

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
 * a directory — so without the slash, a destination that does not exist YET reads as not
 * ignored, and every first pull would be refused.
 */
export function isGitIgnored(path, cwd) {
  const rel = isAbsolute(path) ? relative(cwd, path) : path;
  if (rel === "" || rel.startsWith("..")) return false;
  const asDirectory = rel.endsWith("/") ? rel : `${rel}/`;
  try {
    execFileSync("git", ["-C", cwd, "check-ignore", "--quiet", asDirectory], {
      stdio: ["ignore", "ignore", "ignore"],
    });
    return true;
  } catch (error) {
    // A missing git binary and an unignored path both land here, and answering false for
    // the first would report "git does not ignore it" about a machine that cannot run git
    // at all. Only the second is an answer.
    if (error.code === "ENOENT") {
      throw new PullError("cannot ask git whether the destination is ignored: git is not on PATH");
    }
    return false;
  }
}

/** Whether `cwd` is inside a git work tree, so an ignore answer means anything. */
function insideWorkTree(cwd) {
  const result = spawnSync("git", ["-C", cwd, "rev-parse", "--is-inside-work-tree"], {
    encoding: "utf8",
  });
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
function cloneLimits(timeoutMs) {
  const ssh = process.env.GIT_SSH_COMMAND ?? "ssh";
  return {
    timeout: timeoutMs,
    env: { ...process.env, GIT_SSH_COMMAND: `${ssh} -o ConnectTimeout=10`, GIT_TERMINAL_PROMPT: "0" },
  };
}

/**
 * @returns {{ dir: string } | { reason: string }} the clone, or why git would not make one
 *
 * git's stderr is carried out rather than dropped. A ref that does not exist, a repository
 * that does not exist, a refused credential and an unreachable network all fail the same
 * clone, and collapsing them to "could not clone" sends someone hunting for a missing
 * branch when the real answer is in the line git already wrote.
 *
 * A killed clone has no stderr to carry, so it is named directly. Without that it reports
 * "could not clone (git exited null)", which reads like a git bug rather than a deadline.
 */
function shallowClone(repo, ref, timeoutMs) {
  const tmp = mkdtempSync(join(tmpdir(), "pull-gitignored-"));
  try {
    execFileSync("git", ["clone", "--quiet", "--depth", "1", "--branch", ref, repo, tmp], {
      stdio: ["ignore", "ignore", "pipe"],
      ...cloneLimits(timeoutMs),
    });
  } catch (error) {
    rmSync(tmp, { recursive: true, force: true });
    if (error.signal !== undefined && error.signal !== null) {
      return { reason: `timed out after ${timeoutMs}ms` };
    }
    const stderr = (error.stderr ?? "").toString().trim();
    const firstLine = stderr.split("\n").filter(Boolean).pop() ?? "";
    return { reason: firstLine === "" ? `could not clone (git exited ${error.status})` : firstLine };
  }
  return { dir: tmp };
}

function headSha(dir) {
  return execFileSync("git", ["-C", dir, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
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
 * `refs` is tried in order, which lets a caller prefer a feature branch and fall back to
 * the default one. A ref that exists but lacks `subpath` counts as a miss, because the
 * point is to find a ref carrying the content.
 *
 * `cloneTimeoutMs` bounds each clone attempt, not the call: a caller passing three refs
 * waits up to three times that in the worst case, which is the same shape as the retries
 * themselves.
 *
 * @returns {{ sha: string, ref: string }} the commit and the ref it was reached by
 */
export function pullGitignored({
  repo,
  refs,
  subpath,
  dest,
  cwd,
  writeShaFile = true,
  cloneTimeoutMs = CLONE_TIMEOUT_MS,
}) {
  if (!insideWorkTree(cwd)) {
    throw new PullError(
      `refusing to replace ${dest}: ${cwd} is not inside a git work tree.\n` +
        `This directory is deleted and rewritten, so the only thing that makes it safe is\n` +
        `git saying it is ignored, and outside a repository git has no answer to give.\n` +
        `Point cwd at the repository that ignores dest.`,
    );
  }

  if (!isGitIgnored(dest, cwd)) {
    throw new PullError(
      `refusing to replace ${dest}: git does not ignore it.\n` +
        `This directory is deleted and rewritten, so it has to be gitignored — otherwise a\n` +
        `pull would destroy tracked or untracked work with nothing to restore from.\n` +
        `Add it to .gitignore, or point dest at a directory that is already ignored.`,
    );
  }

  const attempted = [];
  let clone = null;
  let usedRef = null;
  try {
    for (const ref of refs) {
      const result = shallowClone(repo, ref, cloneTimeoutMs);
      if (result.dir === undefined) {
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

    if (clone === null) {
      throw new PullError(`no ref of ${repo} carries ${subpath}:\n  ${attempted.join("\n  ")}`, {
        attempted,
      });
    }

    const sha = headSha(clone);
    rmSync(dest, { recursive: true, force: true });
    cpSync(join(clone, subpath), dest, { recursive: true });
    if (writeShaFile) writeFileSync(join(dest, ".commitSha"), `${sha}\n`);
    return { sha, ref: usedRef };
  } finally {
    if (clone !== null) rmSync(clone, { recursive: true, force: true });
  }
}
