import { OntologyService } from "@telicent-oss/ontologyservice";
import { findByClassUri, init } from "./index";

jest.mock("@telicent-oss/ontologyservice", () => {
  const actual = jest.requireActual("@telicent-oss/ontologyservice");

  // Extending the actual OntologyService class
  class MockOntologyService extends actual.OntologyService {
    getFlattenedStyles = jest.fn(() =>
      Promise.resolve([
        {
          classUri: "http://example.com#test",
          backgroundColor: "<backgroundColor>",
          color: "<color>",
          iconFallbackText: "<iconFallbackText>",
        },
      ])
    );
  }

  return {
    OntologyService: MockOntologyService,
  };
});

describe("OntologyService Module", () => {
  let ontologyService: OntologyService;

  beforeEach(async () => {
    ontologyService = new OntologyService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("Fails to finds icon by class URI, if not init'd", async () => {
    expect(() => findByClassUri("testUri")).toThrowErrorMatchingInlineSnapshot(`
      "
            Expected moduleStyles to be type FlattenedStyleType, 
            instead got "undefined" (undefined)"
    `);
  });

  it("inits incorrectly", async () => {
    const instance = new (class Unknown {})() as unknown as OntologyService;
    await expect(init(Promise.resolve(instance))).rejects
      .toThrowErrorMatchingInlineSnapshot(`
      "
            Expected moduleOntologyService instance of OntologyService
            instead got "{}"
            (object)"
    `);
  });

  it("inits", async () => {
    expect(await init(Promise.resolve(ontologyService))).toBeUndefined();
  });

  it("Fails to finds icon by class URI, if URI doesn't contain hash or urlsegment", async () => {
    expect(() => findByClassUri("testUri")).toThrowErrorMatchingInlineSnapshot(`
      "[
        {
          "validation": "regex",
          "code": "invalid_string",
          "message": "\\n  Invalid URI format. \\n  Ensure it starts with a valid scheme and is followed by '://',\\n  then a valid resource part without spaces.",
          "path": []
        },
        {
          "code": "custom",
          "message": "URI must include either a hash or at least one URI segment.",
          "path": []
        }
      ]"
    `);
  });

  it("finds icon by class URI", async () => {
    await init(Promise.resolve(ontologyService));

    const result = findByClassUri("http://example.com#test");
    expect(result).toMatchInlineSnapshot(`
      {
        "backgroundColor": "<backgroundColor>",
        "classUri": "http://example.com#test",
        "color": "<color>",
        "iconFallbackText": "<iconFallbackText>",
      }
    `);
  });
  it("does not find icon by class URI, so creates a stub", async () => {
    await init(Promise.resolve(ontologyService));

    const result = findByClassUri("http://example.com#does-not-exist");
    expect(result).toMatchInlineSnapshot(`
      {
        "alt": "http://example.com#does-not-exist",
        "backgroundColor": "#121212",
        "classUri": "http://example.com#does-not-exist",
        "color": "#DDDDDD",
        "iconFallbackText": "DNE",
      }
    `);
  });
});
