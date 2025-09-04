# @telicent-oss/sparql-lib

*Monorepo Location: `./packages/sparql-lib`*

Sparql queries

### Install

```bash
yarn install @telicent-oss/sparql-lib
```

### Usage

```js
import { queries } from "@telicent-oss/sparql-lib/data-catalog";

fetch(queries.getAllDCATResources(class, dataSet, Relation));
```
