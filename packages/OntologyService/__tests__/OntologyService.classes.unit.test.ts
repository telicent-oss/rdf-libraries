/* eslint-disable @typescript-eslint/no-explicit-any */
import type { QueryResponse, ResourceDescription } from "@telicent-oss/rdfservice";
import { Diagram, OntologyService, OWLClass, RDFProperty, RDFSClass, Style } from "../src/index";

const MOCK_URL = "http://localhost:3030/";

const makeBindings = <T,>(bindings: T[]) =>
  ({
    head: { vars: [] },
    results: { bindings },
  } as unknown as QueryResponse<T>);

const uri = (value: string) => ({ type: "uri", value });

const emptyDescription = (): ResourceDescription => ({
  literals: {},
  inLinks: {},
  outLinks: {},
  furtherInLinks: [],
});

describe("RDFProperty", () => {
  let os: OntologyService;
  beforeEach(() => {
    os = new OntologyService(MOCK_URL);
  });

  describe("describe", () => {
    it("bins literals into comments, labels, and style", async () => {
      const prop = new RDFProperty(os, "http://example.test/prop");
      const desc = emptyDescription();
      desc.literals[os.rdfsComment] = ["c1", "c2"];
      desc.literals[os.rdfsLabel] = ["Label"];
      desc.literals[os.telicentStyle] = [encodeURIComponent(JSON.stringify(new Style("#abc")))];
      desc.literals["http://example.test/custom"] = ["x"];

      jest.spyOn(prop as any, "describeNode").mockResolvedValue(desc);

      const out = await prop.describe();
      expect(out.comments).toEqual(["c1", "c2"]);
      expect(out.labels).toEqual(["Label"]);
      expect(out.style?.bgColour).toBe("#abc");
      expect(out.literals["http://example.test/custom"]).toEqual(["x"]);
    });

    it("routes outLinks through processObjectLink for known predicates", async () => {
      const prop = new RDFProperty(os, "http://example.test/prop");
      const desc = emptyDescription();
      desc.outLinks[os.rdfsSubPropertyOf] = { "http://example.test/super": ["type"] };
      desc.outLinks[os.rdfsRange] = { "http://example.test/rangeCls": ["type"] };
      desc.outLinks[os.rdfsDomain] = { "http://example.test/domainCls": ["type"] };
      desc.outLinks["http://example.test/other"] = { "http://example.test/x": ["type"] };

      jest.spyOn(prop as any, "describeNode").mockResolvedValue(desc);
      const processSpy = jest.spyOn(os, "processObjectLink").mockResolvedValue([]);

      const out = await prop.describe();

      // 4 outLinks + 0 inLinks = 4 calls
      expect(processSpy).toHaveBeenCalledTimes(4);
      // A predicate that isn't in the known set falls through to out.outLinks
      expect(out.outLinks["http://example.test/other"]).toEqual([]);
    });

    it("routes inLinks: subPropertyOf → subProperties, represents → diagramElements, else → inLinks", async () => {
      const prop = new RDFProperty(os, "http://example.test/prop");
      const desc = emptyDescription();
      desc.inLinks[os.rdfsSubPropertyOf] = { "http://example.test/sub": ["type"] };
      desc.inLinks[os.telRepresents] = { "http://example.test/diagram": ["type"] };
      desc.inLinks["http://example.test/other"] = { "http://example.test/x": ["type"] };

      jest.spyOn(prop as any, "describeNode").mockResolvedValue(desc);
      const processSpy = jest.spyOn(os, "processObjectLink").mockResolvedValue([]);

      const out = await prop.describe();

      expect(processSpy).toHaveBeenCalledTimes(3);
      expect(out.inLinks["http://example.test/other"]).toEqual([]);
    });
  });

  describe("setDomain / setRange", () => {
    it("deletes existing rdfs:domain then inserts the new triple", async () => {
      const prop = new RDFProperty(os, "http://example.test/prop");
      const del = jest.spyOn(os, "deleteRelationships").mockResolvedValue("ok");
      const ins = jest.spyOn(os, "insertTriple").mockResolvedValue("ok");
      const domain = new RDFSClass(os, "http://example.test/Cls");

      await prop.setDomain(domain);

      expect(del).toHaveBeenCalledWith("http://example.test/prop", os.rdfsDomain);
      expect(ins).toHaveBeenCalledWith(
        "http://example.test/prop",
        os.rdfsDomain,
        "http://example.test/Cls"
      );
    });

    it("skips the delete when deletePrevious=false", async () => {
      const prop = new RDFProperty(os, "http://example.test/prop");
      const del = jest.spyOn(os, "deleteRelationships").mockResolvedValue("ok");
      jest.spyOn(os, "insertTriple").mockResolvedValue("ok");

      await prop.setDomain(new RDFSClass(os, "http://example.test/Cls"), false);
      expect(del).not.toHaveBeenCalled();
    });

    it("setRange accepts an RDFSClass", async () => {
      const prop = new RDFProperty(os, "http://example.test/prop");
      jest.spyOn(os, "deleteRelationships").mockResolvedValue("ok");
      const ins = jest.spyOn(os, "insertTriple").mockResolvedValue("ok");

      const range = new RDFSClass(os, "http://example.test/Range");
      await prop.setRange(range);

      expect(ins).toHaveBeenCalledWith(
        "http://example.test/prop",
        os.rdfsRange,
        "http://example.test/Range"
      );
    });

    it("setRange accepts an xsd data type and expands the prefix", async () => {
      const prop = new RDFProperty(os, "http://example.test/prop");
      jest.spyOn(os, "deleteRelationships").mockResolvedValue("ok");
      const ins = jest.spyOn(os, "insertTriple").mockResolvedValue("ok");

      await prop.setRange("xsd:string");
      expect(ins).toHaveBeenCalledWith(
        "http://example.test/prop",
        os.rdfsRange,
        `${os.xsd}string`
      );
    });
  });

  describe("addSubProperty / addSuperProperty", () => {
    it("addSubProperty accepts a URI string and returns a new RDFProperty", async () => {
      const prop = new RDFProperty(os, "http://example.test/prop");
      const ins = jest.spyOn(os, "insertTriple").mockResolvedValue("ok");

      const sub = await prop.addSubProperty("http://example.test/sub");

      expect(ins).toHaveBeenCalledWith(
        "http://example.test/sub",
        os.rdfsSubPropertyOf,
        "http://example.test/prop"
      );
      expect(sub).toBeInstanceOf(RDFProperty);
      expect(sub.uri).toBe("http://example.test/sub");
    });

    it("addSubProperty accepts an RDFProperty and returns it", async () => {
      const prop = new RDFProperty(os, "http://example.test/prop");
      const other = new RDFProperty(os, "http://example.test/sub");
      const ins = jest.spyOn(os, "insertTriple").mockResolvedValue("ok");

      const result = await prop.addSubProperty(other);
      expect(result).toBe(other);
      expect(ins).toHaveBeenCalledWith(
        "http://example.test/sub",
        os.rdfsSubPropertyOf,
        "http://example.test/prop"
      );
    });

    it("addSuperProperty accepts a URI string and returns a new RDFProperty", async () => {
      const prop = new RDFProperty(os, "http://example.test/prop");
      const ins = jest.spyOn(os, "insertTriple").mockResolvedValue("ok");

      const sup = await prop.addSuperProperty("http://example.test/sup");
      expect(ins).toHaveBeenCalledWith(
        "http://example.test/prop",
        os.rdfsSubPropertyOf,
        "http://example.test/sup"
      );
      expect(sup).toBeInstanceOf(RDFProperty);
    });

    it("addSuperProperty accepts an RDFProperty and returns it", async () => {
      const prop = new RDFProperty(os, "http://example.test/prop");
      const other = new RDFProperty(os, "http://example.test/sup");
      const ins = jest.spyOn(os, "insertTriple").mockResolvedValue("ok");

      const result = await prop.addSuperProperty(other);
      expect(result).toBe(other);
      expect(ins).toHaveBeenCalledWith(
        "http://example.test/prop",
        os.rdfsSubPropertyOf,
        "http://example.test/sup"
      );
    });
  });

  describe("getSubProperties", () => {
    it("returns [] when the query yields no rows", async () => {
      const prop = new RDFProperty(os, "http://example.test/prop");
      jest.spyOn(os, "runQuery").mockResolvedValue(makeBindings([]) as never);
      await expect(prop.getSubProperties()).resolves.toEqual([]);
    });

    it("uses a non-recursive path by default", async () => {
      const prop = new RDFProperty(os, "http://example.test/prop");
      const runQuery = jest.spyOn(os, "runQuery").mockResolvedValue(makeBindings([]) as never);
      await prop.getSubProperties();
      const q = runQuery.mock.calls[0][0] as string;
      expect(q).toContain(`rdfs:subPropertyOf <${prop.uri}>`);
      expect(q).not.toContain("rdfs:subPropertyOf*");
    });

    it("uses a transitive path when recurse=true", async () => {
      const prop = new RDFProperty(os, "http://example.test/prop");
      const runQuery = jest.spyOn(os, "runQuery").mockResolvedValue(makeBindings([]) as never);
      await prop.getSubProperties(true);
      expect(runQuery.mock.calls[0][0] as string).toContain(`rdfs:subPropertyOf* <${prop.uri}>`);
    });
  });
});

