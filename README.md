# js-ontology-lib
Simple client-side lib for working with ontologies

The idea is to make this open source. To that end, it will be split into four separate NPM modules:

* rdf-js - see repo https://github.com/Telicent-io/rdf-js
* ont-        j - see repo https://github.com/Telicent-io/ont-js
* ies-        js - no repo yet, this can wait for a bit
* para        log-js - no repo yet - maybe never

To do:      

* extr        act the rdf class from index.js and refactor it be suitable as a node module in the new repo
* finish off the commenting in the file (tried to add param types for example)
* eventually need to make this a public NPM installable thing
* I can support with documentation
* now do it all again for ont-js, with a dependency on rdf-js

## Developer notes
TSDoc has been added to generate documentation
To generate documentation use the following command.
You do not need to be in the packge folder itself to run it,
just inside the project root.
`npx nx run @telicent-io/<service>:generate-docs`

NPM has been switched out for PNPM so that the monorepo can be
managed more effectively
- To install libraries for all of your packages in one go use:
`pnpm install`

- To install a dependency to a specific package use:
`pnpm add crypto --filter @telicent-io/<service>`

- To run tests on a specific package run:
`npx nx test @telicent-io/<service> --watch`

- To build all packages simultaneously run:
`npx nx run-many -t build`

If more help is required nx has brilliant documentation and
my favourite method was to use their (AI Bot)[https://nx.dev/ai-chat]


