/** A failure the caller is expected to print and exit on, rather than a bug. */
export declare class PullError extends Error {
    readonly attempted: string[];
    constructor(message: string, { attempted }?: {
        attempted?: string[];
    });
}
export interface GitOptions {
    timeout?: number;
    env?: NodeJS.ProcessEnv;
}
/** A git failure arrives in these fields, never as a throw. */
export interface GitResult {
    status: number | null;
    signal: NodeJS.Signals | null;
    stdout: string;
    stderr: string;
    /** `ENOENT` for no git binary, `ETIMEDOUT` for a killed one. Unset when git merely exited non-zero. */
    error?: NodeJS.ErrnoException;
}
/** Injected so a test can present a machine with no git, which cannot be arranged in process. */
export type GitRunner = (args: string[], options?: GitOptions) => GitResult;
/**
 * `check-ignore --quiet` answers with its exit code: 0 for ignored, 1 for not. Any other code
 * means git could not answer, and false is the safe reading of that.
 */
export declare function isGitIgnored(path: string, cwd: string, git?: GitRunner): boolean;
export interface PullOptions {
    repo: string;
    /** Tried in order. The clone is `--branch <ref>`, which a commit sha does not satisfy. */
    refs: string[];
    subpath: string;
    dest: string;
    cwd: string;
    writeShaFile?: boolean;
    /** Bounds each clone attempt, not the call: three refs can wait three times this. */
    cloneTimeoutMs?: number;
    git?: GitRunner;
}
export interface PullResult {
    sha: string;
    ref: string;
}
/**
 * The new content is built inside `dest` and moved up once complete, so a copy that fails
 * part-way leaves the old content in place. A failure during the move leaves `dest`
 * half-written, and the next run replaces it.
 */
export declare function pullGitignored({ repo, refs, subpath, dest, cwd, writeShaFile, cloneTimeoutMs, git, }: PullOptions): PullResult;
