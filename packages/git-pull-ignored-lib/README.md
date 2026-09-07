# @telicent-oss/git-pull-ignored-lib

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)
![Node Version](https://img.shields.io/badge/node-%5E20.19.0%20%7C%7C%20%3E%3D22.12.0-brightgreen.svg)

Pull a subdirectory of a git repository into a local gitignored directory, refusing any
destination git does not ignore.

## Why it refuses

The destination is deleted and rewritten, so a wrong path, a moved directory or an edited
`.gitignore` turns a pull into data loss. The files it takes are the ones git is not
tracking, so there is nothing to restore from. `pullGitignored` asks git whether the
destination is ignored and throws before deleting anything if it is not.

## Install

Install it from this repository:

```bash
pnpm add -D "telicent-oss/rdf-libraries#path:/packages/git-pull-ignored-lib"
```

pnpm records the commit it resolved, so the dependency is pinned. Once the name is
published, this becomes:

```bash
pnpm add -D @telicent-oss/git-pull-ignored-lib
```

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

`refs` is tried in order, so a caller can prefer a feature branch and fall back to the
default one. A ref that exists but does not carry `subpath` counts as a miss, because the
point is to find a ref that has the content. When every ref misses, the `PullError` carries
an `attempted` array saying what happened to each.

A `.commitSha` file is written into the destination recording the commit it came from. Pass
`writeShaFile: false` to skip it.

## API

| Export | Signature | Returns |
| --- | --- | --- |
| `pullGitignored` | `({ repo, refs, subpath, dest, cwd, writeShaFile, cloneTimeoutMs, git })` | `{ sha, ref }` |
| `isGitIgnored` | `(path, cwd, git?)` | `boolean` |
| `PullError` | `Error` subclass carrying `attempted: string[]` | |
| `GitRunner` | `(args, options?) => GitResult` | type only |
| `GitResult` | `{ status, signal, stdout, stderr, error? }` | type only |
| `GitOptions` | `{ timeout?, env? }` | type only |

`writeShaFile` defaults to true and `cloneTimeoutMs` to 60000, which bounds each clone
attempt rather than the whole call: three refs can wait three times that.

`git` replaces how git is run, and defaults to running the real binary. It is one function
taking the arguments after `git` and returning the outcome; it never throws, so a missing
binary is told apart from a command that ran and failed by reading `error.code` (`ENOENT`
for a git that is not there, `ETIMEDOUT` for one the deadline killed). It exists so the
tests can present a machine with no git, which cannot be arranged in process — emptying
`PATH` does not reach the child under jest. A caller with its own reason to control the
invocation can pass one.

A `repo`, `ref`, `cwd` or `dest` beginning with `-` is refused. git reads a leading dash as
an option wherever the argument sits, and `--upload-pack=<command>` makes a clone run an
arbitrary command, so an option-shaped value from a caller is a command-injection route
rather than a wrong answer. Positionals are separated with `--` as well, which alone would
not cover the value after `--branch`.

`dest` is replaced by assembling the new content beside it and renaming it into place, so
a copy that fails part-way leaves the old content where it was. Only `refs` naming a branch
or tag work: the clone passes `--branch`, which a commit sha does not satisfy.

`isGitIgnored` asks git rather than reading `.gitignore`, so nested and negated patterns
give the same answer here as they do to git. Three details decide whether it answers
correctly, and each is load-bearing: the path is made relative to `cwd`, because git
rejects an absolute path it reads as outside the repository and on macOS `/var/...`
resolves to `/private/var/...`; separators are rewritten to `/`, because `relative()`
returns `\` on win32 and git takes only `/` (written for win32, not tested there: the
suite runs on macOS and linux, and `path.sep` cannot be changed inside a test); and a trailing slash is added, because the usual pattern
for a pulled directory is `name/`, which git matches only against a path it knows is a
directory — without the slash a destination that does not exist yet reads as not ignored,
and every first pull would be refused.

## Tests

```bash
yarn test
yarn coverage
```

The suite builds real git repositories in temp directories, so the ignore check is proved
against git itself rather than a mock. It needs `git` on `PATH`; there is no network access
and no remote is contacted.

jest with ts-jest, through the repo's `jest.preset.js`, the same as every other package
here. One test runs the source in a child process through `tsx` instead: it is the one that
needs git genuinely absent from `PATH`, and jest hands a test a copy of `process.env` while
the child reads the real one.
