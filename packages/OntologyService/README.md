# OntologyService

Simple client-side library for working with RDF ontologies. Includes basic CRUD
abilities and functions to help you navigate an ontology hierarchy.

For further information on how to use the library see the [API Documentation](README.md#API)

## Install

```bash
yarn install @telicent-oss/ontologyservice
```

## Usage

```tsx
import OntologyService from "@telicent-oss/ontologyservice";

const ontologyService = new OntologyService("http://localhost:3030/", "ontology");

const diagrams = await ontologyService.getAllDiagrams();
```

## API

* [Ontology Service API docs](https://telicent-oss.github.io/rdf-libraries/ontology-service/docs/)
