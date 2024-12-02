# @telicent-oss/ies-service

*Monorepo Location: `./packages/ies-service`*

Client-side code for working with [IES4](https://github.com/dstl/IES4) data.

## Background

`@telicent-oss/rdfservice` ([./packages/RdfService](https://github.com/telicent-oss/rdf-libraries/tree/main/packages/RdfService)) package was created to give separation between UI code and SPARQL query logic. _This_ package, extends upon `@telicent-oss/rdfservice` to give IES-specific functionality.


### Install

```bash
yarn install @telicent-oss/ies-service
```

### Usage

A simple example

```ts
import { IESService } from "@company-oss/ies-service";

// Initialize the IESService
const iesService = await IESService.createAsync({
  writeEnabled: true,
  triplestoreUri: "http://localhost:3030",
  dataset: "dataset",
});
```

## Development

### Build

```bash
git clone https://github.com/Telicent-oss/rdf-libraries
cd catalog
yarn install
cd /packages/ies-service
# make changes
npx nx affected:build
```

### Develop locally

Run the provided triple store
```bash
yarn start:triple-store-for-local-dev-and-tests
```

Or alternatively run your own.

## Related Links

* [RdfService]([./packages/RdfService](https://github.com/telicent-oss/rdf-libraries/tree/main/packages/RdfService)) - sibling package; This package extends some of its RDF utility classes

## Definitions


* **IES4**: An RDF schema to aid in information exchange across certain parts of the UK government
* **SPARQL**: SPARQL Protocol and RDF Query Language, used for querying RDF data.
* **Triple** Store: A type of database optimized for storing and retrieving RDF triples.