describe("RDFSClass", () => {
  let os: OntologyService;
  beforeEach(() => {
    os = new OntologyService(MOCK_URL);
  });

  describe("constructor", () => {
    it("enqueues a subClassOf insert when a superClass is provided (no statement)", () => {
      const superClass = new RDFSClass(os, "http://example.test/Super");
      jest.spyOn(os, "insertTriple").mockResolvedValue("ok");

      const cls = new RDFSClass(
        os,
        "http://example.test/Sub",
        undefined,
        undefined,
        superClass
      );
      expect(cls.constructorPromises.length).toBeGreaterThan(0);
    });

    it("warns when both a statement and a superClass are provided", () => {
      const warnSpy = jest.spyOn(os, "warn").mockImplementation(() => undefined);
      const superClass = new RDFSClass(os, "http://example.test/Super");
      const statement = {
        uri: uri("http://example.test/Cls"),
        _type: uri(os.rdfsClass),
      } as any;

      new RDFSClass(os, undefined, undefined, statement, superClass);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Do not set superClass"));
    });
  });

  describe("describe", () => {
    it("bins literals and routes links to the correct buckets", async () => {
      const cls = new RDFSClass(os, "http://example.test/Cls");
      const desc = emptyDescription();
      desc.literals[os.rdfsComment] = ["comment"];
      desc.literals[os.rdfsLabel] = ["Label"];
      desc.literals[os.telicentStyle] = [encodeURIComponent(JSON.stringify(new Style("#111")))];
      desc.literals["http://example.test/other"] = ["x"];
      desc.outLinks[os.rdfsSubClassOf] = { "http://example.test/Super": ["type"] };
      desc.outLinks["http://example.test/otherOut"] = { "http://example.test/x": ["type"] };
      desc.inLinks[os.rdfsSubClassOf] = { "http://example.test/Sub": ["type"] };
      desc.inLinks[os.rdfsRange] = { "http://example.test/RangeProp": ["type"] };
      desc.inLinks[os.rdfsDomain] = { "http://example.test/DomainProp": ["type"] };
      desc.inLinks[os.telRepresents] = { "http://example.test/de": ["type"] };
      desc.inLinks["http://example.test/otherIn"] = { "http://example.test/x": ["type"] };

      jest.spyOn(cls as any, "describeNode").mockResolvedValue(desc);
      const processSpy = jest.spyOn(os, "processObjectLink").mockResolvedValue([]);

      const out = await cls.describe();
      expect(out.comments).toEqual(["comment"]);
      expect(out.labels).toEqual(["Label"]);
      expect(out.style?.bgColour).toBe("#111");
      expect(out.literals["http://example.test/other"]).toEqual(["x"]);
      // 2 outLinks + 5 inLinks = 7 calls
      expect(processSpy).toHaveBeenCalledTimes(7);
    });
  });

  describe("getSubClasses / getSuperClasses", () => {
    it("getSubClasses uses non-recursive path by default", async () => {
      const cls = new RDFSClass(os, "http://example.test/Cls");
      const runQuery = jest.spyOn(os, "runQuery").mockResolvedValue(makeBindings([]) as never);
      await cls.getSubClasses();
      const q = runQuery.mock.calls[0][0] as string;
      expect(q).toContain(`rdfs:subClassOf <${cls.uri}>`);
      expect(q).not.toContain("rdfs:subClassOf*");
    });

    it("getSubClasses uses transitive path when recurse=true", async () => {
      const cls = new RDFSClass(os, "http://example.test/Cls");
      const runQuery = jest.spyOn(os, "runQuery").mockResolvedValue(makeBindings([]) as never);
      await cls.getSubClasses(true);
      expect(runQuery.mock.calls[0][0] as string).toContain("rdfs:subClassOf*");
    });

    it("getSuperClasses uses inherited flag to swap path operator", async () => {
      const cls = new RDFSClass(os, "http://example.test/Cls");
      const runQuery = jest.spyOn(os, "runQuery").mockResolvedValue(makeBindings([]) as never);

      await cls.getSuperClasses(false);
      expect(runQuery.mock.calls[0][0] as string).toContain(`<${os.rdfsSubClassOf}> `);

      await cls.getSuperClasses(true);
      expect(runQuery.mock.calls[1][0] as string).toContain(`<${os.rdfsSubClassOf}>*`);
    });
  });

  describe("getOwnedProperties / getReferringProperties", () => {
    it("getOwnedProperties uses rdfs:domain and an inherited path when requested", async () => {
      const cls = new RDFSClass(os, "http://example.test/Cls");
      const runQuery = jest.spyOn(os, "runQuery").mockResolvedValue(makeBindings([]) as never);

      await cls.getOwnedProperties();
      expect(runQuery.mock.calls[0][0] as string).toContain(`?uri rdfs:domain <${cls.uri}>`);

      await cls.getOwnedProperties(true);
      expect(runQuery.mock.calls[1][0] as string).toContain("rdfs:subClassOf*");
    });

    it("getReferringProperties uses rdfs:range and an inherited path when requested", async () => {
      const cls = new RDFSClass(os, "http://example.test/Cls");
      const runQuery = jest.spyOn(os, "runQuery").mockResolvedValue(makeBindings([]) as never);

      await cls.getReferringProperties();
      expect(runQuery.mock.calls[0][0] as string).toContain(`?uri rdfs:range <${cls.uri}>`);

      await cls.getReferringProperties(true);
      expect(runQuery.mock.calls[1][0] as string).toContain("rdfs:subClassOf*");
    });
  });

  describe("addSubClass / addSuperClass", () => {
    it("addSubClass with a URI inserts a subClassOf triple and returns a new RDFSClass", async () => {
      const cls = new RDFSClass(os, "http://example.test/Cls");
      const ins = jest.spyOn(os, "insertTriple").mockResolvedValue("ok");

      const sub = await cls.addSubClass("http://example.test/Sub");
      expect(sub).toBeInstanceOf(RDFSClass);
      expect(sub.uri).toBe("http://example.test/Sub");
      expect(ins).toHaveBeenCalledWith(
        "http://example.test/Sub",
        os.rdfsSubClassOf,
        "http://example.test/Cls"
      );
    });

    it("addSubClass with an RDFSClass returns the same instance", async () => {
      const cls = new RDFSClass(os, "http://example.test/Cls");
      const other = new RDFSClass(os, "http://example.test/Sub");
      jest.spyOn(os, "insertTriple").mockResolvedValue("ok");

      const result = await cls.addSubClass(other);
      expect(result).toBe(other);
    });

    it("addSuperClass with a URI inserts a subClassOf triple and returns a new RDFSClass", async () => {
      const cls = new RDFSClass(os, "http://example.test/Cls");
      const ins = jest.spyOn(os, "insertTriple").mockResolvedValue("ok");

      const sup = await cls.addSuperClass("http://example.test/Super");
      expect(sup).toBeInstanceOf(RDFSClass);
      expect(ins).toHaveBeenCalledWith(
        "http://example.test/Cls",
        os.rdfsSubClassOf,
        "http://example.test/Super"
      );
    });

    it("addSuperClass with an RDFSClass returns the same instance", async () => {
      const cls = new RDFSClass(os, "http://example.test/Cls");
      const other = new RDFSClass(os, "http://example.test/Super");
      jest.spyOn(os, "insertTriple").mockResolvedValue("ok");

      const result = await cls.addSuperClass(other);
      expect(result).toBe(other);
    });
  });
});

