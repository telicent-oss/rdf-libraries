import { RdfService, RDFSResource, noColonInPrefixException } from "../index";

const MOCK_URL = "http://localhost:3030/";

const makeService = (writeEnabled = true) => {
  const svc = new RdfService(MOCK_URL, "ds", undefined, undefined, writeEnabled, {
    NO_WARNINGS: true,
  });
  return svc;
};

describe("RdfService prefix handling", () => {
  let svc: RdfService;
  beforeEach(() => {
    svc = makeService();
  });

  it("addPrefix throws when the prefix does not end with a colon", () => {
    expect(() => svc.addPrefix("bad", "http://x/")).toBe;
    expect(() => svc.addPrefix("bad", "http://x/")).toThrow(noColonInPrefixException);
  });

  it("addPrefix registers a new prefix so getPrefix returns it by exact URI match", () => {
    svc.addPrefix("ex:", "http://example.test/ns#");
    expect(svc.getPrefix("http://example.test/ns#")).toBe("ex:");
  });

  it("getPrefix returns the input when the URI is not registered", () => {
    expect(svc.getPrefix("http://not-registered/")).toBe("http://not-registered/");
  });

  it("shorten replaces the matching prefix", () => {
    expect(svc.shorten("http://www.w3.org/2000/01/rdf-schema#Class")).toBe("rdfs:Class");
  });

  it("shorten returns the URI as-is when no prefix matches", () => {
    expect(svc.shorten("http://unknown.test/thing")).toBe("http://unknown.test/thing");
  });

  it("defaultNamespace setter/getter proxies through the ':' prefix", () => {
    svc.defaultNamespace = "http://new.test/ns/";
    expect(svc.defaultNamespace).toBe("http://new.test/ns/");
  });

  it("getSparqlPrefix returns a PREFIX statement for a known prefix", () => {
    expect(svc.getSparqlPrefix("rdfs:")).toBe(
      "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> "
    );
  });

  it("getSparqlPrefix throws for an unknown prefix", () => {
    expect(() => svc.getSparqlPrefix("nope:")).toThrow();
  });

  it("sparqlPrefixes concatenates every registered prefix", () => {
    const all = svc.sparqlPrefixes;
    expect(all).toContain("PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>");
    expect(all).toContain("PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>");
  });
});

describe("RdfService lifecycle helpers", () => {
  let svc: RdfService;
  beforeEach(() => {
    svc = makeService();
  });

  it("mintUri produces a URI under the default namespace", () => {
    const uri = svc.mintUri();
    expect(uri.startsWith(svc.defaultNamespace)).toBe(true);
  });

  it("mintUri accepts an explicit namespace", () => {
    const uri = svc.mintUri("http://ns.test/");
    expect(uri.startsWith("http://ns.test/")).toBe(true);
  });

  it("inCache returns false for a missing URI, true after registration", () => {
    expect(svc.inCache("http://x")).toBe(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (svc.nodes as any)["http://x"] = {} as never;
    expect(svc.inCache("http://x")).toBe(true);
  });

  it("warn logs to console only when showWarnings is true", () => {
    const spy = jest.spyOn(console, "warn").mockImplementation(() => undefined);

    svc.showWarnings = false;
    svc.warn("hidden");
    expect(spy).not.toHaveBeenCalled();

    svc.setWarnings = true;
    svc.warn("shown");
    expect(spy).toHaveBeenCalledWith("shown");
  });

  it("lookupClass returns the registered class or the default", () => {
    class Custom extends RDFSResource {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (svc.classLookup as any)["http://custom"] = Custom as unknown as never;
    expect(svc.lookupClass("http://custom", RDFSResource)).toBe(
      Custom as unknown as typeof RDFSResource
    );
    expect(svc.lookupClass("http://not-registered", RDFSResource)).toBe(RDFSResource);
  });

  it("getAllElements warns about deprecation", () => {
    const spy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    svc.getAllElements();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("deprecated"));
  });

  it("makeTypedStatement returns a canonical TypedNodeQuerySolution", () => {
    const s = svc.makeTypedStatement("http://x", "http://T");
    expect(s.uri.value).toBe("http://x");
    expect(s._type?.value).toBe("http://T");
  });

  it("compareScores sorts higher scores first", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = [
      { item: {} as never, score: 1 },
      { item: {} as never, score: 5 },
      { item: {} as never, score: 3 },
    ];
    const sorted = [...items].sort(svc.compareScores);
    expect(sorted.map((r) => r.score)).toEqual([5, 3, 1]);
  });

  it("compareScores returns 0 when either score is missing", () => {
    expect(
      svc.compareScores({ item: {} as never }, { item: {} as never, score: 5 })
    ).toBe(0);
  });
});

