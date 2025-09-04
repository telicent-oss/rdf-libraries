import { DispatchResult } from "@telicent-oss/rdf-write-lib";
import { DCATResource } from "../RDFSResource.DCATResource";
import {
  Editable,
  ResourceOperationResults,
  storeTripleResultsToValueObject,
  StoreTriplesOptions,
} from "./storeTripleResultsToValueObject";
import { CatalogService } from "../RdfService.CatalogService";
import { storeTriplesForPhase2 } from "./storeTriplesForPhase2";

type InfiniteApi<R> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: (...args: any[]) => R;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: symbol]: (...args: any[]) => R;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createInfiniteApi = <R>(impl: (...args: any[]) => R): InfiniteApi<R> =>
  new Proxy(Object.create(null), {
    get:
      () =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (...args: any[]) =>
        impl(...args),
  }) as InfiniteApi<R>;

const infiniteApi = createInfiniteApi((args) => {
  const result: Awaited<DispatchResult> = {
    response: {
      status: 200,
      body: "body",
    },
    data: [],
    error: undefined,
    args,
  } as unknown as Awaited<DispatchResult>;
  return Promise.resolve(result);
});

test.skip("storeTripleResultsToValueObject distribution", async () => {
  const uri = "http://ex.com#Dataset_Apples🔴";
  const uiFields: Partial<Editable> = {
    distributionIdentifier: "dist_apples🔴",
    distributionMediaType: "apple/vision🔴",
  };
  const instance = {
    uri,
    title: "DataSet Apples🔴",
    type: "http://www.w3.org/2000/01/rdf-schema#Resource",
  } as unknown as DCATResource;
  const api = {
    createByPredicateFns: infiniteApi,
    updateByPredicateFns: infiniteApi,
  } as unknown as StoreTriplesOptions["api"];
  const catalogService = infiniteApi as unknown as CatalogService;

  const result = storeTripleResultsToValueObject({
    uri,
    uiFields,
    instance,
    api,
    catalogService,
    storeTriplesForOntology: storeTriplesForPhase2,
  });
  try {
    expect(await result).toThrowErrorMatchingInlineSnapshot();
  } catch (error) {
    const responses = error as unknown as ResourceOperationResults;
    expect(responses.results).toMatchInlineSnapshot(`
      {
        "distributionIdentifier": [
          {
            "dataset_uri": "http://ex.com#Dataset_Apples🔴",
            "prev": null,
            "property": "distribution",
            "triple": {
              "o": "http://telicent.io/catalog#193b5633-bb7f-43bb-8f46-ef81d98be32e_Distribution",
              "p": "dcat:distribution",
              "s": "http://ex.com#Dataset_Apples🔴",
            },
            "type": "create",
          },
          {
            "checkUnique": undefined,
            "dataset_uri": "http://ex.com#Dataset_Apples🔴",
            "prev": null,
            "property": "distribution__identifier",
            "triple": {
              "o": "http://www.w3.org/ns/dcat#Distribution",
              "p": "rdf:type",
              "s": "http://telicent.io/catalog#193b5633-bb7f-43bb-8f46-ef81d98be32e_Distribution",
            },
            "type": "create",
          },
          {
            "details": "[distribution__identifier] NOT UNIQUE "dist_apples🔴" already exists {"type":"create","triple":{"s":"http://telicent.io/catalog#193b5633-bb7f-43bb-8f46-ef81d98be32e_Distribution","p":"dct:identifier","o":"dist_apples🔴"},"checkUnique":true,"prev":null,"dataset_uri":"http://ex.com#Dataset_Apples🔴","property":"distribution__identifier"}",
            "error": "NOT UNIQUE "dist_apples🔴" already exists",
          },
        ],
        "distributionMediaType": [
          {
            "dataset_uri": "http://ex.com#Dataset_Apples🔴",
            "prev": null,
            "property": "distribution",
            "triple": {
              "o": "http://telicent.io/catalog#572f1eda-c517-4ef5-bce4-d9bc572027db_Distribution",
              "p": "dcat:distribution",
              "s": "http://ex.com#Dataset_Apples🔴",
            },
            "type": "create",
          },
          {
            "checkUnique": undefined,
            "dataset_uri": "http://ex.com#Dataset_Apples🔴",
            "prev": null,
            "property": "distribution__mediaType",
            "triple": {
              "o": "http://www.w3.org/ns/dcat#Distribution",
              "p": "rdf:type",
              "s": "http://telicent.io/catalog#572f1eda-c517-4ef5-bce4-d9bc572027db_Distribution",
            },
            "type": "create",
          },
          {
            "checkUnique": false,
            "dataset_uri": "http://ex.com#Dataset_Apples🔴",
            "prev": null,
            "property": "distribution__mediaType",
            "triple": {
              "o": "apple/vision🔴",
              "p": "dcat:mediaType",
              "s": "http://telicent.io/catalog#572f1eda-c517-4ef5-bce4-d9bc572027db_Distribution",
            },
            "type": "create",
          },
        ],
      }
    `);
    expect(responses.errors).toMatchInlineSnapshot(`
      {
        "distributionIdentifier": [
          {
            "details": "[distribution__identifier] NOT UNIQUE "dist_apples🔴" already exists {"type":"create","triple":{"s":"http://telicent.io/catalog#193b5633-bb7f-43bb-8f46-ef81d98be32e_Distribution","p":"dct:identifier","o":"dist_apples🔴"},"checkUnique":true,"prev":null,"dataset_uri":"http://ex.com#Dataset_Apples🔴","property":"distribution__identifier"}",
            "error": "NOT UNIQUE "dist_apples🔴" already exists",
          },
        ],
        "distributionMediaType": [],
      }
    `);
  }
});

// 🔴🟠🟡🟢🔵🟣
