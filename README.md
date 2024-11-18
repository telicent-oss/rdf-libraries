# rdf-libraries

Simple client-side library exported as a JavaScript package, for working with ontologies.

This is a monorepo, which contains sub-packages:

- [packages/OntologyService/README.md](packages/OntologyService/README.md)
- [packages/RdfService/README.md](packages/RdfService/README.md)

## Install

This monorepo's sub-packages are published to https://www.npmjs.com/org/telicent-oss:

```sh
yarn install @telicent-oss/ontologyservice
```

## Usage

A simple example:

```tsx
import OntologyService from "@telicent-oss/ontologyservice";

const ontologyService = new OntologyService(
  "http://localhost:3030/",
  "ontology"
);

const diagrams = await ontologyService.getAllDiagrams();
```

For more info, see [API section](README.md#API).

<details>
  <summary>See local development notes</summary>

## Local development

Requires [nx](https://nx.dev/getting-started/intro).

Some useful `nx` commands

```sh
# For all impacted packages
npx nx affected:build # build
npx nx affected:test # test
npx nx affected:generate-docs # gen docs
# For individual packages
cd rdfservice && npx nx build # Build
cd ontologyservice && npx nx test # Test
cd catalogservice && npx nx lint # Lint
```

To dev workflow multiple package:

```sh
cd ./packages/RdfService; # In producer package...
echo "console.log('hi');" >> ./src/index.ts; # ...edit producer feature
cd - && cd ./packages/OntologyService; # In consumer package...
echo "test('hi', () => expect(logSpy).toHaveBeenCalledWith('hi'));" \
  >> ./src/index.test.ts;  # ...edit consumer test
npx nx affected:build # Build affected
npx nx affected:test # Test affected
```

Build all packages simultaneously:

```sh
npx nx run-many -t build
```

Developer notes:

- WARNING: `import x from '.'` can cause problems. Instead use `import x from './index'`
- If changing code then all commands must be run via nx else it will use the old code in `node_modules`
- nx commands can be run from any sub-directory and will resolve as if run on monorepo root
- More nx documentation at: https://nx.dev/ai-chat

</details>

## API

- [Ontology Service API docs](https://telicent-oss.github.io/rdf-libraries/ontology-service/docs/)
- [RDF Service API docs](https://telicent-oss.github.io/rdf-libraries/rdf-service/docs/)
