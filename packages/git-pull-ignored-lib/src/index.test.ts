import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { GitRunner, PullError, isGitIgnored, pullGitignored } from "./index";

const made: string[] = [];
const scratch = (name: string) => {
  const dir = mkdtempSync(join(tmpdir(), `${name}-`));
  made.push(dir);
  return dir;
};
const git = (cwd: string, ...args: string[]) =>
  execFileSync("git", ["-C", cwd, ...args], { stdio: "ignore" });

/** A real repo, because the guard's whole value is agreeing with git itself. */
function sourceRepo(files: Record<string, string>) {
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

function consumerRepo(gitignore: string) {
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

  it("takes an absolute path, which is what callers hold", () => {
    const repo = consumerRepo("pulled/\n");
    expect(isGitIgnored(join(repo, "pulled"), repo)).toBe(true);
    expect(isGitIgnored(join(repo, "tracked"), repo)).toBe(false);
  });
});

// The one test that uses a real absent git rather than an injected fake, which is what
// makes it worth its cost: it checks the fake above is faithful. If node ever stopped
// reporting a missing binary the way `noGit` imitates, every in-process test here would
// still pass and this one would fail.
//
// It needs a child process because emptying PATH in this one does nothing: jest hands the
// test a COPY of process.env while child_process reads the real one. tsx lets the child
// run the source, so the test does not depend on `dist` existing.
describe("with git missing from PATH", () => {
  const inChildWithoutPath = (body: string) =>
    execFileSync(
      process.execPath,
      ["--import", "tsx", "--input-type=module", "-e", body],
      { cwd: __dirname, encoding: "utf8", env: { PATH: "", HOME: process.env.HOME ?? "" } },
    ).trim();

  it("says git is missing, rather than blaming the work tree", () => {
    // Through pullGitignored, which is the path every caller takes. It asks whether cwd is
    // a work tree first, and git being absent used to answer "no" there, reporting a
    // missing binary as a repository that is not a repository.
    const output = inChildWithoutPath(
      `const { pullGitignored } = await import("${join(__dirname, "index.ts")}");
       try {
         pullGitignored({ repo: "/tmp/x", refs: ["main"], subpath: "s", dest: "/tmp/x/pulled", cwd: "/tmp" });
         console.log("NO_THROW");
       } catch (error) { console.log(error.message); }`,
    );
    expect(output.split("\n")[0]).toBe(
      "cannot ask git whether the destination is ignored: git is not on PATH",
    );
  });
});

// A machine with no git, which the injected runner is what makes reachable in process.
// node reports the missing binary two different ways, and each is a separate branch:
// the throwing call carries `code` on the error, the non-throwing one reports it on
// `result.error`.
describe("git missing from PATH", () => {
  const enoent = () => Object.assign(new Error("spawn git ENOENT"), { code: "ENOENT" });
  const noGit: GitRunner = {
    exec: () => { throw enoent(); },
    spawn: () => ({ status: null, stdout: "", error: enoent() }),
  };

  it("is told apart from a path git does not ignore", () => {
    // Both land in the same catch, and answering false for the first would report
    // "git does not ignore it" about a machine that cannot run git at all.
    expect(() => isGitIgnored("pulled", "/tmp", noGit)).toThrow(/git is not on PATH/);
  });

  it("is named by the public entry, rather than blamed on the work tree", () => {
    // pullGitignored asks whether cwd is a work tree first, and a missing git used to
    // answer "no" there, reporting a missing binary as a directory that is not a repo.
    expect(() =>
      pullGitignored({
        repo: "/tmp/x", refs: ["main"], subpath: "s", dest: "/tmp/x/pulled", cwd: "/tmp",
        git: noGit,
      }),
    ).toThrow(/git is not on PATH/);
  });

  it("does not report a failed git command as a missing one", () => {
    // The ENOENT check must read the error's code, not merely its presence: a command
    // that ran and failed also arrives on `result.error`/as a throw.
    const failing: GitRunner = {
      exec: () => { throw Object.assign(new Error("exit 1"), { status: 1 }); },
      spawn: () => ({ status: 128, stdout: "", error: undefined }),
    };
    expect(isGitIgnored("pulled", "/tmp", failing)).toBe(false);
    expect(() =>
      pullGitignored({
        repo: "/tmp/x", refs: ["main"], subpath: "s", dest: "/tmp/x/pulled", cwd: "/tmp",
        git: failing,
      }),
    ).toThrow(/not inside a git work tree/);
  });
});

