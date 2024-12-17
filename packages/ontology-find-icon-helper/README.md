# @telicent-oss/ontology-find-icon-helper

*Monorepo Location: `./packages/ontology-find-icon-helper`*

A helper for frontend apps to load and access ontology icons from ontology styles

### Install

```bash
yarn install @telicent-oss/ontology-find-icon-helper
```

### Usage

```ts
import * as ontologyFindIconHelper from '@telicent-oss/ontology-find-icon-helper';

export function useOntologyStyle(classUri) {
  const [style, setStyle] = useState(null);

  useEffect(() => {
    // Wait for the stylesPromise to complete...
    ontologyFindIconHelper.moduleStylesPromise.then(() => {
      // Once complete, you can use its helper functions like findByClassUri()
      const foundStyle = ontologyFindIconHelper.findByClassUri(classUri);
      setStyle(foundStyle);
    });
    // Run effect on mount only
  }, []);

  return style; // Return found style
}
```

## Development

### Build

```bash
git clone https://github.com/Telicent-oss/rdf-libraries
cd rdf-libraries
yarn install
cd /packages/ontology-find-icon-helper
# make changes
npx nx affected:build
```

* [./packages/OntologyService](https://github.com/telicent-oss/rdf-libraries/tree/main/packages/OntologyService) - consumes to get ontology styles (and icons)f

