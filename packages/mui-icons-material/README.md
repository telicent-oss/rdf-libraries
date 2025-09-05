## @telicent-oss/mui-icons-material

Package to distribute only the subset of icons in `@mui/icons-material` that Telicent uses. 

The upstream package ships ~7,000 files. That, with our security tooling caused the install of mui's package to take 10+ minutes. This repo automates a slim build:
1. Downloads and extracts the latest `@mui/icons-material` tarball.
2. Copies only the essentials plus the icons listed in `./icons-manifest`.

## Build / Install
```sh
# Requirements: yarn, node, jq, curl, tar, rsync, awk

yarn install
yarn build
```
The build pulls the latest tarball of `@mui/icons-material`, then writes a pruned package with only the icons you list.

## Usage
Add or remove icons by editing `./icons-manifest` (one icon per line; `#` for comments), then rebuild.

e.g. to enable `X` uncomment its files:
```diff
# ./icons-manifest
 # WysiwygSharp.js
 # WysiwygTwoTone.d.ts
 # WysiwygTwoTone.js
-# X.d.ts
-# X.js
+X.d.ts
+X.js
 # Yard.d.ts
 # Yard.js
 # YardOutlined.d.ts
```
(`./icons-manifest` was generated from `@mui/icons-material` v7)
```sh
yarn build
```

Import icons in your app as usual (only listed icons will be included in the slim package).

## Links

* [Icons storybook](https://telicent-oss.github.io/telicent-ds/?path=/story/data-display-icons--all-icons)