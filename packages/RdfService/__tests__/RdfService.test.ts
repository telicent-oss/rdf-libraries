import { GenericContainer, StartedTestContainer, Wait } from "testcontainers"
import {
  RdfService,
  RDFSResource,
  RelatedResources,
  RelatedLiterals,
} from "../index";
let rs: RdfService

const rdfsResource = "http://www.w3.org/2000/01/rdf-schema#Resource";
const testDefaultNamespace = "http://telicent.io/data/";
const guid1 = `rdf1`;
const guid2 = `rdf2`;
const guid3 = `rdf3`;

const g2RelCount = 5;
const initialTripleCount = 11

function delays(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("RdfService", () => {

  let fuseki: StartedTestContainer
  beforeAll(async () => {

    fuseki = await new GenericContainer('atomgraph/fuseki')
      .withExposedPorts(3030)
      .withCommand(["--mem", "rdf_test/"])
      .withWaitStrategy(Wait.forAll(
        [Wait.forListeningPorts(), Wait.forLogMessage(/Start Fuseki \(http=\d+\)/)],
      ))
      .start()

    rs = new RdfService(
      `http://localhost:${fuseki.getMappedPort(3030)}/`,
      "rdf_test",
      undefined,
      undefined,
      true
    );
    await rs.runUpdate(["DELETE WHERE {?s ?p ?o }"]); //clear the dataset

    const update = `INSERT DATA {:${guid1} rdf:type rdfs:Class . }`;
    await rs.runUpdate([update]);

    await rs.insertTriple(
      `${testDefaultNamespace}${guid1}`,
      `http://www.w3.org/1999/02/22-rdf-syntax-ns#type`,
      `http://www.w3.org/2000/01/rdf-schema#Resource`
    );

    const g2: RDFSResource = new RDFSResource(rs, `${testDefaultNamespace}${guid2}`, `http://www.w3.org/2000/01/rdf-schema#Resource`)
    const g3: RDFSResource = new RDFSResource(rs, `${testDefaultNamespace}${guid3}`, `http://www.w3.org/2000/01/rdf-schema#Resource`)
    await rs.insertTriple(
      `${testDefaultNamespace}${guid2}`,
      `http://www.w3.org/1999/02/22-rdf-syntax-ns#type`,
      `${testDefaultNamespace}${guid3}`
    );
    await rs.insertTriple(
      `${testDefaultNamespace}${guid2}`,
      `http://www.w3.org/1999/02/22-rdf-syntax-ns#type`,
      `http://www.w3.org/2000/01/rdf-schema#Class`
    );

    await g2.addComment("This is a comment on guid2");
    await g2.addLabel("This is a label on guid2 - we like labels");
    await g3.setPrefLabel("This is a preferred label on guid3");
    await g3.setAltLabel("This is an alt label on guid3");
    await g3.setAltLabel("This is another alt label on guid3");
  });

  it("should be running properly and connected to a triplestore", async () => {
    const ats: boolean = await rs.checkTripleStore();
    expect(ats).toBeTruthy();
  });

  it("should find basic text matches", async () => {
    const found = await rs.find("label")
    expect(found.length).toEqual(2)
  });

  it(`should have added the expected amount of triples: ${initialTripleCount}`, async () => {
    //guid2 was created at the start of the tests using insertTriple method (includes two literals)
    const query = `SELECT ?s ?p ?o WHERE { ?s ?p ?o }`;
    expect.assertions(1);
    const data = await rs.runQuery(query);
    expect(data.results.bindings.length).toEqual(initialTripleCount);
  });

  it("should return specific label types (SKOS in this case)", async () => {
    const g3: RDFSResource = new RDFSResource(rs, `${testDefaultNamespace}${guid3}`, `http://www.w3.org/2000/01/rdf-schema#Resource`)
    const als = await g3.getAltLabels()
    const pls = await g3.getPrefLabel()
    expect(als.length).toEqual(2);
    expect(pls.length).toEqual(1);
    expect(pls[0]).toEqual("This is a preferred label on guid3")
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
    expect(data.results.bindings.length).toEqual(2);
  });

  it("should add a triple using the insertTriple method", async () => {
    //guid2 was created at the start of the tests using insertTriple method (includes two literals)
    const query = `SELECT ?p ?o WHERE { <${testDefaultNamespace}${guid2}> ?p ?o }`;
    expect.assertions(1);
    const data = await rs.runQuery(query);
    expect(data.results.bindings.length).toEqual(g2RelCount);
  });

  it("should find related items using getRelated", async () => {
    //guid2 was created at the start of the tests using insertTriple method
    expect.assertions(1);
    const obj: RDFSResource = new RDFSResource(rs, `${testDefaultNamespace}${guid2}`)

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
    const obj: RDFSResource = new RDFSResource(rs, `${testDefaultNamespace}${guid3}`)

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
    const obj: RDFSResource = new RDFSResource(rs, `${testDefaultNamespace}${guid2}`)

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
    const obj: RDFSResource = new RDFSResource(rs, `${testDefaultNamespace}${guid2}`)

    const labels = await obj.getLabels();

    expect(labels.length).toEqual(1);
  });

  it("should find comments", async () => {
    //guid2 was created at the start of the tests using insertTriple method, and then some literals added
    expect.assertions(1);
    const obj: RDFSResource = new RDFSResource(rs, `${testDefaultNamespace}${guid2}`)

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
    const obj: RDFSResource = new RDFSResource(rs, `${testDefaultNamespace}${guid2}`)

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
