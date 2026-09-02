import { RdfService, RDFSResource } from "../index";

const MOCK_URL = "http://localhost:3030/";

const makeService = () => {
  const svc = new RdfService(MOCK_URL, "ds", undefined, undefined, true, {
    NO_WARNINGS: true,
  });
  // Prevent any fetch triggered by constructor promises or setter chains
  jest.spyOn(svc, "runUpdate").mockResolvedValue("ok");
  jest.spyOn(svc, "insertTriple").mockResolvedValue("ok");
  jest.spyOn(svc, "runQuery").mockResolvedValue({
    head: { vars: [] },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    results: { bindings: [] as any[] },
  } as never);
  return svc;
};

const makeLiteralsResponse = (predicate: string, values: string[]) => ({
  head: { vars: [] },
  results: {
    bindings: values.map((v) => ({
      literal: { type: "literal", value: v },
      predicate: { type: "uri", value: predicate },
    })),
  },
});

describe("RDFSResource constructor", () => {
  it("mints a URI when no uri/statement is provided and enqueues an instantiate call", () => {
    const svc = makeService();
    const mint = jest.spyOn(svc, "mintUri");
    const instantiate = jest.spyOn(svc, "instantiate").mockResolvedValue("ok");

    const r = new RDFSResource(svc);
    expect(mint).toHaveBeenCalled();
    expect(r.uri.length).toBeGreaterThan(0);
    expect(r.types).toContain("http://www.w3.org/2000/01/rdf-schema#Resource");
    expect(instantiate).toHaveBeenCalled();
    expect(svc.nodes[r.uri]).toBe(r);
  });

  it("returns the cached instance when the same uri is constructed twice for the same class", () => {
    const svc = makeService();
    jest.spyOn(svc, "instantiate").mockResolvedValue("ok");
    const a = new RDFSResource(svc, "http://example.test/x");
    const b = new RDFSResource(svc, "http://example.test/x");
    expect(b).toBe(a);
  });

  it("adds the new type to a cached instance's types when re-constructed with a new type", () => {
    const svc = makeService();
    jest.spyOn(svc, "instantiate").mockResolvedValue("ok");
    const a = new RDFSResource(svc, "http://example.test/x", "http://example.test/T1");
    new RDFSResource(svc, "http://example.test/x", "http://example.test/T2");
    expect(a.types).toContain("http://example.test/T1");
    expect(a.types).toContain("http://example.test/T2");
  });

  it("hydrates from a query statement, splitting multi-typed _type", () => {
    const svc = makeService();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const statement: any = {
      uri: { type: "uri", value: "http://example.test/y" },
      _type: { type: "uri", value: "http://example.test/A http://example.test/B" },
    };
    const r = new RDFSResource(svc, undefined, undefined, statement);
    expect(r.uri).toBe("http://example.test/y");
    expect(r.types).toEqual(["http://example.test/A", "http://example.test/B"]);
  });

  it("throws when neither uri nor statement is provided and type is falsy", () => {
    const svc = makeService();
    expect(
      () => new RDFSResource(svc, undefined, "" as never, undefined)
    ).toThrow(/requires a type/);
  });
});

describe("RDFSResource literal setters — validation branches", () => {
  const svc = makeService();
  const r = new RDFSResource(svc, "http://example.test/setters");
  const cases: Array<[string, (v?: string) => Promise<string>]> = [
    ["addLabel", (v) => r.addLabel(v as string)],
    ["addComment", (v) => r.addComment(v as string)],
    ["setTitle", (v) => r.setTitle(v as string)],
    ["set", (v) => r.set(v as string)],
    ["setDescription", (v) => r.setDescription(v as string)],
    ["setCreator", (v) => r.setCreator(v as string)],
    ["setRights", (v) => r.setRights(v as string)],
    ["setPublished", (v) => r.setPublished(v as string)],
    ["setModified", (v) => r.setModified(v as string)],
    ["setAccessRights", (v) => r.setAccessRights(v as string)],
    ["setPrefLabel", (v) => r.setPrefLabel(v as string)],
    ["setAltLabel", (v) => r.setAltLabel(v as string)],
  ];
  it.each(cases)("%s throws on empty string", async (_name, fn) => {
    await expect(fn("")).rejects.toThrow();
  });
});

