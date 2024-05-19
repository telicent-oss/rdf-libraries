import {
  RdfService,
  RDFSResource,
  RelatedResources,
  RelatedLiterals,
} from "../index";
const rs = new RdfService(
  "http://localhost:3030/",
  "rdf_test",
  undefined,
  undefined,
  true
);
rs.runUpdate("DELETE WHERE {?s ?p ?o }"); //clear the dataset
const rdfsResource = "http://www.w3.org/2000/01/rdf-schema#Resource";
const testDefaultNamespace = "http://telicent.io/data/";
const guid1 = `rdf1`;
const guid2 = `rdf2`;
const guid3 = `rdf3`;


function delays(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("RdfService", () => {

  beforeAll(async () => {
    rs.runUpdate("DELETE WHERE {?s ?p ?o }"); //clear the dataset
    await delays(1000)

    const update = `INSERT DATA {:${guid1} rdf:type rdfs:Class . }`;
    rs.runUpdate(update);

    rs.insertTriple(
      `${testDefaultNamespace}${guid2}`,
      `http://www.w3.org/1999/02/22-rdf-syntax-ns#type`,
      `http://www.w3.org/2000/01/rdf-schema#Resource`
    );

    const g2: RDFSResource = new RDFSResource(rs,`${testDefaultNamespace}${guid2}`,`http://www.w3.org/2000/01/rdf-schema#Resource`) 
    const g3: RDFSResource = new RDFSResource(rs,`${testDefaultNamespace}${guid3}`,`http://www.w3.org/2000/01/rdf-schema#Resource`) 
    rs.insertTriple(
      `${testDefaultNamespace}${guid2}`,
      `http://www.w3.org/1999/02/22-rdf-syntax-ns#type`,
      `${testDefaultNamespace}${guid3}`
    );
    rs.insertTriple(
      `${testDefaultNamespace}${guid2}`,
      `http://www.w3.org/1999/02/22-rdf-syntax-ns#type`,
      `http://www.w3.org/2000/01/rdf-schema#Class`
    );

    g2.addComment("This is a comment on guid2");
    g2.addLabel("This is a label on guid2");
    g3.addLabel("This is a label on guid3");
    await delays(2000);
  });

  it("should be running properly and connected to a triplestore", async () => {
    let ats: boolean = await rs.checkTripleStore();
    expect(ats).toBeTruthy();
  });


  it("should return default RDFSResource JS class for garbage URI", () => {
    const rr = rs.lookupClass("doh", RDFSResource);
    expect(rr).toEqual(RDFSResource);
  });

  it("should have default data namespace", () => {
    const ddns = rs.defaultNamespace;
    expect(ddns).toEqual(testDefaultNamespace);
  });

  it("should mint URIs using the default namespace", () => {
    const uri = rs.mintUri();
    expect(uri.includes(testDefaultNamespace)).toBeTruthy();
  });

  it("should mint URIs recognising a changed default namespace", () => {
    rs.defaultNamespace = "http://testing.org/";
    const uri = rs.mintUri();
    rs.defaultNamespace = testDefaultNamespace; //set it back to default now we have the uri
    expect(uri.includes("http://testing.org/")).toBeTruthy();
  });

  it("should shorten URIs using default prefixes", () => {
    const short = rs.shorten(`${testDefaultNamespace}blah`);
    expect(short).toEqual(":blah");
  });

  it("should shorten URIs using rdfs prefix", () => {
    const short = rs.shorten(rdfsResource);
    expect(short).toEqual("rdfs:Resource");
  });

  it("should add a triple using SPARQL update", async () => {
    //guid1 was created at the start of the tests using simple sparql update
    const query = `SELECT ?p ?o WHERE { :${guid1} ?p ?o }`;
    expect.assertions(1);
    const data = await rs.runQuery(query);
    expect(data.results.bindings.length).toEqual(1);
  });

  it("should add a triple using the insertTriple method", async () => {
    //guid2 was created at the start of the tests using insertTriple method (includes two literals)
    const query = `SELECT ?p ?o WHERE { <${testDefaultNamespace}${guid2}> ?p ?o }`;
    expect.assertions(1);
    const data = await rs.runQuery(query);
    expect(data.results.bindings.length).toEqual(5);
  });

  it("should find related items using getRelated", async () => {
    //guid2 was created at the start of the tests using insertTriple method
    expect.assertions(1);
    const obj: RDFSResource = new RDFSResource(rs,`${testDefaultNamespace}${guid2}`)

    const rel: RelatedResources = await obj.getRelated(
      `http://www.w3.org/1999/02/22-rdf-syntax-ns#type`
    );
    let relCount = 0;
    Object.keys(rel).forEach((key: string) => {
      relCount = relCount + rel[key].length;
    });
    expect(relCount).toEqual(3);
  });

  it("should find relating items using getRelating", async () => {
    //guid3 was created at the start of the tests using insertTriple method
    expect.assertions(1);
    const obj: RDFSResource = new RDFSResource(rs,`${testDefaultNamespace}${guid3}`)

    const rel = await obj.getRelating(
      `http://www.w3.org/1999/02/22-rdf-syntax-ns#type`
    );
    let relCount = 0;
    Object.keys(rel).forEach((key: string) => {
      relCount = relCount + rel[key].length;
    });
    expect(relCount).toEqual(1);
  });

  it("should find literals", async () => {
    //guid2 was created at the start of the tests using insertTriple method, and then some literals added
    expect.assertions(1);
    const obj: RDFSResource = new RDFSResource(rs,`${testDefaultNamespace}${guid2}`)

    const lits: RelatedLiterals = await obj.getLiterals();
    let litCount = 0;
    Object.keys(lits).forEach((key: string) => {
      litCount = litCount + lits[key].length;
    });
    expect(litCount).toEqual(2);
  });

  it("should find labels", async () => {
    //guid2 was created at the start of the tests using insertTriple method, and then some literals added
    expect.assertions(1);
    const obj: RDFSResource = new RDFSResource(rs,`${testDefaultNamespace}${guid2}`)

    const labels = await obj.getLabels();

    expect(labels.length).toEqual(1);
  });

  it("should find comments", async () => {
    //guid2 was created at the start of the tests using insertTriple method, and then some literals added
    expect.assertions(1);
    const obj: RDFSResource = new RDFSResource(rs,`${testDefaultNamespace}${guid2}`)

    const labels = await obj.getComments();

    expect(labels.length).toEqual(1);
  });

  it("is not really a test, just deleting some data before next test", async () => {
    rs.deleteTriple(
      `${testDefaultNamespace}${guid2}`,
      `http://www.w3.org/1999/02/22-rdf-syntax-ns#type`,
      `${testDefaultNamespace}${guid3}`,
      "URI"
    );
    await delays(2000);
  });

  it("should now have deleted one of the related items, leaving just two", async () => {
    //guid2 was created at the start of the tests using insertTriple method
    expect.assertions(1);
    const obj: RDFSResource = new RDFSResource(rs,`${testDefaultNamespace}${guid2}`)

    const rel = await obj.getRelated(
      `http://www.w3.org/1999/02/22-rdf-syntax-ns#type`
    );
    let relCount = 0;
    Object.keys(rel).forEach((key: string) => {
      relCount = relCount + rel[key].length;
    });
    expect(relCount).toEqual(2);
  });
});
