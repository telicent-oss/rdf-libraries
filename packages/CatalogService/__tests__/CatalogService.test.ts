import { StartedDockerComposeEnvironment } from "testcontainers";
import {
  CatalogService,
  DCATCatalog,
  DCATDataset,
  DCATResource,
  DCATDataService,
} from "../index";
import { setupContainer } from "./setupContainer";
const rdfsResource = "http://www.w3.org/2000/01/rdf-schema#Resource";
const testDefaultNamespace = "http://telicent.io/data/";
const id1 = `${testDefaultNamespace}cat1`;
const id2 = `${testDefaultNamespace}dataset1`;
const id3 = `${testDefaultNamespace}dataservice1`;
const SEC = 1000;
const initialTripleCount = 11;
const initialNodeCount = 3;

function delays(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("CatalogService", () => {
  let environment: StartedDockerComposeEnvironment;
  let cs: CatalogService;

  beforeAll(async () => {
    console.log(`----------------------------------------------------------------
      CatalogService.test.js — beforeAll`);
    const result = await setupContainer();
    environment = result.environment;
    cs = result.cs;

    cs.runUpdate(["DELETE WHERE {?s ?p ?o }"]); //clear the dataset
    await delays(1000);
    const cat = new DCATCatalog(cs, id1, "Catalog One", "2022-01-01");
    const d1 = new DCATDataset(
      cs,
      id2,
      "Dataset One",
      "2022-01-02",
      undefined,
      cat
    );
    const ds1 = new DCATDataService(
      cs,
      id3,
      "Data Service One",
      undefined,
      undefined
    );
    ds1.setPublished("2022-01-03");
    cat.addOwnedResource(ds1);
    await delays(3000);
  }, 30 * SEC);

  afterAll(async () => {
    console.log(`----------------------------------------------------------------
      CatalogService.test.js — afterAll`);
    await Promise.all(cs.workAsync);
    await environment.down({ removeVolumes: true });
  }, 20 * SEC);

  it(
    "should be running properly and connected to a triplestore",
    async () => {
      console.log(`----------------------------------------------------------------
        CatalogService.test.js — should be running properly and connected to a triplestore`);
      let ats: boolean = await cs.checkTripleStore();
      expect(ats).toBeTruthy();
    },
    30 * SEC
  );

  it(
    `should have added the expected amount of triples: ${initialTripleCount}`,
    async () => {
      console.log(`----------------------------------------------------------------
        CatalogService.test.js — should have added the expected amount of triples: ${initialTripleCount}`);
      const query = `SELECT ?s ?p ?o WHERE { ?s ?p ?o }`;
      expect.assertions(1);
      const data = await cs.runQuery(query);
      expect(data.results.bindings.length).toEqual(initialTripleCount);
    },
    30 * SEC
  );

  it(
    "Should find catalog-owned items",
    async () => {
      console.log(`----------------------------------------------------------------
        CatalogService.test.js — Should find catalog-owned items`);
      const cat = new DCATCatalog(cs, id1);
      const d1 = new DCATDataset(cs, id2);
      const ds1 = new DCATDataService(cs, id3);
      const ownedResources = await cat.getOwnedResources();
      expect(ownedResources.length).toEqual(2);
      const objs: DCATResource[] = [];
      for (const key in ownedResources) {
        objs.push(ownedResources[key]);
      }
      expect(objs.includes(d1)).toBeTruthy();
      expect(objs.includes(ds1)).toBeTruthy();
    },
    30 * SEC
  );

  it(
    "Specialised getowned methods should return correct items",
    async () => {
      console.log(`----------------------------------------------------------------
        CatalogService.test.js — Specialised getowned methods should return correct items`);
      const cat = new DCATCatalog(cs, id1);
      const d1 = new DCATDataset(cs, id2);
      const ds1 = new DCATDataService(cs, id3);
      const ownedDatasets = await cat.getOwnedDatasets();
      expect(ownedDatasets.length).toEqual(1);
      expect(ownedDatasets[0] === d1).toBeTruthy();
      const ownedServices = await cat.getOwnedServices();
      expect(ownedServices.length).toEqual(1);
      expect(ownedServices[0] === ds1).toBeTruthy();
    },
    30 * SEC
  );

  it(
    `it should set titles properly`,
    async () => {
      console.log(`----------------------------------------------------------------
        CatalogService.test.js — it should set titles properly`);
      const cat = new DCATCatalog(cs, id1);
      const catTitle = await cat.getDcTitle();
      const d1 = new DCATDataset(cs, id2);
      const d1Title = await d1.getDcTitle();
      const ds1 = new DCATDataService(cs, id3);
      const ds1Title = await ds1.getDcTitle();
      expect(catTitle.length).toEqual(1);
      expect(catTitle[0]).toEqual("Catalog One");
      expect(d1Title.length).toEqual(1);
      expect(d1Title[0]).toEqual("Dataset One");
      expect(ds1Title.length).toEqual(1);
      expect(ds1Title[0]).toEqual("Data Service One");
    },
    30 * SEC
  );

  it(
    `it should set published dates properly`,
    async () => {
      console.log(`----------------------------------------------------------------
        CatalogService.test.js — it should set published dates properly`);
      const cat = new DCATCatalog(cs, id1);
      const catPub = await cat.getDcPublished();
      const d1 = new DCATDataset(cs, id2);
      const d1Pub = await d1.getDcPublished();
      const ds1 = new DCATDataService(cs, id3);
      const ds1Pub = await ds1.getDcPublished();
      expect(catPub.length).toEqual(1);
      expect(catPub[0]).toEqual("2022-01-01");
      expect(d1Pub.length).toEqual(1);
      expect(d1Pub[0]).toEqual("2022-01-02");
      expect(ds1Pub.length).toEqual(1);
    },
    30 * SEC
  );

  it(
    `should not have added any more triples than: ${initialTripleCount} at this stage`,
    async () => {
      console.log(`----------------------------------------------------------------
        CatalogService.test.js — should not have added any more triples than: ${initialTripleCount} at this stage`);
      const query = `SELECT ?s ?p ?o WHERE { ?s ?p ?o }`;
      const data = await cs.runQuery(query);
      expect(data.results.bindings.length).toEqual(initialTripleCount);
    },
    30 * SEC
  );

  it(
    `There should be ${initialNodeCount} nodes cached in the service at this stage`,
    async () => {
      console.log(`----------------------------------------------------------------
        CatalogService.test.js — There should be ${initialNodeCount} nodes cached in the service at this stage`);
      expect(Object.keys(cs.nodes).length).toEqual(initialNodeCount);
    },
    30 * SEC
  );
});
