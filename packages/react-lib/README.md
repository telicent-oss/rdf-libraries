# @telicent-oss/react-lib

*Monorepo Location: `./packages/react-lib`*

Useful React code

### Install

```bash
yarn install @telicent-oss/react-lib
```

### Usage

```js
import React, { Suspense } from "react";
import { use } from "@telicent-oss/react-lib";

const wait3Seconds = new Promise((fulfill) => setTimeout(fulfill, 3000));

export const Wait3Seconds = () => {
  use(wait3Seconds);
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
yarn install
cd /packages/react-lib
# make changes
npx nx affected:build
```
