# @telicent-oss/ontology-icon-lib

*Monorepo Location: `./packages/ontology-icon-lib`*

A helper for (frontend) apps to load and access data for ontology icons using [@telicent-oss/ontologyservice](https://github.com/telicent-oss/rdf-libraries/tree/main/packages/OntologyService) (`./packages/OntologyService)`). This icon data can be used for rendering ontology icons in the UI.

### Install

```bash
yarn install @telicent-oss/ontology-icon-lib
```

### Usage

#### Load icons from server:
```ts
import { OntologyService } from '@telicent-oss/ontology-service';
import * as ontologyIconLib from '@telicent-oss/ontology-icon-lib';

const ontologyServicePromise = OntologyService.createAsync("http://store", "ontology");
await ontologyIconLib.init(ontologyServicePromise);
```

#### Access a loaded icon:
```ts
import * as ontologyIconLib from '@telicent-oss/ontology-icon-lib';

const classUri = "http://ies.data.gov.uk/ontology/ies4#OperationalData";
const iconData = ontologyIconLib.findByClassUri(classUri);
console.log(iconData);
// {
//   "alt": "http://ies.data.gov.uk/ontology/ies4#OperationalData",
//   "backgroundColor": "#112266",
//   "classUri": "http://ies.data.gov.uk/ontology/ies4#OperationalData",
//   "color": "#FFF",
//   "faIcon": "fa-regular fa-clock",
//   "faUnicode": "",
//   "iconFallbackText": "OD",
//   "shape": undefined,
// }
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

