/* eslint-disable @typescript-eslint/no-explicit-any */
import { QueryResponse, TypedNodeQuerySolution } from "@telicent-oss/rdfservice";
import {
  AppliedStyle,
  Diagram,
  DiagramElement,
  DiagramProperty,
  OntologyService,
  OWLClass,
  OWLDatatypeProperty,
  OWLObjectProperty,
  RDFProperty,
  RDFSClass,
  RDFSDatatype,
  Style,
} from "../src/index";
import { getTypeInitials } from "../src/ds-helper";
import { makeStyleObject } from "../src/helper";

const MOCK_URL = "http://localhost:3030/";

const makeBindings = <T,>(bindings: T[]) =>
  ({
    head: { vars: [] },
    results: { bindings },
  } as unknown as QueryResponse<T>);

const uri = (value: string) => ({ type: "uri", value });

describe("Style", () => {
  it("uses greyed-out defaults when no args are passed", () => {
    const s = new Style();
    expect(s).toEqual({
      bgColour: "#888",
      colour: "#000",
      icon: "fa-solid fa-question",
      height: 0,
      width: 0,
      x: 0,
      y: 0,
      shape: "diamond",
    });
  });

  it("uses the provided values when all args are passed", () => {
    const s = new Style("#f00", "#0f0", "fa-star", 10, 20, 30, 40, "ellipse");
    expect(s).toEqual({
      bgColour: "#f00",
      colour: "#0f0",
      icon: "fa-star",
      height: 10,
      width: 20,
      x: 30,
      y: 40,
      shape: "ellipse",
    });
  });
});

describe("AppliedStyle", () => {
  it("stores the class URI and style", () => {
    const style = new Style();
    const applied = new AppliedStyle("http://example.test/Cls", style);
    expect(applied.cls).toBe("http://example.test/Cls");
    expect(applied.style).toBe(style);
  });
});

describe("makeStyleObject", () => {
  it("exports a default Style instance", () => {
    expect(makeStyleObject).toBeInstanceOf(Style);
    expect(makeStyleObject.bgColour).toBe("#888");
    expect(makeStyleObject.colour).toBe("#000");
    expect(makeStyleObject.icon).toBe("fa-solid fa-question");
  });
});

describe("getTypeInitials", () => {
  it("returns initials of a hash-fragment URI", () => {
    expect(getTypeInitials("http://example.test/ns#SomeClassName")).toBe("SCN");
  });

  it("returns the input for URIs without a fragment", () => {
    expect(getTypeInitials("http://example.test/ns/NoFragment")).toBe(
      "http://example.test/ns/NoFragment"
    );
  });

  it("returns empty string for empty input", () => {
    expect(getTypeInitials("")).toBe("");
  });
});