describe("OntologyService hierarchy", () => {
  let os: OntologyService;
  beforeEach(() => {
    os = new OntologyService(MOCK_URL);
  });

  it("getClassHierarchy issues a query filtered to class-y types with rdfs:subClassOf", async () => {
    const runQuery = jest.spyOn(os, "runQuery").mockResolvedValue(makeBindings([]) as never);
    await os.getClassHierarchy();

    const q = runQuery.mock.calls[0][0] as string;
    expect(q).toContain("rdfs:Class, owl:Class, rdfs:Datatype");
    expect(q).toContain("rdfs:subClassOf");
  });

  it("getPropertyHierarchy issues a query filtered to property types with rdfs:subPropertyOf", async () => {
    const runQuery = jest.spyOn(os, "runQuery").mockResolvedValue(makeBindings([]) as never);
    await os.getPropertyHierarchy();

    const q = runQuery.mock.calls[0][0] as string;
    expect(q).toContain("rdf:Property");
    expect(q).toContain("owl:ObjectProperty");
    expect(q).toContain("rdfs:subPropertyOf");
  });

  it("builds a hierarchy tree from query results with labels, subs, and supers", async () => {
    // 3 nodes: A (top) → B → C
    const rows = [
      {
        uri: uri("http://example.test/A"),
        _type: uri(os.rdfsClass),
        labels: { type: "literal", value: "A label" },
        subs: { type: "literal", value: "http://example.test/B" },
        supers: undefined,
        styles: undefined,
      },
      {
        uri: uri("http://example.test/B"),
        _type: uri(os.rdfsClass),
        labels: { type: "literal", value: "" },
        subs: { type: "literal", value: "http://example.test/C" },
        supers: { type: "literal", value: "http://example.test/A" },
        styles: undefined,
      },
      {
        uri: uri("http://example.test/C"),
        _type: uri(os.rdfsClass),
        labels: undefined,
        subs: undefined,
        supers: { type: "literal", value: "http://example.test/B" },
        styles: undefined,
      },
    ];
    jest.spyOn(os, "runQuery").mockResolvedValue(makeBindings(rows) as never);

    const hierarchy = await os.getClassHierarchy();

    // Only A is at the top (no supers)
    expect(hierarchy).toHaveLength(1);
    const [a] = hierarchy;
    expect(a.id).toBe("http://example.test/A");
    expect(a.label).toBe("A label");
    expect(a.children).toHaveLength(1);
    expect(a.children[0].id).toBe("http://example.test/B");
    expect(a.children[0].children[0].id).toBe("http://example.test/C");
  });

  it("warns and continues when a style JSON in a hierarchy row fails to decode", async () => {
    const warnSpy = jest.spyOn(os, "warn").mockImplementation(() => undefined);
    const rows = [
      {
        uri: uri("http://example.test/A"),
        _type: uri(os.rdfsClass),
        labels: undefined,
        subs: undefined,
        supers: undefined,
        styles: { type: "literal", value: "%not-json%" },
      },
    ];
    jest.spyOn(os, "runQuery").mockResolvedValue(makeBindings(rows) as never);

    const out = await os.getClassHierarchy();
    expect(out).toHaveLength(1);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Unable to decode style"));
  });
});

