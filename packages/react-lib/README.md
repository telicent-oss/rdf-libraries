# @telicent-oss/react-lib

*Monorepo Location: `./packages/react-lib`*

Useful React utilities

### Install

```bash
pnpm add @telicent-oss/react-lib
```

### Usage

`use` hook polyfill (can be removed when we move to React 19)
```js
import React, { Suspense } from "react";
import { use } from "@telicent-oss/react-lib";

const wait3SecondsFromLoad = new Promise((fulfill) => setTimeout(fulfill, 3000));

export const Wait3Seconds = () => {
  use(wait3SecondsFromLoad);
  return (
    <Suspense fallback="Waiting...">...Complete!</Suspense>
  );
};
```

## Development

### Build

```bash
git clone https://github.com/Telicent-oss/rdf-libraries
cd rdf-libraries
pnpm install
cd /packages/react-lib
# make changes
pnpm exec nx affected:build
```
