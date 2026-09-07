## @telicent-oss/git-pull-ignored-lib

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)
![Node Version](https://img.shields.io/badge/node-%5E20.19.0%20%7C%7C%20%3E%3D22.12.0-brightgreen.svg)

Pull a subdirectory of a git repo into a local gitignored directory, refusing any destination git does not ignore.

## Background

This is a dev tool to help pull fresh guidance docs from a documentation repo into a
project's gitignored folder.

Pulling means replacing: the destination is deleted and rewritten, so a wrong path, a
moved directory or an edited `.gitignore` turns that into data loss. The files it replaces
are untracked, so there is nothing to restore from.

`pullGitignored` asks git whether the destination is ignored, and throws before deleting
anything if it is not.

## Build / Install

```sh
pnpm add -D "telicent-oss/rdf-libraries#path:/packages/git-pull-ignored-lib"
```

pnpm pins the commit it resolved. Once the name is published, drop the path:
`pnpm add -D @telicent-oss/git-pull-ignored-lib`.

## Usage

```js
import { pullGitignored, PullError } from "@telicent-oss/git-pull-ignored-lib";

try {
  const { sha, ref } = pullGitignored({
    repo: "git@github.com:your-org/guidance.git",
    refs: ["feature/new-guidance", "main"],
    subpath: "docs/frontend",
    dest: ".guidance",
    cwd: process.cwd(),
  });
  console.log(`pulled .guidance from ${ref} at ${sha.slice(0, 8)}`);
} catch (error) {
  if (error instanceof PullError) {
    console.error(error.message);
    process.exit(1);
  }
  throw error;
}
```

- `refs`: tried in order, so a caller can prefer a feature branch and fall back to the default
- miss: a ref that exists but lacks `subpath`
- branch and tag names only, because the clone runs `--branch`
- every ref missing: the `PullError` carries an `attempted` array saying why each did
- `.commitSha`: written into the destination; `writeShaFile: false` skips it

## API

| Export | Call | Returns |
| --- | --- | --- |
| `pullGitignored` | `({ repo, refs, subpath, dest, cwd, writeShaFile, cloneTimeoutMs, git })` | `{ sha, ref }` |
| `isGitIgnored` | `(path, cwd, git?)` | `boolean` |
| `PullError` | thrown by both | carries `attempted: string[]` |

`GitRunner`, `GitResult` and `GitOptions` are exported as types.

- `cloneTimeoutMs` defaults to 60000 and bounds each attempt, not the call: three refs can
  wait three times that
- `git`: swaps how git is run, defaulting to the real binary
- failures come back on `error.code` rather than as a throw: `ENOENT` for no git,
  `ETIMEDOUT` for a deadline
- a `repo`, `ref`, `cwd` or `dest` starting with `-` is refused: git reads a leading dash
  as an option wherever it sits, and `--upload-pack=<command>` makes a clone run a command
- the new content is built inside `dest` and moved into place, so a copy that fails
  part-way leaves the old content where it was
- `isGitIgnored` asks git rather than reading `.gitignore`, so nested and negated patterns
  give the same answer here as they do to git

## Tests

From a clone of this repository:

```sh
yarn test
yarn coverage
```

Real git repositories in temp directories, so the ignore check runs against git itself.
Needs `git` on `PATH`; no network.
