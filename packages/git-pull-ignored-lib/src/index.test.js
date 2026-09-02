import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
// Imported rather than taken off the global, matching src/index.js, so the package needs
// no node globals in its lint config.
import process from "node:process";
import { afterEach, describe, expect, it } from "vitest";
import { PullError, isGitIgnored, pullGitignored } from "./index.js";

const made = [];
const scratch = (name) => {
  const dir = mkdtempSync(join(tmpdir(), `${name}-`));
  made.push(dir);
  return dir;
};
const git = (cwd, ...args) => execFileSync("git", ["-C", cwd, ...args], { stdio: "ignore" });

/** A real repo, because the guard's whole value is agreeing with git itself. */
function sourceRepo(files) {
  const dir = scratch("source");
  git(dir, "init", "--quiet", "--initial-branch", "main");
  for (const [rel, body] of Object.entries(files)) {
    const abs = join(dir, rel);
    mkdirSync(join(abs, ".."), { recursive: true });
    writeFileSync(abs, body);
  }
  git(dir, "add", "-A");
  git(dir, "-c", "user.email=t@t.t", "-c", "user.name=t", "commit", "--quiet", "-m", "init");
  return dir;
}

function consumerRepo(gitignore) {
  const dir = scratch("consumer");
  git(dir, "init", "--quiet", "--initial-branch", "main");
  writeFileSync(join(dir, ".gitignore"), gitignore);
  return dir;
}

