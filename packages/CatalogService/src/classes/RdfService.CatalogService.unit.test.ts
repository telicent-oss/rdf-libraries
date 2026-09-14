import { QueryResponse } from "@telicent-oss/rdfservice";
import {
  CatalogService,
  DCATCatalog,
  DCATDataService,
  DCATDataset,
  DCATResource,
} from "../index";

const MOCK_URL = "http://localhost:3030/";
const NO_WARNINGS = { config: { NO_WARNINGS: true } };

const b = (value: string, type = "uri") => ({ type, value });

const makeBindings = <T,>(bindings: T[]) =>
  ({
    head: { vars: ["uri", "_type"] },
    results: { bindings },
  } as unknown as QueryResponse<T>);

const baseDcatBinding = (uri: string, type: string) => ({
  uri: b(uri),
  _type: b(type),
  identifier: b("id-1"),
  title: b("title-1"),
});

describe("CatalogService constructor", () => {
  let cs: CatalogService;
  beforeEach(() => {
    cs = new CatalogService({ writeEnabled: false, ...NO_WARNINGS });
  });

  it("populates dcat/vcard/tcat namespace fields", () => {
    expect(cs.dcat).toBe("http://www.w3.org/ns/dcat#");
    expect(cs.vcard).toBe("http://www.w3.org/2006/vcard/ns#");
    expect(cs.dcatResource).toBe("http://www.w3.org/ns/dcat#Resource");
    expect(cs.dcatCatalog).toBe("http://www.w3.org/ns/dcat#Catalog");
    expect(cs.dcatDataset).toBe("http://www.w3.org/ns/dcat#Dataset");
    expect(cs.dcat_dataset).toBe("http://www.w3.org/ns/dcat#dataset");
    expect(cs.dcatDataService).toBe("http://www.w3.org/ns/dcat#DataService");
    expect(cs.dcat_service).toBe("http://www.w3.org/ns/dcat#service");
    expect(cs.dcat_catalog).toBe("http://www.w3.org/ns/dcat#catalog");
    expect(cs.tcat).toBe("http://telicent.io/catalog#");
    expect(cs.tcatDataset).toBe("http://telicent.io/catalog/dataset#");
    expect(cs.tcatDistribution).toBe("http://telicent.io/catalog/Distribution#");
  });

  it("registers DCAT classes in classLookup", () => {
    expect(cs.classLookup[cs.dcatResource]).toBe(DCATResource);
    expect(cs.classLookup[cs.dcatDataset]).toBe(DCATDataset);
    expect(cs.classLookup[cs.dcatDataService]).toBe(DCATDataService);
    expect(cs.classLookup[cs.dcatCatalog]).toBe(DCATCatalog);
  });

  it("registers dcat/vcard/tcat prefixes in prefixDict", () => {
    // shorten() picks the first prefix whose value is a substring; ":" (defaultNamespace)
    // shadows the tcat-dataset/tcat-distribution URIs, so assert against the raw dict.
    expect(cs.shorten("http://www.w3.org/ns/dcat#Dataset")).toBe("dcat:Dataset");
    expect(cs.shorten("http://www.w3.org/2006/vcard/ns#Kind")).toBe("vcard:Kind");
    expect(cs.shorten("http://telicent.io/catalog#foo")).toBe("tcat:foo");
    expect(cs.getPrefix("http://telicent.io/catalog/dataset#")).toBe("tcat-dataset:");
    expect(cs.getPrefix("http://telicent.io/catalog/Distribution#")).toBe(
      "tcat-distribution:"
    );
  });

  it("uses DEFAULT_CONSTRUCTOR_ARGS when only writeEnabled is passed", () => {
    // default triplestoreUri, dataset, defaultNamespace apply
    expect(cs.triplestoreUri).toBe("http://localhost:3030/");
    expect(cs.dataset).toBe("catalog");
    expect(cs.defaultNamespace).toBe("http://telicent.io/catalog/");
  });

  it("respects overridden constructor options", () => {
    const custom = new CatalogService({
      writeEnabled: true,
      triplestoreUri: "http://example.test:9999/",
      dataset: "cat-x",
      defaultNamespace: "http://example.test/ns#",
      defaultSecurityLabel: "OFFICIAL",
      ...NO_WARNINGS,
    });
    expect(custom.triplestoreUri).toBe("http://example.test:9999/");
    expect(custom.dataset).toBe("cat-x");
    expect(custom.defaultNamespace).toBe("http://example.test/ns#");
    expect(custom.defaultSecurityLabel).toBe("OFFICIAL");
  });
});