describe("RDFSResource literal setters — happy paths delegate to addLiteral", () => {
  let svc: RdfService;
  let r: RDFSResource;
  beforeEach(() => {
    svc = makeService();
    r = new RDFSResource(svc, "http://example.test/happy");
    (svc.insertTriple as jest.Mock).mockClear();
  });

  const findInsert = (predicate: string, value: string) =>
    (svc.insertTriple as jest.Mock).mock.calls.find(
      (c) => c[1] === predicate && c[2] === value && c[3] === "LITERAL"
    );

  it("addLiteral throws for empty predicate", async () => {
    await expect(r.addLiteral("", "text")).rejects.toThrow(/empty predicate/);
  });
  it("addLiteral throws for empty text", async () => {
    await expect(r.addLiteral("http://x/p", "")).rejects.toThrow(/empty text/);
  });

  it("addLabel writes rdfs:label", async () => {
    await r.addLabel("hi");
    expect(findInsert(svc.rdfsLabel, "hi")).toBeDefined();
  });
  it("addComment writes rdfs:comment", async () => {
    await r.addComment("note");
    expect(findInsert(svc.rdfsComment, "note")).toBeDefined();
  });
  it("setTitle writes dcTitle", async () => {
    await r.setTitle("T");
    expect(findInsert(svc.dcTitle, "T")).toBeDefined();
  });
  it("setDescription writes dcDescription", async () => {
    await r.setDescription("D");
    expect(findInsert(svc.dcDescription, "D")).toBeDefined();
  });
  it("setCreator writes dcCreator", async () => {
    await r.setCreator("C");
    expect(findInsert(svc.dcCreator, "C")).toBeDefined();
  });
  it("setRights writes dcRights", async () => {
    await r.setRights("R");
    expect(findInsert(svc.dcRights, "R")).toBeDefined();
  });
  it("setPublished writes dcPublished", async () => {
    await r.setPublished("2026-01-01");
    expect(findInsert(svc.dcPublished, "2026-01-01")).toBeDefined();
  });
  it("setModified writes dcModified", async () => {
    await r.setModified("2026-01-02");
    expect(findInsert(svc.dcModified, "2026-01-02")).toBeDefined();
  });
  it("setAccessRights writes dcAccessRights", async () => {
    await r.setAccessRights("OFFICIAL");
    expect(findInsert(svc.dcAccessRights, "OFFICIAL")).toBeDefined();
  });
  it("setPrefLabel writes skos:prefLabel", async () => {
    await r.setPrefLabel("pref");
    expect(findInsert(`${svc.skos}prefLabel`, "pref")).toBeDefined();
  });
  it("setAltLabel writes skos:altLabel", async () => {
    await r.setAltLabel("alt");
    expect(findInsert(`${svc.skos}altLabel`, "alt")).toBeDefined();
  });
});