describe("OWLClass", () => {
  it("defaults type to owl:Class when constructed without one", () => {
    const os = new OntologyService(MOCK_URL);
    const cls = new OWLClass(os, "http://example.test/Cls");
    expect(cls.types).toContain(os.owlClass);
  });
});

describe("Diagram methods", () => {
  let os: OntologyService;
  beforeEach(() => {
    os = new OntologyService(MOCK_URL);
  });

  it("getDiagramElements queries by inDiagram + represents", async () => {
    const d = new Diagram(os, "http://example.test/D1");
    const runQuery = jest.spyOn(os, "runQuery").mockResolvedValue(makeBindings([]) as never);

    await d.getDiagramElements();
    const q = runQuery.mock.calls[0][0] as string;
    expect(q).toContain(`?uri <${os.telInDiagram}> <${d.uri}>`);
    expect(q).toContain(`?uri <${os.telRepresents}> ?element`);
  });

  it("getDiagramRelations queries by inDiagram + source/target + rel", async () => {
    const d = new Diagram(os, "http://example.test/D1");
    const runQuery = jest.spyOn(os, "runQuery").mockResolvedValue(makeBindings([]) as never);

    await d.getDiagramRelations();
    const q = runQuery.mock.calls[0][0] as string;
    expect(q).toContain(`?uri <${os.telInDiagram}> <${d.uri}>`);
    expect(q).toContain(`?uri <${os.telSourceElem}> ?source`);
    expect(q).toContain(`?uri <${os.telTargetElem}> ?target`);
    expect(q).toContain(`?uri <${os.telRepresents}> ?rel`);
  });

  it("getDiagramRelations returns relations built from the query rows", async () => {
    const d = new Diagram(os, "http://example.test/D1");
    const rows = [
      {
        uri: uri("http://example.test/rel1"),
        _type: uri(os.telDiagramRelationship),
        source: uri("http://example.test/src"),
        target: uri("http://example.test/tgt"),
        rel: uri("http://example.test/relPredicate"),
        style: { type: "literal", value: encodeURIComponent(JSON.stringify({ color: "#f00" })) },
      },
    ];
    jest.spyOn(os, "runQuery").mockResolvedValue(makeBindings(rows) as never);

    const rels = await d.getDiagramRelations();
    expect(rels).toHaveLength(1);
    expect(rels[0].uri).toBe("http://example.test/rel1");
    expect(rels[0].relationship).toBe("http://example.test/relPredicate");
    expect(rels[0].style).toEqual({ color: "#f00" });
  });
});
