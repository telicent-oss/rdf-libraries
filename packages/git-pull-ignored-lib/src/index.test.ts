import { execFileSync, spawnSync } from "node:child_process";
import {
  existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { GitResult, GitRunner, PullError, isGitIgnored, pullGitignored } from "./index";

const ran = (fields: Partial<GitResult> = {}): GitResult => ({
  status: 0, signal: null, stdout: "", stderr: "", ...fields,
});

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

/**
 * The library only clones an https:// or ssh:// URL. A fixture repo on disk cannot be named
 * directly. So the runner swaps this URL back to the fixture path, and every git call is real.
 */
const FIXTURE_URL = "https://github.com/test-org/source.git";
const gitFromFixture =
  (source: string): GitRunner =>
  (args, options = {}) => {
    const result = spawnSync("git", args.map((arg) => (arg === FIXTURE_URL ? source : arg)), {
      encoding: "utf8",
      ...options,
    });
    return {
      status: result.status, signal: result.signal,
      stdout: result.stdout ?? "", stderr: result.stderr ?? "", error: result.error,
    };
  };

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
    // "not ignored" is the safe answer. The caller then refuses to delete.
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

// The only test that uses a real absent git. It checks the `noGit` fake below is faithful.
// It needs a child process, because emptying PATH in this one does not reach a spawned git.
describe("with git missing from PATH", () => {
  const inChildWithoutPath = (body: string) =>
    execFileSync(
      process.execPath,
      ["--import", "tsx", "--input-type=module", "-e", body],
      { cwd: __dirname, encoding: "utf8", env: { PATH: "", HOME: process.env.HOME ?? "" } },
    ).trim();

  it("says git is missing, rather than blaming the work tree", () => {
    const output = inChildWithoutPath(
      `const { pullGitignored } = await import("${join(__dirname, "index.ts")}");
       try {
         pullGitignored({ repo: "https://github.com/test-org/source.git", refs: ["main"], subpath: "s", dest: "/tmp/x/pulled", cwd: "/tmp" });
         console.log("NO_THROW");
       } catch (error) { console.log(error.message); }`,
    );
    expect(output.split("\n")[0]).toBe(
      "cannot ask git whether the destination is ignored: git is not on PATH",
    );
  });
});

describe("git missing from PATH", () => {
  const noGit: GitRunner = () =>
    ran({ status: null, error: Object.assign(new Error("spawn git ENOENT"), { code: "ENOENT" }) });

  it("is told apart from a path git does not ignore", () => {
    expect(() => isGitIgnored("pulled", "/tmp", noGit)).toThrow(/git is not on PATH/);
  });

  it("is named by the public entry, rather than blamed on the work tree", () => {
    expect(() =>
      pullGitignored({
        repo: FIXTURE_URL, refs: ["main"], subpath: "s", dest: "/tmp/x/pulled", cwd: "/tmp",
        git: noGit,
      }),
    ).toThrow(/git is not on PATH/);
  });

  it("does not report a failed git command as a missing one", () => {
    const failing: GitRunner = () => ran({ status: 128, stderr: "fatal: not a git repository\n" });
    expect(isGitIgnored("pulled", "/tmp", failing)).toBe(false);
    expect(() =>
      pullGitignored({
        repo: FIXTURE_URL, refs: ["main"], subpath: "s", dest: "/tmp/x/pulled", cwd: "/tmp",
        git: failing,
      }),
    ).toThrow(/not inside a git work tree/);
  });
});

describe("with a scripted git", () => {
  const scripted = (onClone: GitResult): GitRunner => (args) =>
    args.includes("clone") ? onClone : ran({ stdout: "true\n" });

  const attemptsFrom = (git: GitRunner): string[] => {
    try {
      pullGitignored({
        repo: FIXTURE_URL, refs: ["main"], subpath: "s", dest: "/tmp/x/pulled", cwd: "/tmp", git,
      });
      throw new Error("expected a PullError");
    } catch (error) {
      expect(error).toBeInstanceOf(PullError);
      return (error as PullError).attempted;
    }
  };

  it("falls back to git's exit code when the clone failed silently", () => {
    expect(attemptsFrom(scripted(ran({ status: 1 })))).toEqual([
      "main: could not clone (git exited 1)",
    ]);
  });

  it("names the deadline only when the deadline is what killed the clone", () => {
    expect(
      attemptsFrom(
        scripted(ran({
          status: null, signal: "SIGTERM",
          error: Object.assign(new Error("spawnSync git ETIMEDOUT"), { code: "ETIMEDOUT" }),
        })),
      ),
    ).toEqual(["main: timed out after 60000ms"]);
    expect(attemptsFrom(scripted(ran({ status: null, signal: "SIGSEGV" })))).toEqual([
      "main: killed by SIGSEGV",
    ]);
  });

  // Only reachable through an injected runner. With the real one, insideWorkTree raises first.
  it("stops at the first clone when the runner reports git missing", () => {
    const noGit: GitRunner = (args) =>
      args.includes("clone")
        ? ran({ status: null, error: Object.assign(new Error("ENOENT"), { code: "ENOENT" }) })
        : ran({ stdout: "true\n" });
    expect(() =>
      pullGitignored({
        repo: FIXTURE_URL, refs: ["a", "b"], subpath: "s", dest: "/tmp/x/pulled", cwd: "/tmp",
        git: noGit,
      }),
    ).toThrow(/git is not on PATH/);
  });
});

// git reads a leading dash as an option wherever it sits. `--upload-pack=<command>` then
// turns a clone into an arbitrary command.
describe("an argument that git would read as an option", () => {
  const shouldNotRun: GitRunner = () => {
    throw new Error("git was invoked with an option-shaped argument");
  };

  it("refuses a cwd that starts with a dash, before running git at all", () => {
    expect(() =>
      pullGitignored({
        repo: FIXTURE_URL, refs: ["main"], subpath: "s", dest: "pulled",
        cwd: "--upload-pack=touch /tmp/pwned", git: shouldNotRun,
      }),
    ).toThrow(/cwd starts with a dash/);
  });

  it("refuses a dest that starts with a dash", () => {
    const inWorkTree: GitRunner = (args) =>
      args.includes("rev-parse") ? ran({ stdout: "true\n" }) : shouldNotRun(args);

    expect(() =>
      pullGitignored({
        repo: FIXTURE_URL, refs: ["main"], subpath: "s", dest: "--output=/tmp/pwned", cwd: "/tmp",
        git: inWorkTree,
      }),
    ).toThrow(/dest starts with a dash/);
    expect(() => isGitIgnored("--output=/tmp/pwned", "/tmp", shouldNotRun)).toThrow(
      /dest starts with a dash/,
    );
  });

  it("refuses them before the clone, which is the call that would execute one", () => {
    const inWorkTreeAndIgnored: GitRunner = (args) =>
      args.includes("clone") ? shouldNotRun(args) : ran({ stdout: "true\n" });
    const call = (options: Record<string, unknown>) =>
      pullGitignored({
        repo: FIXTURE_URL, refs: ["main"], subpath: "s", dest: "pulled", cwd: "/tmp",
        git: inWorkTreeAndIgnored, ...options,
      });

    expect(() => call({ repo: "--upload-pack=touch /tmp/pwned" })).toThrow(/This is not a URL/);
    expect(() => call({ refs: ["--upload-pack=touch /tmp/pwned"] })).toThrow(/ref starts with a dash/);
  });

  // `ext::<command>` is a git transport that runs the command. It is chosen from the remote
  // string alone, so the scheme check is the only thing that stops it.
  it("refuses a remote that names a transport git would run a command for", () => {
    const shouldNotClone: GitRunner = (args) =>
      args.includes("clone") ? shouldNotRun(args) : ran({ stdout: "true\n" });
    const call = (repo: string) =>
      pullGitignored({
        repo, refs: ["main"], subpath: "s", dest: "pulled", cwd: "/tmp", git: shouldNotClone,
      });

    expect(() => call("ext::sh -c 'touch /tmp/pwned'")).toThrow(/names another transport/);
    expect(() => call("git://github.com/x/y")).toThrow(/names another transport/);
    expect(() => call("file:///tmp/x")).toThrow(/names another transport/);
    expect(() => call("ssh://-oProxyCommand=x@host/y")).toThrow(/user starts with a dash/);
    expect(() => call("ssh://git@-evil/y")).toThrow(/host starts with a dash/);

    // `ssh:` with no `//` parses, with every part but the scheme empty. git then reads the
    // untouched string as an scp-style remote.
    expect(() => call("ssh:-oProxyCommand=x@host/y")).toThrow(/names no host/);
    expect(() => call("ssh:///-x/y")).toThrow(/names no host/);

    // git reads `%2D` as `-`, so the dash check has to read it that way too.
    expect(() => call("ssh://%2DoProxyCommand%3Dfoo@host/y")).toThrow(/user starts with a dash/);
    expect(() => call("ssh://u@%2Dhost/y")).toThrow(/host starts with a dash/);
  });

  // Callers print this message, and it lands in CI logs.
  it("keeps an embedded credential out of the refusal message", () => {
    const shouldNotClone: GitRunner = (args) =>
      args.includes("clone") ? shouldNotRun(args) : ran({ stdout: "true\n" });
    const call = (repo: string) =>
      pullGitignored({
        repo, refs: ["main"], subpath: "s", dest: "pulled", cwd: "/tmp", git: shouldNotClone,
      });

    expect(() => call("git://user:s3cret@host/y")).toThrow(/git:\/\/host\/y/);
    expect(() => call("git://user:s3cret@host/y")).not.toThrow(/s3cret/);
  });

  it("tells a caller holding an scp-style remote what to write instead", () => {
    const shouldNotClone: GitRunner = (args) =>
      args.includes("clone") ? shouldNotRun(args) : ran({ stdout: "true\n" });

    expect(() =>
      pullGitignored({
        repo: "git@github.com:org/repo.git", refs: ["main"], subpath: "s", dest: "pulled",
        cwd: "/tmp", git: shouldNotClone,
      }),
    ).toThrow(/write git@host:path as ssh:\/\/git@host\/path/);
  });

  it("separates the positionals, so a value git accepts is still not read as an option", () => {
    const seen: string[][] = [];
    const record: GitRunner = (args) => {
      seen.push(args);
      return args.includes("clone") ? ran({ status: 1 }) : ran({ stdout: "true\n" });
    };
    try {
      // Spelled so the parsed URL differs from the string. git must be handed what was
      // checked, not what the caller wrote.
      pullGitignored({
        repo: "https://GitHub.com/x/../y.git", refs: ["main"], subpath: "s", dest: "pulled",
        cwd: "/tmp", git: record,
      });
    } catch {
      // The clone fails. The arguments it was given are the point.
    }
    const clone = seen.find((args) => args.includes("clone")) ?? [];
    expect(clone.slice(clone.indexOf("--"))).toEqual([
      "--",
      "https://github.com/y.git",
      expect.any(String),
    ]);
    const checkIgnore = seen.find((args) => args.includes("check-ignore")) ?? [];
    expect(checkIgnore.slice(-2)).toEqual(["--", "pulled/"]);
  });
});

describe("pullGitignored", () => {
  it("copies the subdirectory and records the commit", () => {
    const source = sourceRepo({ "guidance/a.md": "A", "guidance/nested/b.md": "B", "other.md": "X" });
    const consumer = consumerRepo("pulled/\n");
    const dest = join(consumer, "pulled");

    const { sha, ref } = pullGitignored({
      repo: FIXTURE_URL, git: gitFromFixture(source), refs: ["main"], subpath: "guidance", dest, cwd: consumer,
    });

    expect(ref).toBe("main");
    expect(sha).toMatch(/^[0-9a-f]{40}$/);
    expect(readFileSync(join(dest, "a.md"), "utf8")).toBe("A");
    expect(readFileSync(join(dest, "nested/b.md"), "utf8")).toBe("B");
    expect(existsSync(join(dest, "other.md"))).toBe(false);
    expect(readFileSync(join(dest, ".commitSha"), "utf8").trim()).toBe(sha);
  });

  it("leaves out the sha file when the caller does not want one", () => {
    const source = sourceRepo({ "guidance/a.md": "A" });
    const consumer = consumerRepo("pulled/\n");
    const dest = join(consumer, "pulled");

    const { sha } = pullGitignored({
      repo: FIXTURE_URL, git: gitFromFixture(source), refs: ["main"], subpath: "guidance", dest, cwd: consumer,
      writeShaFile: false,
    });

    // The sha is still reported to the caller. A consumer that tracks it does not want the file.
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
      pullGitignored({ repo: FIXTURE_URL, git: gitFromFixture(source), refs: ["main"], subpath: "guidance", dest, cwd: consumer }),
    ).toThrow(/git does not ignore it/);
    expect(readFileSync(join(dest, "keep.md"), "utf8")).toBe("KEEP");
  });

  it("drops a file deleted upstream, rather than leaving it behind", () => {
    const source = sourceRepo({ "guidance/a.md": "A", "guidance/gone.md": "G" });
    const consumer = consumerRepo("pulled/\n");
    const dest = join(consumer, "pulled");

    pullGitignored({ repo: FIXTURE_URL, git: gitFromFixture(source), refs: ["main"], subpath: "guidance", dest, cwd: consumer });
    expect(existsSync(join(dest, "gone.md"))).toBe(true);

    rmSync(join(source, "guidance/gone.md"));
    git(source, "add", "-A");
    git(source, "-c", "user.email=t@t.t", "-c", "user.name=t", "commit", "--quiet", "-m", "drop");

    pullGitignored({ repo: FIXTURE_URL, git: gitFromFixture(source), refs: ["main"], subpath: "guidance", dest, cwd: consumer });
    expect(existsSync(join(dest, "gone.md"))).toBe(false);
    expect(existsSync(join(dest, "a.md"))).toBe(true);
  });

  it("names git's own reason when the clone fails, rather than blaming the ref", () => {
    const consumer = consumerRepo("pulled/\n");
    const dest = join(consumer, "pulled");

    try {
      pullGitignored({
        repo: FIXTURE_URL, git: gitFromFixture(join(consumer, "no-such-repo")), refs: ["main"], subpath: "x", dest, cwd: consumer,
      });
      throw new Error("expected a PullError");
    } catch (error) {
      expect(error).toBeInstanceOf(PullError);
      expect((error as PullError).attempted[0]).not.toBe("main: could not clone");
      expect((error as PullError).attempted[0]).toMatch(/repository|does not exist|not found/i);
    }
  });

  it("says so when cwd is not a repository, instead of blaming .gitignore", () => {
    const loose = scratch("loose");
    expect(() =>
      pullGitignored({
        repo: FIXTURE_URL, refs: ["main"], subpath: "x", dest: join(loose, "pulled"), cwd: loose,
      }),
    ).toThrow(/not inside a git work tree/);
  });

  it("falls back through refs and reports every attempt when none carries the subpath", () => {
    const source = sourceRepo({ "guidance/a.md": "A" });
    const consumer = consumerRepo("pulled/\n");
    const dest = join(consumer, "pulled");

    const { ref } = pullGitignored({
      repo: FIXTURE_URL, git: gitFromFixture(source), refs: ["no-such-branch", "main"], subpath: "guidance", dest, cwd: consumer,
    });
    expect(ref).toBe("main");

    try {
      pullGitignored({ repo: FIXTURE_URL, git: gitFromFixture(source), refs: ["main"], subpath: "absent", dest, cwd: consumer });
      throw new Error("expected a PullError");
    } catch (error) {
      expect(error).toBeInstanceOf(PullError);
      expect((error as PullError).attempted).toEqual(["main: cloned, but has no absent"]);
    }
  });

  it("leaves the old content in place when the copy cannot complete", () => {
    // A file subpath is the cheapest way to make a copy fail part-way. The sha file cannot
    // be written inside a file.
    const source = sourceRepo({ "guidance/a.md": "A" });
    const consumer = consumerRepo("pulled/\n");
    const dest = join(consumer, "pulled");
    mkdirSync(dest);
    writeFileSync(join(dest, "old.md"), "OLD");

    try {
      pullGitignored({ repo: FIXTURE_URL, git: gitFromFixture(source), refs: ["main"], subpath: "guidance/a.md", dest, cwd: consumer });
      throw new Error("expected a PullError");
    } catch (error) {
      // A PullError, not a raw ENOTDIR. A stack trace would read as a library bug rather
      // than a bad subpath.
      expect(error).toBeInstanceOf(PullError);
      expect((error as PullError).message).toMatch(/Nothing was removed/);
    }
    expect(readFileSync(join(dest, "old.md"), "utf8")).toBe("OLD");
    expect(readdirSync(dest)).toEqual(["old.md"]);
    expect(readdirSync(consumer).filter((e) => e.startsWith(".pull-"))).toEqual([]);
  });

  it("clears a staging directory a killed run left behind", () => {
    // Staging lives inside dest. A process killed mid-pull leaves one there, and the next
    // run's sweep of dest removes it.
    const source = sourceRepo({ "guidance/a.md": "A" });
    const consumer = consumerRepo("pulled/\n");
    const dest = join(consumer, "pulled");
    mkdirSync(join(dest, ".pull-gitignored-abandoned"), { recursive: true });
    writeFileSync(join(dest, ".pull-gitignored-abandoned/half.md"), "HALF");

    pullGitignored({ repo: FIXTURE_URL, git: gitFromFixture(source), refs: ["main"], subpath: "guidance", dest, cwd: consumer });

    expect(readdirSync(dest).sort()).toEqual([".commitSha", "a.md"]);
  });

  it("says so when the clone has no HEAD to read, rather than recording an empty sha", () => {
    // The runner reports failure in its result rather than throwing. An unread HEAD would
    // otherwise reach .commitSha as an empty string and pass for a commit.
    const source = sourceRepo({ "guidance/a.md": "A" });
    const consumer = consumerRepo("pulled/\n");
    const realGitFromFixture = gitFromFixture(source);
    const failHead: GitRunner = (args, options) =>
      args.includes("rev-parse") && args.includes("HEAD")
        ? ran({ status: 128, stderr: "fatal: bad revision\n" })
        : realGitFromFixture(args, options);

    expect(() =>
      pullGitignored({
        repo: FIXTURE_URL, refs: ["main"], subpath: "guidance",
        dest: join(consumer, "pulled"), cwd: consumer, git: failHead,
      }),
    ).toThrow(/could not read its HEAD/);
  });

  it("kills a clone that outlives its deadline, and says the deadline is why", () => {
    const source = sourceRepo({ "guidance/a.md": "A" });
    const consumer = consumerRepo("pulled/\n");

    // 1ms cannot span spawning a process. The clone is always still running when the
    // deadline lands.
    try {
      pullGitignored({
        repo: FIXTURE_URL, git: gitFromFixture(source), refs: ["main"], subpath: "guidance",
        dest: join(consumer, "pulled"), cwd: consumer, cloneTimeoutMs: 1,
      });
      throw new Error("expected a PullError");
    } catch (error) {
      expect(error).toBeInstanceOf(PullError);
      expect((error as PullError).attempted).toEqual(["main: timed out after 1ms"]);
    }
  });
});
