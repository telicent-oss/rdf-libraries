import { DispatchResult } from "@telicent-oss/rdf-write-lib";
import { DCATResource } from "../RDFSResource.DCATResource";
import { StoreTriplesOptions } from "./storeTripleResultsToValueObject";
import { CatalogService } from "../RdfService.CatalogService";
import { storeTriplesForPhase2 } from "./storeTriplesForPhase2";
import { GraphData } from "./createOperations";

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

test.skip("storeTriplesForPhase2 distribution", async () => {
  const uri = "http://ex.com#Dataset_Apples🔴";
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

  const property: GraphData = "distribution__identifier";

  const result = storeTriplesForPhase2({
    instance,
    property,
    newValue: "new dist idenfifier",
    api,
    catalogService,
  });
  expect(await result).toMatchInlineSnapshot(`
    [
      {
        "dataset_uri": "http://ex.com#Dataset_Apples🔴",
        "prev": null,
        "property": "distribution",
        "triple": {
          "o": "http://telicent.io/catalog#522cb734-9fba-4898-8983-2c422a11f916_Distribution",
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
          "s": "http://telicent.io/catalog#522cb734-9fba-4898-8983-2c422a11f916_Distribution",
        },
        "type": "create",
      },
      {
        "details": "[distribution__identifier] NOT UNIQUE "new dist idenfifier" already exists {"type":"create","triple":{"s":"http://telicent.io/catalog#522cb734-9fba-4898-8983-2c422a11f916_Distribution","p":"dct:identifier","o":"new dist idenfifier"},"checkUnique":true,"prev":null,"dataset_uri":"http://ex.com#Dataset_Apples🔴","property":"distribution__identifier"}",
        "error": "NOT UNIQUE "new dist idenfifier" already exists",
      },
    ]
  `);
});
