import {  CatalogService, DCATCatalog, DCATDataset, DCATResource, DCATDataService } from "../index";
const cs = new CatalogService("http://localhost:3030/", "catalog_test", undefined, undefined,true);
const rdfsResource = "http://www.w3.org/2000/01/rdf-schema#Resource";
const testDefaultNamespace = "http://telicent.io/data/";
const id1 = `${testDefaultNamespace}cat1`;
const id2 = `${testDefaultNamespace}cat2`;
const id3 = `${testDefaultNamespace}cat3`;

function delays(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


describe("CatalogService", () => {

  beforeAll(async () => {
    cs.runUpdate("DELETE WHERE {?s ?p ?o }"); //clear the dataset
    await delays(1000)
    const cat = new DCATCatalog(cs,id1,"Catalog One","2022-01-01")
  });

  it("should be running properly and connected to a triplestore", async () => {
    let ats: boolean = await cs.checkTripleStore();
    expect(ats).toBeTruthy();
  });
  
});
