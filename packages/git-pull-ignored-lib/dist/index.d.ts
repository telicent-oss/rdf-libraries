/** A failure the caller is expected to print and exit on, rather than a bug. */
export declare class PullError extends Error {
    readonly attempted: string[];
    constructor(message: string, { attempted }?: {
        attempted?: string[];
    });
}
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
export declare function isGitIgnored(path: string, cwd: string, git?: GitRunner): boolean;
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
export declare function pullGitignored({ repo, refs, subpath, dest, cwd, writeShaFile, cloneTimeoutMs, git, }: PullOptions): PullResult;