describe("OntologyService constructor", () => {
  let os: OntologyService;
  beforeEach(() => {
    os = new OntologyService(MOCK_URL);
  });

  it("populates all telicent-namespaced URIs", () => {
    expect(os.telDiagram).toBe("http://telicent.io/ontology/Diagram");
    expect(os.telUUID).toBe("http://telicent.io/ontology/uuid");
    expect(os.telElementStyle).toBe("http://telicent.io/ontology/elementStyle");
    expect(os.telRelationshipStyle).toBe("http://telicent.io/ontology/relationshipStyle");
    expect(os.telInDiagram).toBe("http://telicent.io/ontology/inDiagram");
    expect(os.telRepresents).toBe("http://telicent.io/ontology/represents");
    expect(os.telBaseType).toBe("http://telicent.io/ontology/baseType");
    expect(os.telDiagramElement).toBe("http://telicent.io/ontology/DiagramElement");
    expect(os.telDiagramRelationship).toBe("http://telicent.io/ontology/DiagramRelationship");
    expect(os.telDiagramPropertyDefinition).toBe(
      "http://telicent.io/ontology/DiagramPropertyDefinition"
    );
    expect(os.telRouting).toBe("http://telicent.io/ontology/routing");
    expect(os.telDisplayAs).toBe("http://telicent.io/ontology/displayAs");
    expect(os.telSourceElem).toBe("http://telicent.io/ontology/sourceElem");
    expect(os.telTargetElem).toBe("http://telicent.io/ontology/targetElem");
    expect(os.telicentStyle).toBe("http://telicent.io/ontology/style");
  });

  it("populates all rdfs and owl URIs", () => {
    expect(os.rdfsClass).toBe("http://www.w3.org/2000/01/rdf-schema#Class");
    expect(os.rdfsDatatype).toBe("http://www.w3.org/2000/01/rdf-schema#Datatype");
    expect(os.rdfsSubClassOf).toBe("http://www.w3.org/2000/01/rdf-schema#subClassOf");
    expect(os.rdfsDomain).toBe("http://www.w3.org/2000/01/rdf-schema#domain");
    expect(os.rdfsRange).toBe("http://www.w3.org/2000/01/rdf-schema#range");
    expect(os.rdfsSubPropertyOf).toBe("http://www.w3.org/2000/01/rdf-schema#subPropertyOf");
    expect(os.rdfProperty).toBe("http://www.w3.org/1999/02/22-rdf-syntax-ns#Property");
    expect(os.owlClass).toBe("http://www.w3.org/2002/07/owl#Class");
    expect(os.owlDatatypeProperty).toBe("http://www.w3.org/2002/07/owl#DatatypeProperty");
    expect(os.owlObjectProperty).toBe("http://www.w3.org/2002/07/owl#ObjectProperty");
  });

  it("registers ontology classes in classLookup", () => {
    expect(os.classLookup[os.rdfProperty]).toBe(RDFProperty);
    expect(os.classLookup[os.owlClass]).toBe(OWLClass);
    expect(os.classLookup[os.owlDatatypeProperty]).toBe(OWLDatatypeProperty);
    expect(os.classLookup[os.owlObjectProperty]).toBe(OWLObjectProperty);
    expect(os.classLookup[os.rdfsClass]).toBe(RDFSClass);
    expect(os.classLookup[os.rdfsDatatype]).toBe(RDFSDatatype);
    expect(os.classLookup[os.telDiagramElement]).toBe(DiagramElement);
    expect(os.classLookup[os.telDiagram]).toBe(Diagram);
    expect(os.classLookup[os.telDiagramPropertyDefinition]).toBe(DiagramProperty);
  });

  it("registers the owl prefix", () => {
    expect(os.shorten("http://www.w3.org/2002/07/owl#Class")).toBe("owl:Class");
  });
});

