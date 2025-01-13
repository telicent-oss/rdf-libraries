# @telicent-oss/ontology-icon-lib

*Monorepo Location: `./packages/ontology-icon-lib`*

A helper for (frontend) apps to load and access ontology icons using [@telicent-oss/ontologyservice](https://github.com/telicent-oss/rdf-libraries/tree/main/packages/OntologyService) (`./packages/OntologyService)`)

### Install

```bash
yarn install @telicent-oss/ontology-icon-lib
```

### Usage

```ts
import * as ontologyIconLib from '@telicent-oss/ontology-icon-lib';

await ontologyIconLib.init(
  OntologyService.createAsync(config.ontology_service, "ontology")
);

const operationalDataIcon = ontologyIconLib.findByClassUri("http://ies.data.gov.uk/ontology/ies4#OperationalData");

```

## Development

### Build

```bash
git clone https://github.com/Telicent-oss/rdf-libraries
cd rdf-libraries
yarn install
cd /packages/ontology-icon-lib
# make changes
npx nx affected:build
```
## Related Links

* [@telicent-oss/ontologyservice](https://github.com/telicent-oss/rdf-libraries/tree/main/packages/OntologyService) (`./packages/OntologyService)`) - consumes to get ontology styles (and icons)