describe("RDFSResource getters", () => {
  let svc: RdfService;
  let r: RDFSResource;
  beforeEach(() => {
    svc = makeService();
    r = new RDFSResource(svc, "http://example.test/getters");
  });

  const stubLiterals = (predicate: string, values: string[]) => {
    (svc.runQuery as jest.Mock).mockResolvedValueOnce(
      makeLiteralsResponse(predicate, values)
    );
  };

  it("getLabels returns [] when nothing matches", async () => {
    (svc.runQuery as jest.Mock).mockResolvedValueOnce({
      head: { vars: [] },
      results: { bindings: [] },
    });
    await expect(r.getLabels()).resolves.toEqual([]);
  });

  it("getLabels returns the literal values indexed by rdfs:label", async () => {
    stubLiterals(svc.rdfsLabel, ["One", "Two"]);
    await expect(r.getLabels()).resolves.toEqual(["One", "Two"]);
  });

  it("getAltLabels returns matches", async () => {
    stubLiterals(`${svc.skos}altLabel`, ["a", "b"]);
    await expect(r.getAltLabels()).resolves.toEqual(["a", "b"]);
  });

  it("getPrefLabel warns when more than one prefLabel is present", async () => {
    const warnSpy = jest.spyOn(svc, "warn").mockImplementation(() => undefined);
    stubLiterals(`${svc.skos}prefLabel`, ["p1", "p2"]);
    await r.getPrefLabel();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("SKOS preferred label"));
  });

  it("getComments returns matches", async () => {
    stubLiterals(svc.rdfsComment, ["c"]);
    await expect(r.getComments()).resolves.toEqual(["c"]);
  });

  it("getDcTitle warns when more than one title is present", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    stubLiterals(svc.dcTitle, ["t1", "t2"]);
    await r.getDcTitle();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Dublin Core title"));
  });

  it("getDcTitle throws when isAssert is true and no titles are found", async () => {
    (svc.runQuery as jest.Mock).mockResolvedValueOnce({
      head: { vars: [] },
      results: { bindings: [] },
    });
    await expect(r.getDcTitle({ isAssert: true })).rejects.toThrow(/have title/);
  });

  it("getDcDescription returns matches", async () => {
    stubLiterals(svc.dcDescription, ["d"]);
    await expect(r.getDcDescription()).resolves.toEqual(["d"]);
  });

  it("getDcRights returns matches", async () => {
    stubLiterals(svc.dcRights, ["r"]);
    await expect(r.getDcRights()).resolves.toEqual(["r"]);
  });

  it("getDcCreator returns matches", async () => {
    stubLiterals(svc.dcCreator, ["c1"]);
    await expect(r.getDcCreator()).resolves.toEqual(["c1"]);
  });

  it("getDcPublished returns matches", async () => {
    stubLiterals(svc.dcPublished, ["2026-01-01"]);
    await expect(r.getDcPublished()).resolves.toEqual(["2026-01-01"]);
  });

  it("getDcCreated returns matches", async () => {
    stubLiterals(svc.dcCreated, ["2025-12-31"]);
    await expect(r.getDcCreated()).resolves.toEqual(["2025-12-31"]);
  });

  it("getDcModified returns matches (via getMaxLiterals)", async () => {
    stubLiterals(svc.dcModified, ["2026-02-02"]);
    await expect(r.getDcModified()).resolves.toEqual(["2026-02-02"]);
  });

  it("getDcIssued returns matches (via getMinLiterals)", async () => {
    stubLiterals(svc.dcIssued, ["2025-06-06"]);
    await expect(r.getDcIssued()).resolves.toEqual(["2025-06-06"]);
  });

  it("getDcAccessRights returns matches", async () => {
    stubLiterals(svc.dcAccessRights, ["OFFICIAL"]);
    await expect(r.getDcAccessRights()).resolves.toEqual(["OFFICIAL"]);
  });

  it("getDcDescription warns when more than one description is present", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    stubLiterals(svc.dcDescription, ["d1", "d2"]);
    await r.getDcDescription();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Dublin Core description"));
  });

  it("getDcCreator warns when more than one creator is present", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    stubLiterals(svc.dcCreator, ["c1", "c2"]);
    await r.getDcCreator();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Dublin Core creator"));
  });

  it("getDcPublished warns when more than one published date is present", async () => {
    const warnSpy = jest.spyOn(svc, "warn").mockImplementation(() => undefined);
    stubLiterals(svc.dcPublished, ["2026-01-01", "2026-01-02"]);
    await r.getDcPublished();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Dublin Core published"));
  });

  it("getDcCreated warns when more than one created is present", async () => {
    const warnSpy = jest.spyOn(svc, "warn").mockImplementation(() => undefined);
    stubLiterals(svc.dcCreated, ["a", "b"]);
    await r.getDcCreated();
    expect(warnSpy).toHaveBeenCalled();
  });

  it("getDcModified warns when more than one modified is present", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    stubLiterals(svc.dcModified, ["a", "b"]);
    await r.getDcModified();
    expect(warnSpy).toHaveBeenCalled();
  });

  it("getDcIssued warns when more than one issued is present", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    stubLiterals(svc.dcIssued, ["a", "b"]);
    await r.getDcIssued();
    expect(warnSpy).toHaveBeenCalled();
  });

  it("getDcAccessRights warns when more than one is present", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    stubLiterals(svc.dcAccessRights, ["a", "b"]);
    await r.getDcAccessRights();
    expect(warnSpy).toHaveBeenCalled();
  });

  it("getLiteralsList throws when key is not set", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await expect(r.getLiteralsList({ key: "" as any })).rejects.toThrow(/key to be set/);
  });

  it("getLiteralsList returns the values array and invokes validate", async () => {
    stubLiterals("http://example.test/p", ["a", "b"]);
    const validate = jest.fn();
    const out = await r.getLiteralsList({ key: "http://example.test/p", validate });
    expect(out).toEqual(["a", "b"]);
    expect(validate).toHaveBeenCalledWith(["a", "b"]);
  });
});