afterEach(() => {
  for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("isGitIgnored", () => {
  it("agrees with git", () => {
    const repo = consumerRepo("pulled/\n");
    expect(isGitIgnored("pulled", repo)).toBe(true);
    expect(isGitIgnored("tracked", repo)).toBe(false);
  });

  it("answers for a directory that does not exist yet, which every first pull is", () => {
    const repo = consumerRepo("pulled/\n");
    expect(existsSync(join(repo, "pulled"))).toBe(false);
    expect(isGitIgnored("pulled", repo)).toBe(true);
  });

  it("answers false for a path outside the repository, rather than asking git about it", () => {
    const repo = consumerRepo("pulled/\n");
    // git rejects a path it reads as outside the work tree, so these are decided before
    // it is asked. "not ignored" is the safe answer: the caller refuses to delete.
    expect(isGitIgnored("../pulled", repo)).toBe(false);
    expect(isGitIgnored(repo, repo)).toBe(false);
  });

  it("takes a path that already ends in a slash, which is how .gitignore writes one", () => {
    const repo = consumerRepo("pulled/\n");
    expect(isGitIgnored("pulled/", repo)).toBe(true);
  });

  it("says git is missing rather than reporting the destination as unignored", () => {
    const repo = consumerRepo("pulled/\n");
    const path = process.env.PATH;
    // An unreachable git and an unignored path both make execFileSync throw. Answering
    // false here would tell the caller "git does not ignore it" about a machine that
    // cannot run git at all, and the caller would refuse for the wrong reason.
    process.env.PATH = "";
    try {
      expect(() => isGitIgnored("pulled", repo)).toThrow(/git is not on PATH/);
    } finally {
      process.env.PATH = path;
    }
  });

  it("takes an absolute path, which is what callers hold", () => {
    const repo = consumerRepo("pulled/\n");
    expect(isGitIgnored(join(repo, "pulled"), repo)).toBe(true);
  });
});

describe("pullGitignored", () => {
  it("copies the subdirectory and records the commit", () => {
    const source = sourceRepo({ "guidance/a.md": "A", "guidance/nested/b.md": "B", "other.md": "x" });
    const consumer = consumerRepo("pulled/\n");
    const dest = join(consumer, "pulled");

    const { sha, ref } = pullGitignored({
      repo: source, refs: ["main"], subpath: "guidance", dest, cwd: consumer,
    });

    expect(ref).toBe("main");
    expect(sha).toMatch(/^[0-9a-f]{40}$/);
    expect(readFileSync(join(dest, "a.md"), "utf8")).toBe("A");
    expect(readFileSync(join(dest, "nested/b.md"), "utf8")).toBe("B");
    expect(readFileSync(join(dest, ".commitSha"), "utf8").trim()).toBe(sha);
    // Only the named subdirectory travels.
    expect(existsSync(join(dest, "other.md"))).toBe(false);
  });

  it("leaves out the sha file when the caller does not want one", () => {
    const source = sourceRepo({ "guidance/a.md": "A" });
    const consumer = consumerRepo("pulled/\n");
    const dest = join(consumer, "pulled");

    const { sha } = pullGitignored({
      repo: source, refs: ["main"], subpath: "guidance", dest, cwd: consumer,
      writeShaFile: false,
    });

    // Still reported to the caller, just not written into the pulled directory — which
    // is the point: a consumer that tracks the sha itself does not want the file.
    expect(sha).toMatch(/^[0-9a-f]{40}$/);
    expect(existsSync(join(dest, "a.md"))).toBe(true);
    expect(existsSync(join(dest, ".commitSha"))).toBe(false);
  });

  it("refuses a destination git does not ignore, and does not touch it", () => {
    const source = sourceRepo({ "guidance/a.md": "A" });
    const consumer = consumerRepo("something-else/\n");
    const dest = join(consumer, "tracked");
    mkdirSync(dest);
    writeFileSync(join(dest, "precious.md"), "do not lose me");

    expect(() =>
      pullGitignored({ repo: source, refs: ["main"], subpath: "guidance", dest, cwd: consumer }),
    ).toThrow(PullError);
    expect(readFileSync(join(dest, "precious.md"), "utf8")).toBe("do not lose me");
  });

  it("drops a file deleted upstream, rather than leaving it behind", () => {
    const source = sourceRepo({ "guidance/a.md": "A", "guidance/stale.md": "old" });
    const consumer = consumerRepo("pulled/\n");
    const dest = join(consumer, "pulled");
    pullGitignored({ repo: source, refs: ["main"], subpath: "guidance", dest, cwd: consumer });
    expect(existsSync(join(dest, "stale.md"))).toBe(true);

    rmSync(join(source, "guidance/stale.md"));
    git(source, "add", "-A");
    git(source, "-c", "user.email=t@t.t", "-c", "user.name=t", "commit", "--quiet", "-m", "drop");

    pullGitignored({ repo: source, refs: ["main"], subpath: "guidance", dest, cwd: consumer });
    expect(existsSync(join(dest, "stale.md"))).toBe(false);
  });

  it("names git's own reason when the clone fails, rather than blaming the ref", () => {
    const consumer = consumerRepo("pulled/\n");
    const dest = join(consumer, "pulled");

    try {
      pullGitignored({
        repo: join(consumer, "no-such-repo"), refs: ["main"], subpath: "x", dest, cwd: consumer,
      });
      throw new Error("expected a PullError");
    } catch (error) {
      expect(error).toBeInstanceOf(PullError);
      // The point is that git's wording survives; "could not clone" alone would read as a
      // missing branch when the repository is what is missing.
      expect(error.attempted[0]).not.toBe("main: could not clone");
      expect(error.attempted[0]).toMatch(/repository|does not exist|not found/i);
    }
  });

  it("says so when cwd is not a repository, instead of blaming .gitignore", () => {
    const loose = scratch("loose");
    expect(() =>
      pullGitignored({
        repo: loose, refs: ["main"], subpath: "x", dest: join(loose, "pulled"), cwd: loose,
      }),
    ).toThrow(/not inside a git work tree/);
  });

  it("falls back through refs and reports every attempt when none carries the subpath", () => {
    const source = sourceRepo({ "guidance/a.md": "A" });
    const consumer = consumerRepo("pulled/\n");
    const dest = join(consumer, "pulled");

    const { ref } = pullGitignored({
      repo: source, refs: ["no-such-branch", "main"], subpath: "guidance", dest, cwd: consumer,
    });
    expect(ref).toBe("main");

    try {
      pullGitignored({ repo: source, refs: ["main"], subpath: "absent", dest, cwd: consumer });
      throw new Error("expected a PullError");
    } catch (error) {
      expect(error).toBeInstanceOf(PullError);
      expect(error.attempted).toEqual(["main: cloned, but has no absent"]);
    }
  });

  it("kills a clone that outlives its deadline, and says the deadline is why", () => {
    const source = sourceRepo({ "guidance/a.md": "A" });
    const consumer = consumerRepo("pulled/\n");

    // 1ms cannot span spawning a process, so the clone is always still running when the
    // deadline lands. A killed child carries a signal and no stderr, which without this
    // branch reports "git exited null" and reads as a git bug.
    try {
      pullGitignored({
        repo: source, refs: ["main"], subpath: "guidance",
        dest: join(consumer, "pulled"), cwd: consumer, cloneTimeoutMs: 1,
      });
      throw new Error("expected a PullError");
    } catch (error) {
      expect(error).toBeInstanceOf(PullError);
      expect(error.attempted).toEqual(["main: timed out after 1ms"]);
    }
  });
});