describe("RdfService write operations", () => {
  it("runUpdate short-circuits with a warning when writeEnabled=false", async () => {
    const svc = makeService(false);
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    const out = await svc.runUpdate(["INSERT DATA { <a> <b> <c> }"]);
    expect(out).toContain("read only");
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("read only"));
  });

  it("insertTriple builds a URI-object INSERT DATA update", async () => {
    const svc = makeService(true);
    const runUpdate = jest.spyOn(svc, "runUpdate").mockResolvedValue("ok");

    await svc.insertTriple("http://s", "http://p", "http://o");
    const updates = runUpdate.mock.calls[0][0];
    expect(updates[updates.length - 1]).toBe("INSERT DATA {<http://s> <http://p> <http://o> . }");
  });

  it("insertTriple builds a LITERAL-object INSERT DATA update with xsd datatype", async () => {
    const svc = makeService(true);
    const runUpdate = jest.spyOn(svc, "runUpdate").mockResolvedValue("ok");

    await svc.insertTriple(
      "http://s",
      "http://p",
      "hello",
      "LITERAL",
      undefined,
      "xsd:string"
    );
    const updates = runUpdate.mock.calls[0][0];
    expect(updates[updates.length - 1]).toBe(
      'INSERT DATA {<http://s> <http://p> "hello"^^xsd:string . }'
    );
  });

  it("insertTriple prepends a DELETE WHERE when deleteAllPrevious=true", async () => {
    const svc = makeService(true);
    const runUpdate = jest.spyOn(svc, "runUpdate").mockResolvedValue("ok");

    await svc.insertTriple(
      "http://s",
      "http://p",
      "hello",
      "LITERAL",
      undefined,
      undefined,
      true
    );
    const updates = runUpdate.mock.calls[0][0];
    expect(updates[0]).toBe("DELETE WHERE {<http://s> <http://p> ?o}");
  });

  it("insertTriple rejects unknown objectType via #checkObject", async () => {
    const svc = makeService(true);
    jest.spyOn(svc, "runUpdate").mockResolvedValue("ok");
    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      svc.insertTriple("s", "p", "o", "BOGUS" as any)
    ).rejects.toThrow(/unknown objectType/);
  });

  it("deleteTriple issues a DELETE DATA update", async () => {
    const svc = makeService(true);
    const runUpdate = jest.spyOn(svc, "runUpdate").mockResolvedValue("ok");

    await svc.deleteTriple("http://s", "http://p", "http://o", "URI");
    const updates = runUpdate.mock.calls[0][0];
    expect(updates[0]).toBe("DELETE DATA {<http://s> <http://p> <http://o> . }");
  });

  it("deleteNode issues an inbound-reference DELETE by default", async () => {
    const svc = makeService(true);
    const runUpdate = jest.spyOn(svc, "runUpdate").mockResolvedValue("ok");

    await svc.deleteNode("http://x");
    const updates = runUpdate.mock.calls[0][0];
    expect(updates[0]).toBe("DELETE WHERE {?s ?p <http://x>}");
  });

  it("deleteNode with ignoreInboundReferences=true only deletes outgoing triples", async () => {
    const svc = makeService(true);
    const runUpdate = jest.spyOn(svc, "runUpdate").mockResolvedValue("ok");

    await svc.deleteNode("http://x", true);
    const updates = runUpdate.mock.calls[0][0];
    expect(updates[0]).toBe("DELETE WHERE {<http://x> ?p ?o . }");
  });

  it("deleteNode throws on empty uri", async () => {
    const svc = makeService(true);
    await expect(svc.deleteNode("")).rejects.toThrow();
  });

  it("deleteRelationships issues a triple-pattern DELETE and rejects empty inputs", async () => {
    const svc = makeService(true);
    const runUpdate = jest.spyOn(svc, "runUpdate").mockResolvedValue("ok");

    await svc.deleteRelationships("http://s", "http://p");
    const updates = runUpdate.mock.calls[0][0];
    expect(updates[0]).toBe("DELETE WHERE {<http://s> <http://p> ?o . }");

    await expect(svc.deleteRelationships("", "http://p")).rejects.toThrow();
    await expect(svc.deleteRelationships("http://s", "")).rejects.toThrow();
  });

  it("instantiate rejects an empty clsURI, otherwise inserts a rdf:type triple", async () => {
    const svc = makeService(true);
    const insert = jest.spyOn(svc, "insertTriple").mockResolvedValue("ok");

    await expect(svc.instantiate("")).rejects.toThrow();

    const uri = await svc.instantiate("http://Cls", "http://x");
    expect(uri).toBe("http://x");
    expect(insert).toHaveBeenCalledWith(
      "http://x",
      svc.rdfType,
      "http://Cls",
      undefined,
      undefined
    );
  });

  it("instantiate mints a URI when none is provided", async () => {
    const svc = makeService(true);
    jest.spyOn(svc, "insertTriple").mockResolvedValue("ok");
    const mint = jest.spyOn(svc, "mintUri");

    const uri = await svc.instantiate("http://Cls");
    expect(mint).toHaveBeenCalled();
    expect(uri.startsWith(svc.defaultNamespace)).toBe(true);
  });
});

