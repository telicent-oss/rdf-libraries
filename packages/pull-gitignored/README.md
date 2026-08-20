# @telicent-oss/pull-gitignored

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
pnpm add -D "telicent-oss/rdf-libraries#path:/packages/pull-gitignored"
```

pnpm records the commit it resolved, so the dependency is pinned. Once the name is
published, this becomes:

```bash
pnpm add -D @telicent-oss/pull-gitignored
```

## Usage

```js
import { pullGitignored, PullError } from "@telicent-oss/pull-gitignored";

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
| `pullGitignored` | `({ repo, refs, subpath, dest, cwd, writeShaFile })` | `{ sha, ref }` |
| `isGitIgnored` | `(path, cwd)` | `boolean` |
| `PullError` | `Error` subclass carrying `attempted: string[]` | |

`isGitIgnored` asks git rather than reading `.gitignore`, so nested and negated patterns
give the same answer here as they do to git. Two details decide whether it answers
correctly, and both are load-bearing: the path is made relative to `cwd`, because git
rejects an absolute path it reads as outside the repository and on macOS `/var/...`
resolves to `/private/var/...`; and a trailing slash is added, because the usual pattern
for a pulled directory is `name/`, which git matches only against a path it knows is a
directory — without the slash a destination that does not exist yet reads as not ignored,
and every first pull would be refused.

## Tests

```bash
pnpm test
```

The suite builds real git repositories in temp directories, so the ignore check is proved
against git itself rather than a mock. It needs `git` on `PATH`; there is no network access
and no remote is contacted.
