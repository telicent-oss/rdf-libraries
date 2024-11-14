import { OntologyService, RDFSClass, OWLClass, RDFSResource, RDFProperty, OWLObjectProperty, OWLDatatypeProperty,   } from "../index";
import { QueryResponse, SPOQuerySolution } from "@telicent-oss/RdfService";
const os = new OntologyService(
  "http://localhost:3030/",
  "ontology_test",
  undefined,
  undefined,
  true
);

const rdfsClass = "http://www.w3.org/2000/01/rdf-schema#Class";
const owlClass = "http://www.w3.org/2002/07/owl#Class";
const testDefaultNamespace = "http://telicent.io/data/";

const expectedNodeCount:number = 9
const expectedTripleCount:number = 11

function delays(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("OntologyService - Integration Test with Fuseki", () => {
  it("should be running properly and connected to a triplestore, creating the right data", async () => {
    //this ends up being a big it
    const ats: boolean = await os.checkTripleStore();
    expect(ats).toBeTruthy();
    await os.runUpdate(["DELETE WHERE {?s ?p ?o }"]); //clear the dataset
    await delays(1000);
    const g1 = await RDFSClass.createAsync(os, `${testDefaultNamespace}ONT1`);
    const g11 = await RDFSClass.createAsync(os, `${testDefaultNamespace}ONT11`);
    const g12 = await RDFSClass.createAsync(os, `${testDefaultNamespace}ONT12`);
    const g13 = await RDFSClass.createAsync(os, `${testDefaultNamespace}ONT13`);
    const g111 = await OWLClass.createAsync(os, `${testDefaultNamespace}ONT111`);
    const g121 = await OWLClass.createAsync(os, `${testDefaultNamespace}ONT121`);
    const p1 = await RDFProperty.createAsync(os, `${testDefaultNamespace}prop1`);
    const p2 = new OWLObjectProperty(os, `${testDefaultNamespace}prop2`);
    const p3 = new OWLDatatypeProperty(os, `${testDefaultNamespace}prop3`);
    await p1.addSubProperty(p2)

    await p3.addSuperProperty(p2)
    await delays(1000);
    //after a short wait, we should now have a predictable number of items
    const triples: QueryResponse<SPOQuerySolution> = await os.runQuery<SPOQuerySolution>("SELECT * WHERE {?s ?p ?o}");
    expect(triples.results.bindings.length).toEqual(expectedTripleCount);
    //more detailed checks around identity
    expect(g1.uri === `${testDefaultNamespace}ONT1`).toBeTruthy();
    expect(g11.uri === `${testDefaultNamespace}ONT11`).toBeTruthy();
    expect(g111.uri === `${testDefaultNamespace}ONT111`).toBeTruthy();
    //now check types are correct
    expect(g1.types.includes(rdfsClass)).toBeTruthy();
    expect(g11.types.includes(rdfsClass)).toBeTruthy();
    expect(g111.types.includes(owlClass)).toBeTruthy();
    expect(g1.types.length).toEqual(1);
    expect(g11.types.length).toEqual(1);
    expect(g111.types.length).toEqual(1);
    //if we add subclass relations, we shouldn't get 
    const g11_: RDFSClass = await g1.addSubClass(g11);
    const g12_: RDFSClass = await g1.addSubClass(g12);
    const g13_: RDFSClass = await g1.addSubClass(g13);
    const g121_: RDFSClass = await g12.addSubClass(g121);
    const g11__: RDFSClass = await g111.addSuperClass(g11);
    await delays(1000);
    expect(Object.keys(os.nodes).length).toEqual(expectedNodeCount);
    expect(g11_.uri === `${testDefaultNamespace}ONT11`).toBeTruthy();
    expect(g12_.uri === `${testDefaultNamespace}ONT12`).toBeTruthy();
    expect(g13_.uri === `${testDefaultNamespace}ONT13`).toBeTruthy();
    expect(g121_.uri === `${testDefaultNamespace}ONT121`).toBeTruthy();
    expect(g11.uri === g11_.uri).toBeTruthy();
    expect(g11.uri === g11__.uri).toBeTruthy();
    expect(g11 === g11_).toBeTruthy();
    expect(g11 === g11__).toBeTruthy();

    expect(Object.keys(os.nodes).length).toEqual(expectedNodeCount); // just make sure no extra properties got made
    const p1subs:RDFProperty[] = await p1.getSubProperties()
    expect(p1subs.length).toEqual(1)
    expect(p1subs[0] === p2)
    const p2subs:RDFProperty[] = await p2.getSubProperties()
    expect(p2subs.length).toEqual(1)
    expect(p2subs[0] === p3)

    //check subclasses were created correctly
    const g1_subs = await g1.getSubClasses(false);
    expect(g1_subs.length).toEqual(3);
    expect(g1_subs.includes(g11)).toBeTruthy();
    expect(g1_subs.includes(g12)).toBeTruthy();
    expect(g1_subs.includes(g13)).toBeTruthy();
    const g1_subs_rec = await g1.getSubClasses(true);
    expect(g1_subs_rec.length).toEqual(5);
    expect(g1_subs_rec.includes(g11)).toBeTruthy();
    expect(g1_subs_rec.includes(g12)).toBeTruthy();
    expect(g1_subs_rec.includes(g13)).toBeTruthy();
    expect(g1_subs_rec.includes(g111)).toBeTruthy();
    expect(g1_subs_rec.includes(g121)).toBeTruthy();
    //check there are more classes than just the top (orphan classes)
    const tops: RDFSClass[] = await os.getTopClasses();
    const all: RDFSClass[] = await os.getAllClasses();
    expect(all.length > tops.length).toBeTruthy;
    expect(tops.length).toEqual(1)
    expect(all.length).toEqual(6)
    //do we also get OWL classes back ?
    const oc = os.lookupClass(owlClass, RDFSClass);
    expect(oc).toEqual(OWLClass);
    //does it default to RDFS Resource if not found ?
    const rr = os.lookupClass("doh", RDFSResource);
    expect(rr).toEqual(RDFSResource);
    
  });
});