describe("CatalogService.getAllDCATResources", () => {
  let cs: CatalogService;
  beforeEach(() => {
    cs = new CatalogService({ writeEnabled: false, ...NO_WARNINGS });
  });

  it("returns [] when no bindings are found", async () => {
    jest.spyOn(cs, "runQuery").mockResolvedValue(makeBindings([]) as never);
    await expect(cs.getAllDCATResources()).resolves.toEqual([]);
  });

  it("wraps rows in the class from classLookup for each _type", async () => {
    jest.spyOn(cs, "runQuery").mockResolvedValue(
      makeBindings([
        baseDcatBinding("http://example.test/D1", cs.dcatDataset),
        baseDcatBinding("http://example.test/S1", cs.dcatDataService),
        baseDcatBinding("http://example.test/C1", cs.dcatCatalog),
      ]) as never
    );

    const out = await cs.getAllDCATResources();
    expect(out).toHaveLength(3);
    expect(out[0]).toBeInstanceOf(DCATDataset);
    expect(out[1]).toBeInstanceOf(DCATDataService);
    expect(out[2]).toBeInstanceOf(DCATCatalog);
    // All descend from DCATResource
    out.forEach((r) => expect(r).toBeInstanceOf(DCATResource));
  });

  it("falls back to DCATResource when _type is not in classLookup", async () => {
    jest.spyOn(cs, "runQuery").mockResolvedValue(
      makeBindings([
        baseDcatBinding("http://example.test/X1", "http://example.test/UnknownType"),
      ]) as never
    );

    const out = await cs.getAllDCATResources();
    expect(out).toHaveLength(1);
    expect(out[0]).toBeInstanceOf(DCATResource);
  });
});

describe("CatalogService.getDCATResource", () => {
  it("issues a lookup query and returns a single wrapped resource", async () => {
    const cs = new CatalogService({ writeEnabled: false, ...NO_WARNINGS });
    jest.spyOn(cs, "runQuery").mockResolvedValue(
      makeBindings([
        baseDcatBinding("http://example.test/D1", cs.dcatDataset),
      ]) as never
    );

    const out = await cs.getDCATResource({ resourceUri: "http://example.test/D1" });
    expect(out).toHaveLength(1);
    expect(out[0]).toBeInstanceOf(DCATDataset);
  });
});

describe("CatalogService thin wrappers", () => {
  let cs: CatalogService;
  beforeEach(() => {
    cs = new CatalogService({ writeEnabled: false, ...NO_WARNINGS });
  });

  it("getAllDatasets delegates to getAllDCATResources with dcat:Dataset", async () => {
    const spy = jest.spyOn(cs, "getAllDCATResources").mockResolvedValue([]);
    await cs.getAllDatasets();
    expect(spy).toHaveBeenCalledWith("dcat:Dataset");
  });

  it("getDataServices delegates to getAllDCATResources with dcat:DataService", async () => {
    const spy = jest.spyOn(cs, "getAllDCATResources").mockResolvedValue([]);
    await cs.getDataServices();
    expect(spy).toHaveBeenCalledWith("dcat:DataService");
  });

  it("getAllCatalogs delegates to getAllDCATResources with dcat:Catalog", async () => {
    const spy = jest.spyOn(cs, "getAllDCATResources").mockResolvedValue([]);
    await cs.getAllCatalogs();
    expect(spy).toHaveBeenCalledWith("dcat:Catalog");
  });
});