describe("with a scripted git", () => {
  /** In a work tree, destination ignored, and the clone doing whatever is asked. */
  const scripted = (onClone: () => void): GitRunner => ({
    spawn: () => ({ status: 0, stdout: "true\n" }),
    exec: (args) => {
      if (args.includes("clone")) onClone();
      return "";
    },
  });

  it("falls back to git's exit code when the clone failed silently", () => {
    // git normally explains itself on stderr and that wording is carried out verbatim.
    // With nothing written, the exit code is all there is, and the message has to say so
    // rather than reporting an empty reason.
    try {
      pullGitignored({
        repo: "/tmp/x", refs: ["main"], subpath: "s", dest: "/tmp/x/pulled", cwd: "/tmp",
        git: scripted(() => { throw Object.assign(new Error("exit 1"), { status: 1 }); }),
      });
      throw new Error("expected a PullError");
    } catch (error) {
      expect(error).toBeInstanceOf(PullError);
      expect((error as PullError).attempted).toEqual(["main: could not clone (git exited 1)"]);
    }
  });

  it("survives a thrown value that is not an object at all", () => {
    // Nothing stops a throw of a string, and the branches that follow read properties off
    // it. Answering false is the safe end: the caller refuses to delete.
    const threw: GitRunner = {
      spawn: () => ({ status: 0, stdout: "true\n" }),
      exec: () => { throw "not an object"; },
    };
    expect(isGitIgnored("pulled", "/tmp", threw)).toBe(false);
  });
});

describe("pullGitignored", () => {
  it("copies the subdirectory and records the commit", () => {
    const source = sourceRepo({ "guidance/a.md": "A", "guidance/nested/b.md": "B", "other.md": "X" });
    const consumer = consumerRepo("pulled/\n");
    const dest = join(consumer, "pulled");

    const { sha, ref } = pullGitignored({
      repo: source, refs: ["main"], subpath: "guidance", dest, cwd: consumer,
    });

    expect(ref).toBe("main");
    expect(sha).toMatch(/^[0-9a-f]{40}$/);
    expect(readFileSync(join(dest, "a.md"), "utf8")).toBe("A");
    expect(readFileSync(join(dest, "nested/b.md"), "utf8")).toBe("B");
    // Only the subpath, not the whole repository.
    expect(existsSync(join(dest, "other.md"))).toBe(false);
    expect(readFileSync(join(dest, ".commitSha"), "utf8").trim()).toBe(sha);
  });

  it("leaves out the sha file when the caller does not want one", () => {
    const source = sourceRepo({ "guidance/a.md": "A" });
    const consumer = consumerRepo("pulled/\n");
    const dest = join(consumer, "pulled");

    const { sha } = pullGitignored({
      repo: source, refs: ["main"], subpath: "guidance", dest, cwd: consumer,
      writeShaFile: false,
    });

    // Still reported to the caller, just not written into the pulled directory, which is
    // the point: a consumer that tracks the sha itself does not want the file.
    expect(sha).toMatch(/^[0-9a-f]{40}$/);
    expect(existsSync(join(dest, "a.md"))).toBe(true);
    expect(existsSync(join(dest, ".commitSha"))).toBe(false);
  });

  it("refuses a destination git does not ignore, and does not touch it", () => {
    const source = sourceRepo({ "guidance/a.md": "A" });
    const consumer = consumerRepo("pulled/\n");
    const dest = join(consumer, "tracked");
    mkdirSync(dest);
    writeFileSync(join(dest, "keep.md"), "KEEP");

    expect(() =>
      pullGitignored({ repo: source, refs: ["main"], subpath: "guidance", dest, cwd: consumer }),
    ).toThrow(/git does not ignore it/);
    expect(readFileSync(join(dest, "keep.md"), "utf8")).toBe("KEEP");
  });

  it("drops a file deleted upstream, rather than leaving it behind", () => {
    const source = sourceRepo({ "guidance/a.md": "A", "guidance/gone.md": "G" });
    const consumer = consumerRepo("pulled/\n");
    const dest = join(consumer, "pulled");

    pullGitignored({ repo: source, refs: ["main"], subpath: "guidance", dest, cwd: consumer });
    expect(existsSync(join(dest, "gone.md"))).toBe(true);

    rmSync(join(source, "guidance/gone.md"));
    git(source, "add", "-A");
    git(source, "-c", "user.email=t@t.t", "-c", "user.name=t", "commit", "--quiet", "-m", "drop");

    pullGitignored({ repo: source, refs: ["main"], subpath: "guidance", dest, cwd: consumer });
    expect(existsSync(join(dest, "gone.md"))).toBe(false);
    expect(existsSync(join(dest, "a.md"))).toBe(true);
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
      expect((error as PullError).attempted[0]).not.toBe("main: could not clone");
      expect((error as PullError).attempted[0]).toMatch(/repository|does not exist|not found/i);
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
      expect((error as PullError).attempted).toEqual(["main: cloned, but has no absent"]);
    }
  });

  it("kills a clone that outlives its deadline, and says the deadline is why", () => {
    const source = sourceRepo({ "guidance/a.md": "A" });
    const consumer = consumerRepo("pulled/\n");

    // 1ms cannot span spawning a process, so the clone is always still running when the
    // deadline lands. A killed child carries a signal and no stderr, which without that
    // branch reports "git exited null" and reads as a git bug.
    try {
      pullGitignored({
        repo: source, refs: ["main"], subpath: "guidance",
        dest: join(consumer, "pulled"), cwd: consumer, cloneTimeoutMs: 1,
      });
      throw new Error("expected a PullError");
    } catch (error) {
      expect(error).toBeInstanceOf(PullError);
      expect((error as PullError).attempted).toEqual(["main: timed out after 1ms"]);
    }
  });
});
