# @telicent-oss/ontology-icon-react-lib

*Monorepo Location: `./packages/ontology-icon-react-lib`*

A React library for accessing and rending ontology icon data loaded from [@telicent-oss/ontologyservice](./packages/ontologyservice).

This package requires [@telicent-oss/ontology-icon-lib](./packages/ontology-icon-lib) to be initialised.


## Install

```sh
yarn install @telicent-oss/ontology-icon-react-lib
```


## Usage

### Initialisation

Before the following components can access icon data,  [@telicent-oss/ontology-icon-lib](../ontology-icon-lib/README.md#usage)'s `init()` must be called, and its returned promise must be resolved.

<details>
<summary>See pre-requisite code</summary>

```ts
import { OntologyService } from '@telicent-oss/ontologyservice';
import * as ontologyIconLib from '@telicent-oss/ontology-icon-lib';

const ontologyServicePromise = OntologyService.createAsync("http://store", "ontology");
await ontologyIconLib.init(ontologyServicePromise);
// Your code here
```

</details>

### After initialisation

#### `OntologyIcon` component:
```tsx
import { OntologyIcon } from "@telicent-oss/ontology-icon-react-lib";

const DocumentIcon: FC<{type:string
    | "http://ies.data.gov.uk/ontology/ies4#WorkOfDocumentation"
    | "http://ies.data.gov.uk/ontology/ies4#WorkOfReference"
}> = ({
  type,
}) => {
  return <OntologyIcon type={type} />

```

#### `useOntologyStyles` hook:
```tsx
const IconInfo = () => {
  const ontologyStyles = useOntologyStyles();
  const workOfDocumentationIcon = ontologyStyles.findIcon("http://ies.data.gov.uk/ontology/ies4#WorkOfDocumentation");
  return ontologyStyles.isLoading 
    ? <span>Loading</span>
    : <div>
      {`styles: ${ontologyStyles.styles.length}`}
      {`#WorkOfDocumentation icon: ${JSON.stringify(workOfDocumentationIcon)}`}
    </div>;
};
```

## Development

### Build

```sh
git clone https://github.com/Telicent-oss/rdf-libraries
cd rdf-libraries
yarn install
cd /packages/ontology-icon-react-lib
# make changes
npx nx affected:build
```

## Related Links

* [@telicent-oss/ontologyservice](https://github.com/telicent-oss/rdf-libraries/tree/main/packages/OntologyService) (`./packages/OntologyService`) - used to access ontology data
* [@telicent-oss/ontology-icon-lib](https://github.com/telicent-oss/rdf-libraries/tree/main/packages/ontology-icon-lib) (`./packages/ontology-icon-lib`) - used to get icon data using [@telicent-oss/ontologyservice](https://github.com/telicent-oss/rdf-libraries/tree/main/packages/ontology-icon-lib)
* [@telicent-oss/react-lib](https://github.com/telicent-oss/rdf-libraries/tree/main/packages/react-lib) (`./packages/react-lib`) - utilities for React