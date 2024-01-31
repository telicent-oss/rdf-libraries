# js-ontology-lib

## Short Description

Simple client-side lib for working with ontologies

## Build / Install

Get access to `@telicent-io` package repository (t.b.a)
```sh
cd <yourProject>
yarn install @telicent-io/ontologyservice
```

## Usage

```tsx
import OntologyService from "@telicent-io/ontologyservice";

const ontologyService = new OntologyService("http://localhost:3030/", "ontology");

const diagrams = await ontologyService.getAllDiagrams();
```

## Development 

Install all dependencies:
```sh
cd <monorepoRoot>;
pnpm install; # IMPORTANT: yarn & npm may cause downstream problems during development
To generate docs: `yarn docs`;
```

Execute task (see `nx.json`) on package:
```sh
npx nx affected:build
npx nx affected:test
npx nx affected:gen-docs
# etc
```

Execute task (see `nx.json`) on affected packages:
```sh
npx nx @telicent-io/rdfservice:build
npx nx @telicent-io/ontologyservice:test
# etc
```

Add dependency to package: 
```sh
pnpm add crypto --filter @telicent-io/<packageName>
```

Run command (See `packages.json` "scripts" field) on package: 
```sh
npx nx run @telicent-io/rdfservice:format
npx nx test @telicent-io/ontologyservice --watch -t setStyles # flags work
```

To develop multiple packages:
```sh
# In producer package...
cd ./packages/RdfService;
# ...edit producer feature
echo "console.log('hi');" >> ./src/index.ts;
# In consumer package...
cd - && cd ./packages/OntologyService;
# ...edit consumer test
echo "test('hi', () => expect(logSpy).toHaveBeenCalledWith('hi'));" >> ./src/index.test.ts; 
# Build affected
npx nx affected:build 
# Test affected
npx nx affected:test 
```
Build all packages simultaneously:
```sh
npx nx run-many -t build
```

## Developer notes

- If changing code then all commands must be run via nx else it will use the code in `node_modules`
- nx commands can be run from any monorepo package and will resolve as if run on monorepo root
- NPM has been switched out for PNPM
- More nx documentation at brilliant AI bot https://nx.dev/ai-chat

## Next steps

The idea is to make this open source. To that end, it will be split into four separate NPM modules:

* rdf-js - see repo https://github.com/Telicent-io/rdf-js
* ont-        j - see repo https://github.com/Telicent-io/ont-js
* ies-        js - no repo yet, this can wait for a bit
* para        log-js - no repo yet - maybe never

To do:      

* extract the rdf class from index.js and refactor it be suitable as a node module in the new repo
* finish off the commenting in the file (tried to add param types for example)
* eventually need to make this a public NPM installable thing
* I can support with documentation
* now do it all again for ont-js, with a dependency on rdf-js