## @telicent-oss/git-pull-ignored-lib

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)
![Node Version](https://img.shields.io/badge/node-%5E20.19.0%20%7C%7C%20%3E%3D22.12.0-brightgreen.svg)

Pulls a subdirectory of a git repo into a local gitignored directory. Refuses any
destination git does not ignore.

## Background

This dev tool pulls fresh guidance docs from a documentation repo into a project's
gitignored folder.

Pulling means replacing. The destination is deleted and rewritten. Three things turn that
into data loss:

- a wrong path
- a moved directory
- an edited `.gitignore`

The files it replaces are untracked. There is nothing to restore from.

`pullGitignored` asks git whether the destination is ignored. It throws before deleting
anything if it is not.

## Install

```sh
pnpm add -D "telicent-oss/rdf-libraries#path:/packages/git-pull-ignored-lib"
```

pnpm pins the commit it resolved. The package name is not on npm yet. After it is
published, drop the path: `pnpm add -D @telicent-oss/git-pull-ignored-lib`.

## Usage

```js
import { pullGitignored, PullError } from "@telicent-oss/git-pull-ignored-lib";

try {
  const { sha, ref } = pullGitignored({
    repo: "ssh://git@github.com/your-org/guidance.git",
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

`refs` are tried in order. A caller can list a feature branch first and the default branch
after it. A ref can exist without `subpath`. That counts as a miss, and the next ref is
tried. When every ref misses, `PullError.attempted` says why each one failed.

The clone runs `--branch`. Only branch and tag names work.

`pullGitignored` writes `.commitSha` into the destination. `writeShaFile: false` skips that
file.

## API

| Export | Call | Returns |
| --- | --- | --- |
| `pullGitignored` | `({ repo, refs, subpath, dest, cwd, writeShaFile, cloneTimeoutMs, git })` | `{ sha, ref }` |
| `isGitIgnored` | `(path, cwd, git?)` | `boolean` |
| `PullError` | thrown by both | carries `attempted: string[]` |

`GitRunner`, `GitResult` and `GitOptions` are exported as types.

`cloneTimeoutMs` defaults to 60000ms. The limit applies to each ref attempt. Three refs can
take 180000ms in total.

`git` replaces the git runner. The default runner calls the real git binary. A runner
reports a failure in its result under `error.code`, and does not throw. `ENOENT` means no
git binary. `ETIMEDOUT` means the deadline killed it. `pullGitignored` still throws
`PullError` at its caller.

`repo` must be an `https://` or `ssh://` URL naming a host. An scp-style `git@host:path` is
written `ssh://git@host/path`. The remote string also picks git's transport.
`ext::<command>` is a transport that runs the command. The library parses the URL first and
checks its scheme, before git sees it. Git receives the parsed URL. A refusal names the
rule and the remote. It removes any embedded credential from that message.

A `ref`, `cwd` or `dest` starting with `-` is refused. So is a `-`-leading user or host in
`repo`. Git reads a leading dash as an option in any position.
`--upload-pack=<command>` makes a clone run a command.

The library builds the new content inside `dest`. It then moves that content into place. A
copy that fails part-way leaves the old content where it was.

`isGitIgnored` puts the question to git, and does not read `.gitignore`. Nested and negated
patterns give the same answer here as they do to git.

## Tests

This repo uses yarn. Run these from a clone:

```sh
yarn test
yarn coverage
```

The tests run real git repositories in temp directories. The ignore check gets git's own
answer. The tests need `git` on `PATH`. They need no network access.
