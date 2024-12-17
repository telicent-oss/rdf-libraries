import { StartedDockerComposeEnvironment } from "testcontainers";
import {
  CatalogService,
  DCATCatalog,
  DCATDataset,
  DCATResource,
  DCATDataService,
} from "../index";
import { setupContainer } from "../src/__tests__/utils/setupContainer";

const testDefaultNamespace = "http://telicent.io/data/";
const id1 = `${testDefaultNamespace}cat1`;
const id2 = `${testDefaultNamespace}dataset1`;
const id3 = `${testDefaultNamespace}dataservice1`;
const SEC = 1000;
const initialTripleCount = 8;
const initialNodeCount = 3;
const triplestoreUri = "http://localhost:3030/";
const catalogServiceOptions = { triplestoreUri, config: { NO_WARNINGS: true } };

describe("CatalogService", () => {
  let environment: StartedDockerComposeEnvironment;
  let catalogService: CatalogService;

  beforeAll(async () => {
    ({ catalogService, environment } = await setupContainer(
      catalogServiceOptions
    ));

    await catalogService.runUpdate(["DELETE WHERE {?s ?p ?o }"]); //clear the dataset
    const cat = await DCATCatalog.createAsync(
      catalogService,
      id1,
      "Catalog One",
      undefined
    );
    await DCATDataset.createAsync(
      catalogService,
      id2,
      "Dataset One",
      undefined,
      cat
    );
    const ds1 = await DCATDataService.createAsync(
      catalogService,
      id3,
      "Data Service One",
      undefined,
      undefined
    );
    await cat.addOwnedResource(ds1);

    /**
     * Required when running test from scratch (restarting while watchAll=true seems fine)
     * See https://telicent.atlassian.net/browse/TELFE-788
     */
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }, 60 * SEC);

  afterAll(async () => {
    await environment.down({ removeVolumes: true });
  }, 60 * SEC);

  it(
    "should be running properly and connected to a triplestore",
    async () => {
      const ats: boolean = await catalogService.checkTripleStore();
      expect(ats).toBeTruthy();
    },
    60 * SEC
  );

  it(
    `should have added the expected amount of triples: ${initialTripleCount}`,
    async () => {
      const query = `SELECT ?s ?p ?o WHERE { ?s ?p ?o }`;
      expect.assertions(1);
      const data = await catalogService.runQuery(query);
      expect(data.results.bindings.length).toEqual(initialTripleCount);
    },
    60 * SEC
  );

  it(
    "Should find catalog-owned items",
    async () => {
      const cat = await DCATCatalog.createAsync(catalogService, id1);
      const d1 = await DCATDataset.createAsync(catalogService, id2);
      const ds1 = await DCATDataService.createAsync(catalogService, id3);

      const ownedResources = await cat.getOwnedResources();

      expect(ownedResources.length).toEqual(2);
      const objs: DCATResource[] = [];
      for (const key in ownedResources) {
        objs.push(ownedResources[key]);
      }
      expect(objs.includes(d1)).toBeTruthy();
      expect(objs.includes(ds1)).toBeTruthy();
    },
    60 * SEC
  );

  it(
    "Specialised getowned methods should return correct items",
    async () => {
      const cat = await DCATCatalog.createAsync(catalogService, id1);
      const d1 = await DCATDataset.createAsync(catalogService, id2);
      const ds1 = await DCATDataService.createAsync(catalogService, id3);
      const ownedDatasets = await cat.getOwnedDatasets();
      expect(ownedDatasets.length).toEqual(1);
      expect(ownedDatasets[0] === d1).toBeTruthy();
      const ownedServices = await cat.getOwnedServices();
      expect(ownedServices.length).toEqual(1);
      expect(ownedServices[0] === ds1).toBeTruthy();
    },
    60 * SEC
  );

  it(
    `it should set titles properly`,
    async () => {
      const cat = await DCATCatalog.createAsync(catalogService, id1);
      const catTitle = await cat.getDcTitle();
      const d1 = await DCATDataset.createAsync(catalogService, id2);
      const d1Title = await d1.getDcTitle();
      const ds1 = await DCATDataService.createAsync(catalogService, id3);
      const ds1Title = await ds1.getDcTitle();
      expect(catTitle.length).toEqual(1);
      expect(catTitle[0]).toEqual("Catalog One");
      expect(d1Title.length).toEqual(1);
      expect(d1Title[0]).toEqual("Dataset One");
      expect(ds1Title.length).toEqual(1);
      expect(ds1Title[0]).toEqual("Data Service One");
    },
    60 * SEC
  );
  // The new data makes use of issued not published
  // it.skip(
  //   `it should set published dates properly`,
  //   async () => {
  //     const cat = await DCATCatalog.createAsync(catalogService, id1);
  //     const catPub = await cat.getDcPublished();
  //     const d1 = await DCATDataset.createAsync(catalogService, id2);
  //     const d1Pub = await d1.getDcPublished();
  //     const ds1 = await DCATDataService.createAsync(catalogService, id3);
  //     const ds1Pub = await ds1.getDcPublished();
  //     expect(catPub.length).toEqual(1);
  //     expect(catPub[0]).toEqual("2022-01-01");
  //     expect(d1Pub.length).toEqual(1);
  //     expect(d1Pub[0]).toEqual("2022-01-02");
  //     expect(ds1Pub.length).toEqual(1);
  //   },
  //   60 * SEC
  // );

  it(
    `should not have added any more triples than: ${initialTripleCount} at this stage`,
    async () => {
      const query = `SELECT ?s ?p ?o WHERE { ?s ?p ?o }`;
      const data = await catalogService.runQuery(query);
      expect(data.results.bindings.length).toEqual(initialTripleCount);
    },
    60 * SEC
  );

  it(
    `There should be ${initialNodeCount} nodes cached in the service at this stage`,
    async () => {
      expect(Object.keys(catalogService.nodes).length).toEqual(
        initialNodeCount
      );
    },
    60 * SEC
  );
});