describe("OntologyService query builders", () => {
  let os: OntologyService;
  let runQuery: jest.SpiedFunction<OntologyService["runQuery"]>;

  beforeEach(() => {
    os = new OntologyService(MOCK_URL);
    runQuery = jest
      .spyOn(os, "runQuery")
      .mockResolvedValue(makeBindings([]) as never);
  });

  describe("getAllClasses", () => {
    it("uses rdfs:Class-only filter when includeOwlClasses=false", async () => {
      await os.getAllClasses(false);
      expect(runQuery).toHaveBeenCalledWith(
        "SELECT ?uri (group_concat(DISTINCT ?type) as ?_type) WHERE {BIND (rdfs:Class as ?type . ?uri a ?type ) . } GROUP BY ?uri"
      );
    });

    it("filters to owl+rdfs classes when includeOwlClasses=true (default)", async () => {
      await os.getAllClasses();
      expect(runQuery).toHaveBeenCalledWith(
        "SELECT ?uri (group_concat(DISTINCT ?type) as ?_type) WHERE {?uri a ?type . FILTER (?type IN (owl:Class, rdfs:Class)) . } GROUP BY ?uri"
      );
    });

    it("adds the top-classes filter when getOnlyTopClasses=true", async () => {
      await os.getAllClasses(true, true);
      const call = runQuery.mock.calls[0][0] as string;
      expect(call).toContain("FILTER NOT EXISTS {");
      expect(call).toContain("?uri rdfs:subClassOf ?parentClass");
    });
  });

  describe("getTopClasses", () => {
    it("delegates to getAllClasses with getOnlyTopClasses=true", async () => {
      const spy = jest.spyOn(os, "getAllClasses").mockResolvedValue([]);
      await os.getTopClasses();
      expect(spy).toHaveBeenCalledWith(true, true);
    });
  });

  describe("getAllRdfProperties", () => {
    it("filters to rdf:Property only when includeOwlProperties=false", async () => {
      await os.getAllRdfProperties(false);
      expect(runQuery).toHaveBeenCalledWith(
        expect.stringContaining("BIND (rdf:Property as ?_type")
      );
    });

    it("filters to owl+rdf properties when includeOwlProperties=true (default)", async () => {
      await os.getAllRdfProperties();
      expect(runQuery).toHaveBeenCalledWith(
        expect.stringContaining("FILTER (?_type IN (owl:ObjectProperty, owl:DatatypeProperty, rdf:Property))")
      );
    });

    it("adds the top-properties filter when getOnlyTopProperties=true", async () => {
      await os.getAllRdfProperties(true, true);
      const call = runQuery.mock.calls[0][0] as string;
      expect(call).toContain("FILTER NOT EXISTS {");
      expect(call).toContain("?uri rdfs:subPropertyOf ?parentProp");
    });
  });

  describe("getTopProperties", () => {
    it("delegates to getAllRdfProperties with getOnlyTopProperties=true", async () => {
      const spy = jest.spyOn(os, "getAllRdfProperties").mockResolvedValue([]);
      await os.getTopProperties();
      expect(spy).toHaveBeenCalledWith(true, true);
    });
  });

  describe("getAllObjectProperties", () => {
    it("queries only owl:ObjectProperty", async () => {
      await os.getAllObjectProperties();
      const call = runQuery.mock.calls[0][0] as string;
      expect(call).toContain("BIND (owl:ObjectProperty as ?_type)");
    });
  });

  describe("getAllDiagrams", () => {
    it("filters by tel:Diagram and dc:title", async () => {
      await os.getAllDiagrams();
      const call = runQuery.mock.calls[0][0] as string;
      expect(call).toContain(`?uri a <${os.telDiagram}>`);
      expect(call).toContain(`?uri <${os.dcTitle}> ?title`);
    });
  });

  describe("getAppliedStyles", () => {
    it("returns an empty array when the query has no results", async () => {
      runQuery.mockResolvedValueOnce(makeBindings([]) as never);
      const styles = await os.getAppliedStyles();
      expect(styles).toEqual([]);
    });

    it("adds a filter clause when classes are specified", async () => {
      await os.getAppliedStyles(["http://example.test/A", "http://example.test/B"]);
      const call = runQuery.mock.calls[0][0] as string;
      expect(call).toContain('FILTER (str(?cls) IN ("http://example.test/A", "http://example.test/B") )');
    });

    it("wraps matched rows in AppliedStyle instances", async () => {
      const styleJson = encodeURIComponent(JSON.stringify(new Style("#111")));
      runQuery.mockResolvedValueOnce(
        makeBindings([
          {
            cls: uri("http://example.test/A"),
            style: uri(styleJson),
          },
        ]) as never
      );

      const styles = await os.getAppliedStyles([]);
      expect(styles).toHaveLength(1);
      expect(styles[0]).toBeInstanceOf(AppliedStyle);
      expect(styles[0].cls).toBe("http://example.test/A");
      expect(styles[0].style.bgColour).toBe("#111");
    });
  });

  describe("getStyles (deprecated)", () => {
    it("returns an empty record when there are no results", async () => {
      const out = await os.getStyles([]);
      expect(out).toEqual({});
    });

    it("returns a dictionary keyed by class URI for valid styles", async () => {
      const styleObj = {
        defaultIcons: {
          riIcon: "",
          faIcon: "",
          faUnicode: "",
          faClass: "",
        },
        defaultStyles: {
          shape: "ellipse",
          borderRadius: "0",
          borderWidth: "0",
          selectedBorderWidth: "0",
          dark: { backgroundColor: "#000", color: "#fff" },
          light: { backgroundColor: "#fff", color: "#000" },
        },
      };
      runQuery.mockResolvedValueOnce(
        makeBindings([
          {
            cls: uri("http://example.test/A"),
            style: uri(encodeURIComponent(JSON.stringify(styleObj))),
          },
        ]) as never
      );

      const out = await os.getStyles(["http://example.test/A"]);
      expect(out["http://example.test/A"]).toEqual(styleObj);
    });
  });

  describe("getAllPreferredLabels", () => {
    it("returns an empty array on empty response", async () => {
      const out = await os.getAllPreferredLabels();
      expect(out).toEqual([]);
    });

    it("returns the raw bindings on success", async () => {
      const bindings = [
        {
          name: uri("http://example.test/A"),
          label: { type: "literal", value: "Alpha" },
        },
      ];
      runQuery.mockResolvedValueOnce(makeBindings(bindings) as never);

      const out = await os.getAllPreferredLabels();
      expect(out).toEqual(bindings);
    });
  });

  describe("getDiagram", () => {
    it("returns undefined and warns when no diagram matches", async () => {
      const warnSpy = jest.spyOn(os, "warn").mockImplementation(() => undefined);
      runQuery.mockResolvedValueOnce(makeBindings([]) as never);

      const result = await os.getDiagram("http://example.test/D1");
      expect(result).toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("No diagram with URI"));
    });

    it("returns undefined and warns when multiple diagrams match", async () => {
      const warnSpy = jest.spyOn(os, "warn").mockImplementation(() => undefined);
      runQuery.mockResolvedValueOnce(
        makeBindings([
          { uri: uri("http://example.test/D1"), _type: uri(os.telDiagram) },
          { uri: uri("http://example.test/D1"), _type: uri(os.telDiagram) },
        ]) as never
      );

      const result = await os.getDiagram("http://example.test/D1");
      expect(result).toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("More than one diagram"));
    });
  });
});

