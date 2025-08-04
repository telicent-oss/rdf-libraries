import {
  OntologyService,
  QueryResponse,
  TypedNodeQuerySolution,
} from "../src/index";

describe("testing functions within the ontology service", () => {
  const uri1: string = "http://telicent.io/fake_data#uri1";
  const MOCK_URL = "http://localhost:3030/";
  let os: OntologyService;
  const RESPONSE_getAllClasses_uri1 = {
    head: { vars: ["uri", "_type"] },
    results: {
      bindings: [
        {
          uri: { type: "uri", value: uri1 },
          _type: {
            type: "uri",
            value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#Class",
          },
        },
      ],
    },
  } as unknown as QueryResponse<TypedNodeQuerySolution>;
  beforeAll(async () => {
    // create a successful sparql result object - as expected to return
    // can check this by generating this data and sending queries to a database offline
    // but we know the good response for this query would look like this
    os = await OntologyService.createAsync(MOCK_URL);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });
  /*  it("new RDFSClass - should produce correct SPARQL update", async () => {
        const runUpdateMock = jest.spyOn(os, "runUpdate").mockImplementation(()=> Promise.resolve("OK"))
        const CORRECT_QUERY = "SELECT ?uri ?_type WHERE {BIND (rdfs:Class as ?_type . ?uri a ?_type ) . }"
        // run function
        const res = await os.getAllClasses(false)
        // check correct query is passed based on function call to runQuery
        expect(runUpdateMock).toHaveBeenCalledWith(CORRECT_QUERY)
    });*/
  it("getAllClasses - check correct query is created and sent to runQuery", async () => {
    // runQuery should be tested as part of the RDFService tests - return SUCCESSFULL_RESPONSE
    const runQueryMock = jest
      .spyOn(os, "runQuery")
      .mockImplementation(() => Promise.resolve(RESPONSE_getAllClasses_uri1));
    // this is the correct query - no filter and not including owl
    const CORRECT_QUERY =
      "SELECT ?uri (group_concat(DISTINCT ?type) as ?_type) WHERE {BIND (rdfs:Class as ?type . ?uri a ?type ) . } GROUP BY ?uri";
    // run function
    const res = await os.getAllClasses(false);
    // check correct query is passed based on function call to runQuery
    expect(runQueryMock).toHaveBeenCalledWith(CORRECT_QUERY);
    // results check - return is an array of length 1
    expect(res.length).toBe(1);
    // get keys of the object
    expect(Object.keys(res[0])).toMatchInlineSnapshot(`
      [
        "constructorPromises",
        "uri",
        "types",
        "statement",
        "service",
      ]
    `);
    // check value of the first
    expect(res[0].uri).toBe(uri1);
    // check value of the types
    expect(res[0].types[0]).toBe(
      "http://www.w3.org/1999/02/22-rdf-syntax-ns#Class"
    );
  });

  it("getAllClasses - check can handle error from runQuery", async () => {
    const os = new OntologyService(MOCK_URL);
    try {
      // runQuery should be tested as part of the RDFService tests - mock that an error occurs (maybe in jena)
      jest.spyOn(os, "runQuery").mockImplementation(() => {
        throw new Error("Does this handle?");
      });
      // run function
      await os.getAllClasses(false);
    } catch (error) {
      const err = error as Error;
      expect(err.message).toBe("Does this handle?");
    }
  });
});