describe("CatalogService.findWithOwner", () => {
  it("delegates to runQuery and wraps results via rankedWrap", async () => {
    const cs = new CatalogService({ writeEnabled: false, ...NO_WARNINGS });
    const runQuery = jest
      .spyOn(cs, "runQuery")
      .mockResolvedValue(makeBindings([]) as never);
    const rankedWrap = jest.spyOn(cs, "rankedWrap").mockResolvedValue([]);

    const owner = new DCATCatalog(cs, "http://example.test/OwnerCat", "Owner Cat");
    await cs.findWithOwner("query text", undefined, owner);

    expect(runQuery).toHaveBeenCalledTimes(1);
    expect(rankedWrap).toHaveBeenCalledWith(expect.anything(), "query text");
  });
});

describe("CatalogService.findWithParams", () => {
  let cs: CatalogService;
  beforeEach(() => {
    cs = new CatalogService({ writeEnabled: false, ...NO_WARNINGS });
  });

  it("delegates to rankedWrapForDCAT with the search text", async () => {
    jest.spyOn(cs, "runQuery").mockResolvedValue(makeBindings([]) as never);
    const rankedSpy = jest
      .spyOn(cs, "rankedWrapForDCAT")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockResolvedValue([] as any);

    await cs.findWithParams({ searchText: "hello" });
    expect(rankedSpy).toHaveBeenCalledWith(expect.anything(), "hello");
  });

  it("propagates errors thrown by runQuery", async () => {
    jest.spyOn(cs, "runQuery").mockRejectedValue(new Error("boom"));
    await expect(cs.findWithParams({ searchText: "x" })).rejects.toThrow("boom");
  });

  it("passes empty string to rankedWrapForDCAT when searchText is omitted", async () => {
    jest.spyOn(cs, "runQuery").mockResolvedValue(makeBindings([]) as never);
    const rankedSpy = jest
      .spyOn(cs, "rankedWrapForDCAT")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockResolvedValue([] as any);

    await cs.findWithParams({});
    expect(rankedSpy).toHaveBeenCalledWith(expect.anything(), "");
  });
});

describe("CatalogService.rankedWrapForDCAT", () => {
  let cs: CatalogService;
  beforeEach(() => {
    cs = new CatalogService({ writeEnabled: false, ...NO_WARNINGS });
  });

  it("returns [] when the query returns no bindings", async () => {
    const response = makeBindings([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const out = await cs.rankedWrapForDCAT(response as any, "");
    expect(out).toEqual([]);
  });

  it("iterates every binding and wraps each in a RankWrapper", async () => {
    const response = makeBindings([
      baseDcatBinding("http://example.test/X1", "http://example.test/UnknownType"),
      baseDcatBinding("http://example.test/X2", "http://example.test/UnknownType"),
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const out = await cs.rankedWrapForDCAT(response as any, "");
    expect(out).toHaveLength(2);
    out.forEach((r) => {
      expect(r).toHaveProperty("item");
      expect(r).toHaveProperty("score", 0);
    });
  });

  it("scores each row by count of searchText matches in concatLit", async () => {
    const response = makeBindings([
      {
        ...baseDcatBinding("http://example.test/X1", "http://example.test/UnknownType"),
        concatLit: b("foo bar foo baz foo", "literal"),
      },
      {
        ...baseDcatBinding("http://example.test/X2", "http://example.test/UnknownType"),
        concatLit: b("nothing here", "literal"),
      },
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const out = await cs.rankedWrapForDCAT(response as any, "foo");
    expect(out).toHaveLength(2);
    // Sorted ascending by score: X2 (0) before X1 (3)
    const scores = out.map((r) => r.score).sort((a, b) => (a ?? 0) - (b ?? 0));
    expect(scores).toEqual([0, 3]);
  });
});
