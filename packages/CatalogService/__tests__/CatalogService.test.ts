import {  CatalogService, DCATCatalog, DCATDataset, DCATResource, DCATDataService } from "../index";
const cs = new CatalogService("http://localhost:3030/", "catalog_test", undefined, undefined,true);
const rdfsResource = "http://www.w3.org/2000/01/rdf-schema#Resource";
const testDefaultNamespace = "http://telicent.io/data/";
const id1 = `${testDefaultNamespace}cat1`;
const id2 = `${testDefaultNamespace}dataset1`;
const id3 = `${testDefaultNamespace}dataservice1`;

const initialTripleCount = 11
const initialNodeCount = 3

function delays(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


describe("CatalogService", () => {

  beforeAll(async () => {
    cs.runUpdate(["DELETE WHERE {?s ?p ?o }"]); //clear the dataset
    await delays(1000)
    const cat = new DCATCatalog(cs,id1,"Catalog One","2022-01-01")
    const d1 = new DCATDataset(cs,id2,"Dataset One","2022-01-02",undefined,cat)
    const ds1 = new DCATDataService(cs,id3,"Data Service One",undefined,undefined)
    ds1.setPublished("2022-01-03")
    cat.addOwnedResource(ds1)
    await delays(3000)
  });

  it("should be running properly and connected to a triplestore", async () => {
    let ats: boolean = await cs.checkTripleStore();
    expect(ats).toBeTruthy();
  });

  it(`should have added the expected amount of triples: ${initialTripleCount}`, async () => {
    const query = `SELECT ?s ?p ?o WHERE { ?s ?p ?o }`;
    expect.assertions(1);
    const data = await cs.runQuery(query);
    expect(data.results.bindings.length).toEqual(initialTripleCount);
  });

  it('Should find catalog-owned items', async () => {
    const cat = new DCATCatalog(cs,id1)
    const d1 = new DCATDataset(cs,id2)
    const ds1 = new DCATDataService(cs,id3)
    const ownedResources = await cat.getOwnedResources()
    expect(ownedResources.length).toEqual(2)
    const objs:DCATResource[] = []
    for (const key in ownedResources) {
      objs.push(ownedResources[key])
    }
    expect(objs.includes(d1)).toBeTruthy()
    expect(objs.includes(ds1)).toBeTruthy()
  });

  it('Specialised getowned methods should return correct items', async () => {
    const cat = new DCATCatalog(cs,id1)
    const d1 = new DCATDataset(cs,id2)
    const ds1 = new DCATDataService(cs,id3)
    const ownedDatasets = await cat.getOwnedDatasets()
    expect(ownedDatasets.length).toEqual(1)
    expect(ownedDatasets[0] === d1).toBeTruthy()
    const ownedServices = await cat.getOwnedServices()
    expect(ownedServices.length).toEqual(1)
    expect(ownedServices[0] === ds1).toBeTruthy()
  });

  it(`it should set titles propertly`, async () => {
    const cat = new DCATCatalog(cs,id1)
    const catTitle = await cat.getDcTitle()
    const d1 = new DCATDataset(cs,id2)
    const d1Title = await d1.getDcTitle()
    const ds1 = new DCATDataService(cs,id3)
    const ds1Title = await ds1.getDcTitle()
    expect(catTitle.length).toEqual(1);
    expect(catTitle[0]).toEqual("Catalog One");
    expect(d1Title.length).toEqual(1);
    expect(d1Title[0]).toEqual("Dataset One");
    expect(ds1Title.length).toEqual(1);
    expect(ds1Title[0]).toEqual("Data Service One");
  });

  it(`it should set published dates propertly`, async () => {
    const cat = new DCATCatalog(cs,id1)
    const catPub = await cat.getDcPublished()
    const d1 = new DCATDataset(cs,id2)
    const d1Pub = await d1.getDcPublished()
    const ds1 = new DCATDataService(cs,id3)
    const ds1Pub = await ds1.getDcPublished()
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
  
});
