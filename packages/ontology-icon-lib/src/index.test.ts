import { OntologyService } from "@telicent-oss/ontologyservice";
import { findByClassUri, init, name, version } from "./index";
test("name, version", () => {
  expect(name).toMatchInlineSnapshot(`"@telicent-oss/ontology-icon-lib"`);
  expect(version).toBeDefined();
});
jest.mock("@telicent-oss/ontologyservice", () => {
  const actual = jest.requireActual("@telicent-oss/ontologyservice");

  // Extending the actual OntologyService class
  class MockOntologyService extends actual.OntologyService {
    getStyles = jest.fn(() =>
      Promise.resolve({
        ["http://example.com#term"]: {
          defaultStyles: {
            dark: {
              backgroundColor: "<backgroundColor>",
              color: "<color>",
            },
          },
          defaultIcons: {
            faIcon: "<faIcon>",
            faUnicode: "<faUnicode>",
          },
        },
      })
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
    expect(() => findByClassUri("http://domain.com#test"))
      .toThrowErrorMatchingInlineSnapshot(`
      "
            Expected moduleStyles to be of type FlattenedStyleType, 
            instead got "undefined" (undefined)"
    `);
  });

  it("inits incorrectly", async () => {
    const instance = new (class Unknown {})() as unknown as OntologyService;
    await expect(init(Promise.resolve(instance))).rejects
      .toThrowErrorMatchingInlineSnapshot(`
      "
            Expected moduleOntologyService instance of OntologyService with getStyles()
            instead got "{}"
            (object)"
    `);
  });

  it("inits", async () => {
    expect(await init(Promise.resolve(ontologyService))).toBeDefined();
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

    const result = findByClassUri("http://example.com#term");
    expect(result).toMatchInlineSnapshot(`
      {
        "alt": "term",
        "backgroundColor": "<backgroundColor>",
        "classUri": "http://example.com#term",
        "color": "<color>",
        "faIcon": "<faIcon>",
        "faUnicode": "<faUnicode>",
        "iconFallbackText": "T",
        "shape": undefined,
      }
    `);
  });
  it("does not find icon by class URI, so creates a stub", async () => {
    await init(Promise.resolve(ontologyService));

    const result = findByClassUri("http://example.com#does-not-exist");
    expect(result).toMatchInlineSnapshot(`
      {
        "alt": "does-not-exist",
        "backgroundColor": "#121212",
        "classUri": "http://example.com#does-not-exist",
        "color": "#DDDDDD",
        "iconFallbackText": "DNE",
      }
    `);
  });
});
