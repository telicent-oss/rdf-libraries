# RdfService

RdfService is a helper library that abstracts away the complexity of interacting with RDF triplestores, providing basic CRUD abilities.

For futher information on how to use the library see the [API documentation](README.md#API)

## Install

```bash
yarn add @telicent-oss/rdfservice
```

## Usage
```tsx
import RdfService from "@telicent-oss/rdfservice";

const rdfService = new RdfService("http://localhost:3030/", "ontology");

const diagrams = await rdfService.runQuery(query);
```

## API

See here for generated API docs:
* [RDF Service API docs](https://telicent-oss.github.io/rdf-libraries/rdf-service/docs/)