describe("OntologyService.PROPOSED_findIcon", () => {
  let os: OntologyService;
  beforeEach(() => {
    os = new OntologyService(MOCK_URL);
  });

  it("returns the matched style when the classUri is present", () => {
    const styles = [
      {
        classUri: "http://example.test/A",
        backgroundColor: "#000",
        color: "#fff",
        iconFallbackText: "A",
        alt: "A",
        shape: "ellipse",
        faUnicode: "",
        faIcon: "",
      },
    ];
    const found = os.PROPOSED_findIcon(styles, "http://example.test/A");
    expect(found).toBe(styles[0]);
  });

  it("returns a fallback icon when the classUri is not present", () => {
    const result = os.PROPOSED_findIcon([], "http://example.test/ns#Foo");
    expect(result).toEqual({
      classUri: "http://example.test/ns#Foo",
      color: "#DDDDDD",
      backgroundColor: "#121212",
      iconFallbackText: "F",
      alt: expect.any(String),
    });
  });
});

describe("OntologyService.PROPOSED_getFlattenedStyles", () => {
  it("maps style records into the flattened shape", async () => {
    const os = new OntologyService(MOCK_URL);
    jest.spyOn(os, "getStyles").mockResolvedValue({
      "http://example.test/ns#Foo": {
        defaultIcons: {
          riIcon: "",
          faIcon: "fa-star",
          faUnicode: "f005",
          faClass: "fa-solid",
        },
        defaultStyles: {
          shape: "circle",
          borderRadius: "0",
          borderWidth: "0",
          selectedBorderWidth: "0",
          dark: { backgroundColor: "#111", color: "#eee" },
          light: { backgroundColor: "#eee", color: "#111" },
        },
      },
    });

    const flat = await os.PROPOSED_getFlattenedStyles([]);
    expect(flat).toEqual([
      {
        classUri: "http://example.test/ns#Foo",
        backgroundColor: "#111",
        color: "#eee",
        iconFallbackText: "F",
        alt: expect.any(String),
        shape: "circle",
        faUnicode: "f005",
        faIcon: "fa-star",
      },
    ]);
  });
});

describe("OntologyService.setStyle", () => {
  it("deletes existing styles then inserts an encoded style literal", async () => {
    const os = new OntologyService(MOCK_URL);
    const del = jest
      .spyOn(os, "deleteRelationships")
      .mockResolvedValue("ok");
    const ins = jest.spyOn(os, "insertTriple").mockResolvedValue("ok");

    const style = new Style("#123", "#456");
    await os.setStyle("http://example.test/A", style);

    expect(del).toHaveBeenCalledWith("http://example.test/A", os.telicentStyle);
    expect(ins).toHaveBeenCalledWith(
      "http://example.test/A",
      os.telicentStyle,
      encodeURIComponent(JSON.stringify(style)),
      "LITERAL"
    );
  });
});

describe("Diagram", () => {
  it("stores uuid and title from a query statement", () => {
    const os = new OntologyService(MOCK_URL);
    const statement = {
      uri: uri("http://example.test/D1"),
      _type: uri(os.telDiagram),
      uuid: { type: "literal", value: "abc-123" },
      title: { type: "literal", value: "My diagram" },
    };

    const d = new Diagram(os, undefined, undefined, undefined, statement as any);
    expect(d.uuid).toBe("abc-123");
    expect(d.title).toBe("My diagram");
  });

  it("mints a UUID and enqueues its persistence when constructed without a statement", () => {
    const os = new OntologyService(MOCK_URL);
    jest.spyOn(os, "insertTriple").mockResolvedValue("ok");

    const d = new Diagram(os, "http://example.test/D2");
    // At least the mintUUID + optional setTitle promises should be queued
    expect(d.constructorPromises.length).toBeGreaterThan(0);
  });
});