describe("RDFSResource countRelated", () => {
  let svc: RdfService;
  let r: RDFSResource;
  beforeEach(() => {
    svc = makeService();
    r = new RDFSResource(svc, "http://example.test/count");
  });

  it("returns 0 when no bindings are returned", async () => {
    (svc.runQuery as jest.Mock).mockResolvedValueOnce({
      head: { vars: [] },
      results: { bindings: [] },
    });
    await expect(r.countRelated("<http://x/p>")).resolves.toBe(0);
  });

  it("returns 0 when the count field is missing from the binding", async () => {
    (svc.runQuery as jest.Mock).mockResolvedValueOnce({
      head: { vars: [] },
      results: { bindings: [{}] },
    });
    await expect(r.countRelated("<http://x/p>")).resolves.toBe(0);
  });

  it("returns the numeric count when present", async () => {
    (svc.runQuery as jest.Mock).mockResolvedValueOnce({
      head: { vars: [] },
      results: {
        bindings: [{ count: { type: "literal", value: "7" } }],
      },
    });
    await expect(r.countRelated("<http://x/p>")).resolves.toBe(7);
  });

  it("throws when more than one binding is returned", async () => {
    (svc.runQuery as jest.Mock).mockResolvedValueOnce({
      head: { vars: [] },
      results: { bindings: [{}, {}] },
    });
    await expect(r.countRelated("<http://x/p>")).rejects.toThrow(/more than one binding/);
  });
});

describe("RDFSResource getRelated / getRelating", () => {
  let svc: RdfService;
  let r: RDFSResource;
  beforeEach(() => {
    svc = makeService();
    r = new RDFSResource(svc, "http://example.test/r");
  });

  it("getRelated groups query rows by predicate", async () => {
    (svc.runQuery as jest.Mock).mockResolvedValueOnce({
      head: { vars: [] },
      results: {
        bindings: [
          {
            uri: { type: "uri", value: "http://example.test/o1" },
            _type: { type: "uri", value: svc.rdfsResource },
            predicate: { type: "uri", value: "http://example.test/p1" },
          },
          {
            uri: { type: "uri", value: "http://example.test/o2" },
            _type: { type: "uri", value: svc.rdfsResource },
            predicate: { type: "uri", value: "http://example.test/p1" },
          },
        ],
      },
    });
    const out = await r.getRelated();
    expect(Object.keys(out)).toEqual(["http://example.test/p1"]);
    expect(out["http://example.test/p1"]).toHaveLength(2);
  });

  it("getRelating groups query rows by predicate", async () => {
    (svc.runQuery as jest.Mock).mockResolvedValueOnce({
      head: { vars: [] },
      results: {
        bindings: [
          {
            uri: { type: "uri", value: "http://example.test/s1" },
            _type: { type: "uri", value: svc.rdfsResource },
            predicate: { type: "uri", value: "http://example.test/p1" },
          },
        ],
      },
    });
    const out = await r.getRelating("http://example.test/p1");
    expect(out["http://example.test/p1"]).toHaveLength(1);
  });

  it("getRelated returns {} when runQuery gives back malformed results", async () => {
    (svc.runQuery as jest.Mock).mockResolvedValueOnce({});
    await expect(r.getRelated()).resolves.toEqual({});
  });

  it("getRelating returns {} when runQuery gives back malformed results", async () => {
    (svc.runQuery as jest.Mock).mockResolvedValueOnce({});
    await expect(r.getRelating("http://example.test/p")).resolves.toEqual({});
  });
});
