# @telicent-oss/catalogservice

*Monorepo Location: `./packages/CatalogService`*

[![Build status](https://github.com/telicent-oss/rdf-libraries/actions/workflows/publish-nx-catalog-service.yml/badge.svg)](https://github.com/telicent-oss/rdf-libraries/actions/workflows/publish-nx-catalog-service.yml)


Utility classes for managing [RDF](https://www.w3.org/RDF/) data for [DCAT3](https://www.w3.org/TR/vocab-dcat-3/)-compliant [data catalogs](https://www.google.com/search?q=what+is+a+data+catalog) via [SPARQL](https://www.w3.org/TR/sparql11-query/).

Plus a `ApiFactory` that uses the above to create a convenience api object for [Catalog](https://github.com/Telicent-oss/catalog) web app (may move out of this package).

## Background

`@telicent-oss/rdfservice` ([./packages/RdfService](https://github.com/telicent-oss/rdf-libraries/tree/main/packages/RdfService)) package was created to give separation between UI code and SPARQL query logic. _This_ package, extends upon `@telicent-oss/rdfservice` to give the the data catalog functionality.


### Install

```bash
yarn install @telicent-oss/catalogservice
```

### Usage

#### DCAT classes

A simple example for data catalogs:
```ts
import {
  CatalogService,
  DCATCatalog,
} from "@company-oss/catalogservice";

// Initialize the CatalogService
const catalogService = new CatalogService("http://localhost:3030/dataset");

// Create Catalog
const catalog1 = new DCATCatalog(
  catalogService,
  "http://mysche.ma/data/catalog1",
  "Catalog",
  "2023-01-01"
);
```

<details>
  <summary>Click here to see a more complex example</summary>
    <hr />

```ts
/*

Given we want to create this structure:
.
├── catalog1/
│   └── catalog1_1/
│       ├── DataService1_1_1
│       ├── DataSet1_1_1
│       └── DataSet1_1_2
└── catalog2/
    └── DataSet_2_1
*/
import {
  CatalogService,
  DCATCatalog,
  DCATDataset,
  DCATDataService,
} from "@company-oss/catalogservice";

// Initialize the CatalogService
const catalogService = new CatalogService("http://localhost:3030/dataset");
const DC3 = 'http://mysche.ma/data/'
// Create Catalog 1
const catalog1 = new DCATCatalog(
  catalogService,
  `${DC3}catalog1`,
  "Catalog 1",
  "2023-01-01"
);

// Create nested Catalog 1_1
const catalog1_1 = new DCATCatalog(
  catalogService,
  `${DC3}catalog1_1`,
  "Catalog 1_1",
  "2023-02-01"
);
catalog1.addSubCatalog(catalog1_1);

// Add DataService to Catalog1_1
const dataService1_1_1 = new DCATDataService(
  catalogService,
  `${DC3}catalog1_1/DataService1_1_1`,
  "Data Service 1_1_1"
);
catalog1_1.addOwnedResource(dataService1_1_1);

// Add DataSets to Catalog1_1
const dataSet1_1_1 = new DCATDataset(
  catalogService,
  `${DC3}catalog1_1/DataSet1_1_1`,
  "Data Set 1_1_1",
  "2023-03-01",
  catalog1_1
);
const dataSet1_1_2 = new DCATDataset(
  catalogService,
  `${DC3}catalog1_1/DataSet1_1_2`,
  "Data Set 1_1_2",
  "2023-03-02",
  catalog1_1
);

// Create Catalog 2
const catalog2 = new DCATCatalog(
  catalogService,
  `${DC3}catalog2`,
  "Catalog 2",
  "2023-04-01"
);

// Add DataSet to Catalog2
const dataSet2_1 = new DCATDataset(
  catalogService,
  `${DC3}catalog2/DataSet2_1`,
  "Data Set 2_1",
  "2023-05-01",
  catalog2
);

```

</details>


#### Using ApiFactory for the Data Catalog UI

You can find a working example in https://github.com/Telicent-oss/catalog
* [setup](https://github.com/telicent-oss/catalog/blob/feat/alpha/src/App.tsx#L36-L41)
* [usage](https://github.com/telicent-oss/catalog/blob/feat/alpha/src/pages/Demo/useSearch.ts#L65)


<details>
  <summary>Click here to see simple example</summary>

```tsx
export const catalogService = new CatalogService(
  `${config.env.TRIPLE_STORE_URL}/`,
  "catalog",
  true,
);
const api = await apiFactory(catalogService);

const Page = ({ searchTerm, dataResourceFilters, set }) => {
  const catalog = useQuery({
    queryKey: ['catalog', dataResourceFilters],
    queryFn: () => api.catalog({ dataResourceFilters }),
  });
  const search = useQuery({
    queryKey: ['search', searchTerm],
    queryFn: () => api.search({ searchTerm })
  });
  return (
    <>
      <SearchInput
        onSearch={searchTerm => set({ searchTerm })}
      />
      <DataResourceFilters
        data={catalog.data}
        onSelect={val => set({ dataResourceFilters: val })}
      />
    <>
  );
}
```

</details>

## Development

### Build

```bash
git clone https://github.com/Telicent-oss/rdf-libraries
cd catalog
yarn install
cd /packages/CatalogService
# make changes
npx nx affected:build
```

### Develop locally

Run the provided triple store
```bash
yarn start:triple-store-for-local-dev-and-tests
```

Or alternatively run your own.

## Related Links

* [Catalog](https://github.com/Telicent-oss/catalog) - ReactJS web app that uses this package
* [RdfService]([./packages/RdfService](https://github.com/telicent-oss/rdf-libraries/tree/main/packages/RdfService)) - sibling package; This package extends some of its RDF utility classes

## Definitions


* **DCAT3**: Data Catalog Vocabulary, version 3, a W3C standard for representing data catalogs.
* **SPARQL**: SPARQL Protocol and RDF Query Language, used for querying RDF data.
* **Triple** Store: A type of database optimized for storing and retrieving RDF triples.


## API

For detailed API usage examples, refer to `CatalogService.test.ts` (and other tests)
