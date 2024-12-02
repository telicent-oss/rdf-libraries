# @telicent-oss/ontology-find-icon-helper

*Monorepo Location: `./packages/ontology-find-icon-helper`*

A helper for frontend apps to load and access ontology icons from ontology styles

### Install

```bash
yarn install @telicent-oss/ontology-find-icon-helper
```

### Usage

```ts
import { OntologyFindIconHelper } from "@company-oss/ontology-find-icon-helper";

// Initialize the CatalogService
const catalogService = await CatalogService.createAsync({
  writeEnabled: true,
  triplestoreUri: "http://localhost:3030",
  dataset: "dataset",
});

// Create Catalog
const catalog1 = await DCATCatalog.createAsync(
  catalogService,
  "http://mysche.ma/data/catalog1",
  "Catalog",
  "2023-01-01"
);
```

## Development

### Build

```bash
git clone https://github.com/Telicent-oss/rdf-libraries
cd rdf-libraries
yarn install
cd /packages/ontology-find-icon-helper
# make changes
npx nx affected:build
```

* [./packages/OntologyService](https://github.com/telicent-oss/rdf-libraries/tree/main/packages/OntologyService) - consumes to get ontology styles (and icons)f

