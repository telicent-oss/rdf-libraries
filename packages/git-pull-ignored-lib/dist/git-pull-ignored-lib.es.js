import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, cpSync, writeFileSync, readdirSync, renameSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, relative, sep, join } from "node:path";
class PullError extends Error {
  attempted;
  constructor(message, { attempted = [] } = {}) {
    super(message);
    this.name = "PullError";
    this.attempted = attempted;
  }
}
const GIT_MISSING = "cannot ask git whether the destination is ignored: git is not on PATH";
const realGit = (args, options = {}) => {
  const result = spawnSync("git", args, { encoding: "utf8", ...options });
  return {
    status: result.status,
    signal: result.signal,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    error: result.error
  };
};
function failedWith(result, code) {
  return result.error?.code === code;
}
function refuseIfGitMissing(result) {
  if (failedWith(result, "ENOENT"))
    throw new PullError(GIT_MISSING);
}
function isGitIgnored(path, cwd, git = realGit) {
  const rel = (isAbsolute(path) ? relative(cwd, path) : path).split(sep).join("/");
  if (rel === "" || rel.startsWith(".."))
    return false;
  const asDirectory = rel.endsWith("/") ? rel : `${rel}/`;
  const result = git(["-C", cwd, "check-ignore", "--quiet", asDirectory]);
  refuseIfGitMissing(result);
  return result.status === 0;
}
function insideWorkTree(cwd, git) {
  const result = git(["-C", cwd, "rev-parse", "--is-inside-work-tree"]);
  refuseIfGitMissing(result);
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
function shallowClone(repo, ref, subpath, timeoutMs, git) {
  const tmp = mkdtempSync(join(tmpdir(), "pull-gitignored-"));
  const discard = (reason) => {
    rmSync(tmp, { recursive: true, force: true });
    return { reason };
  };
  const result = git(["clone", "--quiet", "--depth", "1", "--branch", ref, repo, tmp], cloneLimits(timeoutMs));
  if (failedWith(result, "ENOENT")) {
    rmSync(tmp, { recursive: true, force: true });
    throw new PullError(GIT_MISSING);
  }
  if (failedWith(result, "ETIMEDOUT"))
    return discard(`timed out after ${timeoutMs}ms`);
  if (result.signal !== null)
    return discard(`killed by ${result.signal}`);
  if (result.status !== 0) {
    const lastLine = result.stderr.trim().split("\n").filter(Boolean).pop() ?? "";
    return discard(lastLine === "" ? `could not clone (git exited ${result.status})` : lastLine);
  }
  if (!existsSync(join(tmp, subpath)))
    return discard(`cloned, but has no ${subpath}`);
  return { dir: tmp, ref };
}
function headSha(dir, git) {
  const result = git(["-C", dir, "rev-parse", "HEAD"]);
  refuseIfGitMissing(result);
  if (result.status !== 0) {
    throw new PullError(`cloned ${dir} but could not read its HEAD: ${result.stderr.trim()}`);
  }
  return result.stdout.trim();
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
  let staging = null;
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
      throw new PullError(`no ref of ${repo} carries ${subpath}:
  ${attempted.join("\n  ")}`, {
        attempted
      });
    }
    const sha = headSha(clone.dir, git);
    mkdirSync(dest, { recursive: true });
    staging = mkdtempSync(join(dest, ".pull-gitignored-"));
    rmSync(staging, { recursive: true, force: true });
    try {
      cpSync(join(clone.dir, subpath), staging, { recursive: true });
      if (writeShaFile)
        writeFileSync(join(staging, ".commitSha"), `${sha}
`);
    } catch (error) {
      throw new PullError(
        `could not assemble ${subpath} from ${repo} in ${dest}: ${error.message}
Nothing was removed: the previous contents of ${dest} are untouched.`
      );
    }
    for (const entry of readdirSync(dest)) {
      if (join(dest, entry) !== staging)
        rmSync(join(dest, entry), { recursive: true, force: true });
    }
    for (const entry of readdirSync(staging)) {
      renameSync(join(staging, entry), join(dest, entry));
    }
    return { sha, ref: clone.ref };
  } finally {
    if (clone !== null)
      rmSync(clone.dir, { recursive: true, force: true });
    if (staging !== null)
      rmSync(staging, { recursive: true, force: true });
  }
}
export {
  PullError,
  isGitIgnored,
  pullGitignored
};
