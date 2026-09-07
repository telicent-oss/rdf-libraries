/** A failure the caller is expected to print and exit on, rather than a bug. */
export declare class PullError extends Error {
    readonly attempted: string[];
    constructor(message: string, { attempted }?: {
        attempted?: string[];
    });
}
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
/**
 * Whether git ignores `path`. Asked of git rather than read out of .gitignore, so nested
 * and negated patterns give the same answer here as they do to git.
 *
 * `git check-ignore --quiet <path>` prints nothing and answers with its exit code: 0 for
 * ignored, 1 for not. Any other code means git could not answer, and false is the safe
 * reading of that, because the caller refuses to delete anything it is not sure about.
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
export declare function pullGitignored({ repo, refs, subpath, dest, cwd, writeShaFile, cloneTimeoutMs, git, }: PullOptions): PullResult;
