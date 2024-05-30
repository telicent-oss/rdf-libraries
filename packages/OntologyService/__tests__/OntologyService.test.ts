
import { OntologyService, RDFSClass, OWLClass, RDFSResource, RDFProperty, OWLObjectProperty, OWLDatatypeProperty,   } from "../index";
import { QueryResponse, SPOQuerySolution } from "../../RdfService/index";
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

const initialNodeCount:number = 10
const expectedTripleCount:number = 17

function delays(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("OntologyService - Integration Test with Fuseki - Create Data", () => {

  beforeAll( ()=>{
    //this ends up being a big it
    const updates = []
    updates.push("DELETE WHERE {?s ?p ?o }"); //clear the dataset
    updates.push(`INSERT DATA {<${testDefaultNamespace}ONT1> <${os.rdfType}> <${os.rdfsClass}> . }`)
    updates.push(`INSERT DATA {<${testDefaultNamespace}ONT11> <${os.rdfType}> <${os.rdfsClass}> . }`)
    updates.push(`INSERT DATA {<${testDefaultNamespace}ONT12> <${os.rdfType}> <${os.rdfsClass}> . }`)
    updates.push(`INSERT DATA {<${testDefaultNamespace}ONT121> <${os.rdfType}> <${os.owlClass}> . }`)
    updates.push(`INSERT DATA {<${testDefaultNamespace}ONT11> <${os.rdfsSubClassOf}> <${testDefaultNamespace}ONT1> . }`)
    updates.push(`INSERT DATA {<${testDefaultNamespace}ONT12> <${os.rdfsSubClassOf}> <${testDefaultNamespace}ONT1> . }`)
    updates.push(`INSERT DATA {<${testDefaultNamespace}ONT121> <${os.rdfsSubClassOf}> <${testDefaultNamespace}ONT12> . }`)
    os.runUpdate(updates)
    const g2 = new RDFSClass(os, `${testDefaultNamespace}ONT2`);
    const g21 = new OWLClass(os, `${testDefaultNamespace}ONT21`);
    const g211 = new OWLClass(os, `${testDefaultNamespace}ONT211`);
    const p1 = new RDFProperty(os, `${testDefaultNamespace}prop1`);
    const p2 = new OWLObjectProperty(os, `${testDefaultNamespace}prop2`);
    const p3 = new OWLDatatypeProperty(os, `${testDefaultNamespace}prop3`);
    g2.addSubClass(g21);
    g21.addSubClass(g211);

    p1.addSubProperty(p2)
    p3.addSuperProperty(p2)
    delays(2000)
    os.getAllClasses(true)
  });

  it("should be running properly and connected to a triplestore - also tests the runQuery method", async () => {
    const ats: boolean = await os.checkTripleStore();
    expect(ats).toBeTruthy();
  });

  it("should be running properly and connected to a triplestore - also tests the runQuery method", async () => {
    
    const triples: QueryResponse<SPOQuerySolution> = await os.runQuery<SPOQuerySolution>("SELECT * WHERE {?s ?p ?o}");
    expect(triples.results.bindings.length).toEqual(expectedTripleCount);
    expect(Object.keys(os.nodes).length).toEqual(initialNodeCount);
  });

  it("should allow classes to be created", async () => {
    const g1 = new RDFSClass(os, `${testDefaultNamespace}ONT1`);
    const g11 = new RDFSClass(os, `${testDefaultNamespace}ONT11`);
    expect(g1.uri === `${testDefaultNamespace}ONT1`).toBeTruthy();
    expect(g11.uri === `${testDefaultNamespace}ONT11`).toBeTruthy();

    expect(g1.types.includes(rdfsClass)).toBeTruthy();
    expect(g11.types.includes(rdfsClass)).toBeTruthy();

    expect(g1.types.length).toEqual(1);
    expect(g11.types.length).toEqual(1);

  });
});

describe("OntologyService - Check Created Data", () => {
  beforeAll(async ()=>{
    delays(3000) //give the triplestore a chance to index all the new data (should be milliseconds, but...ya know)
  });



  it("it should allow subclasses to be be created, and not accidently create any new Typescript objects while doing so", async () => {
    const g1 = new RDFSClass(os, `${testDefaultNamespace}ONT1`);
    const g11 = new RDFSClass(os, `${testDefaultNamespace}ONT11`);
    const g12 = new RDFSClass(os, `${testDefaultNamespace}ONT12`);
    const g121 = new OWLClass(os, `${testDefaultNamespace}ONT121`);

    expect(Object.keys(os.nodes).length).toEqual(initialNodeCount);
    await delays(2000);
  });

  it('should detect two subproperty relationships that have been created', async () => {
    const p1 = new RDFProperty(os, `${testDefaultNamespace}prop1`);
    const p2 = new OWLObjectProperty(os, `${testDefaultNamespace}prop2`);
    const p3 = new OWLDatatypeProperty(os, `${testDefaultNamespace}prop3`);
    expect(Object.keys(os.nodes).length).toEqual(initialNodeCount); // just make sure no extra properties got made
    const p1subs:RDFProperty[] = await p1.getSubProperties()
    expect(p1subs.length).toEqual(1)
    expect(p1subs[0] === p2)
    const p2subs:RDFProperty[] = await p2.getSubProperties()
    expect(p2subs.length).toEqual(1)
    expect(p2subs[0] === p3)
  })

  it("should detect that subclasses were created", async () => {
    const g1 = new RDFSClass(os, `${testDefaultNamespace}ONT1`);
    const g11 = new RDFSClass(os, `${testDefaultNamespace}ONT11`);
    const g12 = new RDFSClass(os, `${testDefaultNamespace}ONT12`);
    const g13 = new RDFSClass(os, `${testDefaultNamespace}ONT13`);
    const g111 = new OWLClass(os, `${testDefaultNamespace}ONT111`);
    const g121 = new OWLClass(os, `${testDefaultNamespace}ONT121`);
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
  });

  it("should have more classes than top-most classes", async () => {
    const tops: RDFSClass[] = await os.getTopClasses();
    console.log(tops)
    const all: RDFSClass[] = await os.getAllClasses();
    expect(all.length > tops.length).toBeTruthy;
    expect(tops.length).toEqual(2)
    expect(all.length).toEqual(7)
  });

  it("should return JS class for provided URI", () => {
    const rr = os.lookupClass(owlClass, RDFSClass);
    expect(rr).toEqual(OWLClass);
  });

  it("should return default RDFSResource JS class for garbage URI", () => {
    const rr = os.lookupClass("doh", RDFSResource);
    expect(rr).toEqual(RDFSResource);
  });
  
});
