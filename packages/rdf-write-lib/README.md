# @telicent-oss/rdf-write-lib

*Monorepo Location: `./packages/rdf-write-lib`*

Allows writing of RDF data in Telicent CORE platform.

Current implementation is a wrapper around a Python API.

### Install

```bash
yarn install @telicent-oss/rdf-write-lib
```

### Usage

```js
import { rdfWriteApiFactory } from "@telicent-oss/rdf-write-lib";
import catalogAPIContract from './catalog-api-contract/open-api.json'
import rdfTriples from './catalog/data/rdfTriples'

const rdfWriteApi = rdfWriteApiFactory({ catalog: catalogAPIContract });

const PREDICATE_TO_ENDPOINT = {
    'dcterms:name': { // object maybe unrequired
        uri: '/dcterms/name',
    }
}
return Promise.all(
    rdfTriples.map(({ s, p, o }) => {
        const endpoint = PREDICATE_TO_ENDPOINT[predicate];
        const payload = {s:subject, p:predicate, o:obj};
        return rdfWriteApi.catalog[endpoint.uri](payload);
    })
)
```