describe("RdfService.checkTripleStore", () => {
  it("returns true when the ASK query response has a boolean field", async () => {
    const svc = makeService();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jest.spyOn(svc, "runQuery").mockResolvedValue({ boolean: true } as any);
    await expect(svc.checkTripleStore()).resolves.toBe(true);
  });

  it("returns false when the ASK query response has no boolean field", async () => {
    const svc = makeService();
    jest.spyOn(svc, "runQuery").mockResolvedValue({
      head: { vars: [] },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      results: { bindings: [] as any[] },
    } as never);
    await expect(svc.checkTripleStore()).resolves.toBe(false);
  });
});

describe("RdfService.find / rankedWrap", () => {
  let svc: RdfService;
  beforeEach(() => {
    svc = makeService();
  });

  it("find builds a type-filtered SPARQL and wraps via rankedWrap", async () => {
    const runQuery = jest.spyOn(svc, "runQuery").mockResolvedValue({
      head: { vars: ["uri", "_type", "concatLit"] },
      results: {
        bindings: [
          {
            uri: { type: "uri", value: "http://example.test/A" },
            _type: { type: "uri", value: svc.rdfsResource },
            concatLit: { type: "literal", value: "foo bar foo" },
          },
        ],
      },
    } as never);

    const out = await svc.find("foo", [svc.rdfsResource]);
    const query = runQuery.mock.calls[0][0] as string;
    expect(query).toContain(svc.rdfsResource);
    expect(out).toHaveLength(1);
    expect(out[0].score).toBe(2); // "foo" appears twice
  });

  it("rankedWrap returns [] when matchingText is empty", async () => {
    const out = await svc.rankedWrap(
      { head: { vars: [] }, results: { bindings: [] } } as never,
      ""
    );
    expect(out).toEqual([]);
  });

  it("rankedWrap sorts higher scores first", async () => {
    const response = {
      head: { vars: ["uri", "_type", "concatLit"] },
      results: {
        bindings: [
          {
            uri: { type: "uri", value: "http://example.test/A" },
            _type: { type: "uri", value: svc.rdfsResource },
            concatLit: { type: "literal", value: "foo" },
          },
          {
            uri: { type: "uri", value: "http://example.test/B" },
            _type: { type: "uri", value: svc.rdfsResource },
            concatLit: { type: "literal", value: "foo foo foo" },
          },
        ],
      },
    };
    const out = await svc.rankedWrap(response as never, "foo");
    expect(out.map((r) => r.score)).toEqual([3, 1]);
  });
});
