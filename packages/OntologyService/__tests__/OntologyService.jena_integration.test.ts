
import { OntologyService, RDFSClass, OWLClass, RDFSResource, RDFProperty, OWLObjectProperty, OWLDatatypeProperty, HierarchyNode, Style, QueryResponse, SPOQuerySolution } from "../index";

const os = new OntologyService(
  "http://localhost:3030/",
  "ontology_test",
  undefined,
  undefined,
  true
);

const testFullOntology = false

const rdfsClass = "http://www.w3.org/2000/01/rdf-schema#Class";
const owlClass = "http://www.w3.org/2002/07/owl#Class";
const testDefaultNamespace = "http://telicent.io/data/";

const initialNodeCount:number = 6
const finalNodeCount:number = 10
const expectedTripleCount:number = 19

function delay(ms: number) {
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
    delay(1500)
    const g2 = new RDFSClass(os, `${testDefaultNamespace}ONT2`);
    const g21 = new OWLClass(os, `${testDefaultNamespace}ONT21`);
    g21.addLabel("G21")
    const g211 = new OWLClass(os, `${testDefaultNamespace}ONT211`);
    const p1 = new RDFProperty(os, `${testDefaultNamespace}prop1`);
    const p2 = new OWLObjectProperty(os, `${testDefaultNamespace}prop2`);
    const p3 = new OWLDatatypeProperty(os, `${testDefaultNamespace}prop3`);
    const mystyle = new Style()
    g2.setStyle(mystyle)
    

    g2.addSubClass(g21);
    g21.addSubClass(g211);

    p1.addSubProperty(p2)
    p3.addSuperProperty(p2)

    delay(3000)
  });

  it("should be running properly and connected to a triplestore - also tests the runQuery method", async () => {
    const ats: boolean = await os.checkTripleStore();
    expect(ats).toBeTruthy();
    if (testFullOntology) {
      const os2 = new OntologyService(
        "http://localhost:3030/",
        "ontology",
        undefined,
        undefined,
        false
      );
      const h = await os2.getClassHierarchy();
      h.forEach((node) => {
        node.subs.forEach((subNode) => {
          if (subNode.item.uri == "http://www.w3.org/2000/01/rdf-schema#Literal") {
            console.log(subNode)
          }
        });
      })
    }
  });

  it("should cache classes appropriately", async () => {
    expect(Object.keys(os.nodes).length).toEqual(initialNodeCount);
    await os.getAllClasses(true) 
    expect(Object.keys(os.nodes).length).toEqual(finalNodeCount);
  });

  it("should be running properly and connected to a triplestore - also tests the runQuery method", async () => {
    const triples: QueryResponse<SPOQuerySolution> = await os.runQuery<SPOQuerySolution>("SELECT * WHERE {?s ?p ?o}");
    expect(triples.results.bindings.length).toEqual(expectedTripleCount);
    expect(Object.keys(os.nodes).length).toEqual(finalNodeCount);
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

  it("it should not accidently create any new Typescript objects while doing so", async () => {
    new RDFSClass(os, `${testDefaultNamespace}ONT1`);
    new RDFSClass(os, `${testDefaultNamespace}ONT11`);
    new RDFSClass(os, `${testDefaultNamespace}ONT12`);
    new OWLClass(os, `${testDefaultNamespace}ONT121`);
    expect(Object.keys(os.nodes).length).toEqual(finalNodeCount);
  });

  it('should detect two subproperty relationships that have been created', async () => {
    const p1 = new RDFProperty(os, `${testDefaultNamespace}prop1`);
    const p2 = new OWLObjectProperty(os, `${testDefaultNamespace}prop2`);
    const p3 = new OWLDatatypeProperty(os, `${testDefaultNamespace}prop3`);
    expect(Object.keys(os.nodes).length).toEqual(finalNodeCount); // just make sure no extra properties got made
    const p1subs:RDFProperty[] = await p1.getSubProperties()
    expect(p1subs.length).toEqual(1)
    expect(p1subs[0] === p2)
    const p2subs:RDFProperty[] = await p2.getSubProperties()
    expect(p2subs.length).toEqual(1)
    expect(p2subs[0] === p3)
    if (testFullOntology) {
      const os2 = new OntologyService(
        "http://localhost:3030/",
        "ontology",
        undefined,
        undefined,
        false
      );
      const prop = new OWLObjectProperty(os2,"http://ies.data.gov.uk/ontology/ies4#isPartOf")
      const desc = await prop.describe()
      console.log(desc)

    }
  })

  it("should detect that subclasses were created", async () => {
    const g1 = new RDFSClass(os, `${testDefaultNamespace}ONT1`);
    const g11 = new RDFSClass(os, `${testDefaultNamespace}ONT11`);
    const g12 = new RDFSClass(os, `${testDefaultNamespace}ONT12`);
    const g21 = new OWLClass(os, `${testDefaultNamespace}ONT21`);
    const g121 = new OWLClass(os, `${testDefaultNamespace}ONT121`);
    const g1_subs = await g1.getSubClasses(false);
    const g12_subs = await g12.getSubClasses(false);
    expect(g1_subs.length).toEqual(2);
    expect(g12_subs.length).toEqual(1);
    if (testFullOntology) {
      const os2 = new OntologyService(
        "http://localhost:3030/",
        "ontology",
        undefined,
        undefined,
        false
      );
      const entity = new RDFSClass(os2,"http://ies.data.gov.uk/ontology/ies4#Entity")
      //const entity = new RDFSClass(os2,"http://www.w3.org/2002/07/owl#Thing")
      const desc = await entity.describe()
      console.log(desc)
      const diags = await entity.getDiagrams()
      console.log(diags)
      const phy = await os2.getClassHierarchy()

    }

    expect(g1_subs.includes(g11)).toBeTruthy();
    expect(g1_subs.includes(g12)).toBeTruthy();

    const g1_subs_rec = await g1.getSubClasses(true);
    expect(g1_subs_rec.length).toEqual(3);
    expect(g1_subs_rec.includes(g11)).toBeTruthy();
    expect(g1_subs_rec.includes(g12)).toBeTruthy();
    expect(g1_subs_rec.includes(g121)).toBeTruthy();
  });

  it("should have more classes than top-most classes", async () => {
    const tops: RDFSClass[] = await os.getTopClasses();
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

  it("should get a hierarchy", async () => {
    const hy:HierarchyNode[] = await os.getClassHierarchy()
    expect(hy.length).toEqual(2)
    const phy:HierarchyNode[] = await os.getPropertyHierarchy()
    expect(phy.length).toEqual(1)
  });

  afterAll( ()=>{
    delay(1000)
  });
  
});
