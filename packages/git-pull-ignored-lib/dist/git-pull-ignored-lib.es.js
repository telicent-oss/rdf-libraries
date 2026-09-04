import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, rmSync, cpSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, relative, join } from "node:path";
class PullError extends Error {
  attempted;
  constructor(message, { attempted = [] } = {}) {
    super(message);
    this.name = "PullError";
    this.attempted = attempted;
  }
}
const asChildProcessError = (error) => typeof error === "object" && error !== null ? error : new Error(String(error));
const realGit = {
  exec: (args, options) => String(execFileSync("git", args, options) ?? ""),
  spawn: (args) => {
    const result = spawnSync("git", args, { encoding: "utf8" });
    return { status: result.status, stdout: result.stdout ?? "", error: result.error };
  }
};
function isGitIgnored(path, cwd, git = realGit) {
  const rel = isAbsolute(path) ? relative(cwd, path) : path;
  if (rel === "" || rel.startsWith(".."))
    return false;
  const asDirectory = rel.endsWith("/") ? rel : `${rel}/`;
  try {
    git.exec(["-C", cwd, "check-ignore", "--quiet", asDirectory], {
      stdio: ["ignore", "ignore", "ignore"]
    });
    return true;
  } catch (error) {
    if (asChildProcessError(error).code === "ENOENT") {
      throw new PullError(GIT_MISSING);
    }
    return false;
  }
}
const GIT_MISSING = "cannot ask git whether the destination is ignored: git is not on PATH";
function insideWorkTree(cwd, git) {
  const result = git.spawn(["-C", cwd, "rev-parse", "--is-inside-work-tree"]);
  if (result.error && asChildProcessError(result.error).code === "ENOENT") {
    throw new PullError(GIT_MISSING);
  }
  return result.status === 0 && result.stdout.trim() === "true";
}
const CLONE_TIMEOUT_MS = 6e4;
function cloneLimits(timeoutMs) {
  const ssh = process.env.GIT_SSH_COMMAND ?? "ssh";
  return {
    timeout: timeoutMs,
    env: { ...process.env, GIT_SSH_COMMAND: `${ssh} -o ConnectTimeout=10`, GIT_TERMINAL_PROMPT: "0" }
  };
}
function shallowClone(repo, ref, timeoutMs, git) {
  const tmp = mkdtempSync(join(tmpdir(), "pull-gitignored-"));
  try {
    git.exec(["clone", "--quiet", "--depth", "1", "--branch", ref, repo, tmp], {
      stdio: ["ignore", "ignore", "pipe"],
      ...cloneLimits(timeoutMs)
    });
  } catch (error) {
    rmSync(tmp, { recursive: true, force: true });
    const failure = asChildProcessError(error);
    if (failure.signal !== void 0 && failure.signal !== null) {
      return { reason: `timed out after ${timeoutMs}ms` };
    }
    const stderr = (failure.stderr ?? "").toString().trim();
    const firstLine = stderr.split("\n").filter(Boolean).pop() ?? "";
    return {
      reason: firstLine === "" ? `could not clone (git exited ${failure.status})` : firstLine
    };
  }
  return { dir: tmp };
}
function headSha(dir, git) {
  return git.exec(["-C", dir, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
}
function pullGitignored({
  repo,
  refs,
  subpath,
  dest,
  cwd,
  writeShaFile = true,
  cloneTimeoutMs = CLONE_TIMEOUT_MS,
  git = realGit
}) {
  if (!insideWorkTree(cwd, git)) {
    throw new PullError(
      `refusing to replace ${dest}: ${cwd} is not inside a git work tree.
This directory is deleted and rewritten, so the only thing that makes it safe is
git saying it is ignored, and outside a repository git has no answer to give.
Point cwd at the repository that ignores dest.`
    );
  }
  if (!isGitIgnored(dest, cwd, git)) {
    throw new PullError(
      `refusing to replace ${dest}: git does not ignore it.
This directory is deleted and rewritten, so it has to be gitignored, otherwise a
pull would destroy tracked or untracked work with nothing to restore from.
Add it to .gitignore, or point dest at a directory that is already ignored.`
    );
  }
  const attempted = [];
  let clone = null;
  let usedRef = null;
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
      throw new PullError(`no ref of ${repo} carries ${subpath}:
  ${attempted.join("\n  ")}`, {
        attempted
      });
    }
    const sha = headSha(clone, git);
    rmSync(dest, { recursive: true, force: true });
    cpSync(join(clone, subpath), dest, { recursive: true });
    if (writeShaFile)
      writeFileSync(join(dest, ".commitSha"), `${sha}
`);
    return { sha, ref: usedRef };
  } finally {
    if (clone !== null)
      rmSync(clone, { recursive: true, force: true });
  }
}
export {
  PullError,
  isGitIgnored,
  pullGitignored
};
//# sourceMappingURL=git-pull-ignored-lib.es.js.map
