import {
  CatalogService,
  DCATCatalog,
  DCATDataset,
  DCATResource,
  DCATDataService,
} from "../index";
import { makeStatic } from "./makeStatic";



const cs = new CatalogService(
  "http://localhost:3030/",
  "catalog",
  undefined,
  undefined,
  true
);
const rdfsResource = "http://www.w3.org/2000/01/rdf-schema#Resource";
// QUESTION Why does order of result change when I incr. number?
const testDefaultNamespace = "http://telicent.io/data/";
const cat1 = `${testDefaultNamespace}cat1`;
const dataset1 = `${testDefaultNamespace}dataset1`;
const dataservice1 = `${testDefaultNamespace}dataservice1`;

const initialTripleCount = 11;
const initialNodeCount = 3;

function delays(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("CatalogService", () => {
  beforeAll(async () => {
    await cs.runUpdate(["DELETE WHERE {?s ?p ?o }"]); //clear the dataset
    await delays(1000);
    // TODO hm, nice to have easy way to access sparql log from Service
    // const log = cs.getSparqlLog();
    // new DCATCatalog(...)
    // expectDiff(log, cs.getSparqlLog()).toMatchInlineSnapshot()

    const cat = new DCATCatalog(
      cs,
      cat1,
      "Catalog One",
      "2022-01-01"
    );
    const d1 = new DCATDataset(
      cs,
      dataset1,
      "Dataset One",
      "2022-01-02",
      undefined,
      cat
    );
    const ds1 = new DCATDataService(
      cs,
      dataservice1,
      "Data Service One",
      undefined,
      undefined
    );
    ds1.setPublished("2022-01-03");
    cat.addOwnedResource(ds1);
    await delays(3000);
  });

  it("should be running properly and connected to a triplestore", async () => {
    let ats: boolean = await cs.checkTripleStore();
    expect(ats).toBeTruthy();
  });

  it(`should have added the expected amount of triples: ${initialTripleCount}`, async () => {
    const query = `SELECT ?s ?p ?o WHERE { ?s ?p ?o }`;
    const data = await cs.runQuery(query);
    expect(data.results.bindings.length).toEqual(initialTripleCount);
    expect(makeStatic(data.results)).toMatchInlineSnapshot(`
      {
        "bindings": [
          {
            "o": {
              "type": "uri",
              "value": "http://www.w3.org/ns/dcat#Catalog",
            },
            "p": {
              "type": "uri",
              "value": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
            },
            "s": {
              "type": "uri",
              "value": "http://telicent.io/data/cat1",
            },
          },
          {
            "o": {
              "type": "uri",
              "value": "http://telicent.io/data/dataservice1",
            },
            "p": {
              "type": "uri",
              "value": "http://www.w3.org/ns/dcat#service",
            },
            "s": {
              "type": "uri",
              "value": "http://telicent.io/data/cat1",
            },
          },
          {
            "o": {
              "type": "literal",
              "value": "Catalog One",
            },
            "p": {
              "type": "uri",
              "value": "http://purl.org/dc/terms/title",
            },
            "s": {
              "type": "uri",
              "value": "http://telicent.io/data/cat1",
            },
          },
          {
            "o": {
              "type": "literal",
              "value": "######## makeStatic() ########",
            },
            "p": {
              "type": "uri",
              "value": "http://purl.org/dc/terms/published",
            },
            "s": {
              "type": "uri",
              "value": "http://telicent.io/data/cat1",
            },
          },
          {
            "o": {
              "type": "uri",
              "value": "http://telicent.io/data/dataset1",
            },
            "p": {
              "type": "uri",
              "value": "http://www.w3.org/ns/dcat#dataset",
            },
            "s": {
              "type": "uri",
              "value": "http://telicent.io/data/cat1",
            },
          },
          {
            "o": {
              "type": "uri",
              "value": "http://www.w3.org/ns/dcat#DataService",
            },
            "p": {
              "type": "uri",
              "value": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
            },
            "s": {
              "type": "uri",
              "value": "http://telicent.io/data/dataservice1",
            },
          },
          {
            "o": {
              "type": "literal",
              "value": "Data Service One",
            },
            "p": {
              "type": "uri",
              "value": "http://purl.org/dc/terms/title",
            },
            "s": {
              "type": "uri",
              "value": "http://telicent.io/data/dataservice1",
            },
          },
          {
            "o": {
              "type": "literal",
              "value": "######## makeStatic() ########",
            },
            "p": {
              "type": "uri",
              "value": "http://purl.org/dc/terms/published",
            },
            "s": {
              "type": "uri",
              "value": "http://telicent.io/data/dataservice1",
            },
          },
          {
            "o": {
              "type": "uri",
              "value": "http://www.w3.org/ns/dcat#Dataset",
            },
            "p": {
              "type": "uri",
              "value": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
            },
            "s": {
              "type": "uri",
              "value": "http://telicent.io/data/dataset1",
            },
          },
          {
            "o": {
              "type": "literal",
              "value": "Dataset One",
            },
            "p": {
              "type": "uri",
              "value": "http://purl.org/dc/terms/title",
            },
            "s": {
              "type": "uri",
              "value": "http://telicent.io/data/dataset1",
            },
          },
          {
            "o": {
              "type": "literal",
              "value": "######## makeStatic() ########",
            },
            "p": {
              "type": "uri",
              "value": "http://purl.org/dc/terms/published",
            },
            "s": {
              "type": "uri",
              "value": "http://telicent.io/data/dataset1",
            },
          },
        ],
      }
    `);
  });

  it("Should find catalog-owned items", async () => {
    const cat = new DCATCatalog(cs, cat1);
    expect(cat.statement).toMatchInlineSnapshot(`undefined`);
    const d1 = new DCATDataset(cs, dataset1);
    const ds1 = new DCATDataService(cs, dataservice1);
    const ownedResources = await cat.getOwnedResources();
    expect(ownedResources.length).toEqual(2);
    const objs: DCATResource[] = [];
    for (const key in ownedResources) {
      objs.push(ownedResources[key]);
    }
    expect(objs.includes(d1)).toBeTruthy();
    expect(objs.includes(ds1)).toBeTruthy();
  });

  it("Specialised getowned methods should return correct items", async () => {
    const cat = new DCATCatalog(cs, cat1);
    const d1 = new DCATDataset(cs, dataset1);
    const ds1 = new DCATDataService(cs, dataservice1);
    const ownedDatasets = await cat.getOwnedDatasets();
    expect(ownedDatasets.length).toEqual(1);
    expect(ownedDatasets[0] === d1).toBeTruthy();
    const ownedServices = await cat.getOwnedServices();
    expect(ownedServices.length).toEqual(1);
    expect(ownedServices[0] === ds1).toBeTruthy();
  });

  it(`it should set titles propertly`, async () => {
    const cat = new DCATCatalog(cs, cat1);
    const catTitle = await cat.getDcTitle();
    const d1 = new DCATDataset(cs, dataset1);
    const d1Title = await d1.getDcTitle();
    const ds1 = new DCATDataService(cs, dataservice1);
    const ds1Title = await ds1.getDcTitle();
    expect(catTitle.length).toEqual(1);
    expect(catTitle[0]).toEqual("Catalog One");
    expect(d1Title.length).toEqual(1);
    expect(d1Title[0]).toEqual("Dataset One");
    expect(ds1Title.length).toEqual(1);
    expect(ds1Title[0]).toEqual("Data Service One");
  });

  it(`it should set published dates propertly`, async () => {
    const cat = new DCATCatalog(cs, cat1);
    const catPub = await cat.getDcPublished();
    const d1 = new DCATDataset(cs, dataset1);
    const d1Pub = await d1.getDcPublished();
    const ds1 = new DCATDataService(cs, dataservice1);
    const ds1Pub = await ds1.getDcPublished();
    expect(catPub.length).toEqual(1);
    expect(catPub[0]).toEqual("2022-01-01");
    expect(d1Pub.length).toEqual(1);
    expect(d1Pub[0]).toEqual("2022-01-02");
    expect(ds1Pub.length).toEqual(1);
  });

  it(`should not have added any more triples than: ${initialTripleCount} at this stage`, async () => {
    const query = `SELECT ?s ?p ?o WHERE { ?s ?p ?o }`;
    const data = await cs.runQuery(query);
    expect(data.results.bindings.length).toEqual(initialTripleCount);
  });

  it(`There should be ${initialNodeCount} nodes cached in the service at this stage`, async () => {
    expect(Object.keys(cs.nodes).length).toEqual(initialNodeCount);
  });
  // const S = 1000;
  // const M = 60 * S;
  // const H = 60 * M;
  // const D = 24 * H;
  // it('wait', (done) => {
  //   expect(true).toBeTruthy();
  //   setTimeout(done, D)

  // }, D)
});
