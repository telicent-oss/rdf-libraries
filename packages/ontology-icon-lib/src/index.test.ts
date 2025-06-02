import { OntologyService } from "@telicent-oss/ontologyservice";
import { findByClassUri, init, name, version } from "./index";

const spies = {
  console: {
    warn: jest.spyOn(console, "warn").mockImplementation(() => undefined),
  },
};

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
  afterAll(() => {
    expect(spies.console.warn.mock.calls).toMatchInlineSnapshot(`[]`);
  });

  it("Fails to finds icon by class URI, if not init'd", async () => {
    expect(() =>
      findByClassUri("http://domain.com#test")
    ).toMatchInlineSnapshot(`[Function]`);
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
    expect(() => findByClassUri("testUri")).toMatchInlineSnapshot(`[Function]`);
  });

  it("finds icon by class URI", async () => {
    await init(Promise.resolve(ontologyService));

    const result = findByClassUri("http://example.com#term");
    expect(result).toMatchInlineSnapshot(`
      {
        "alt": "Unknown",
        "backgroundColor": "#121212",
        "classUri": "Unknown",
        "color": "#DDDDDD",
        "iconFallbackText": "?",
      }
    `);
  });
  it("does not find icon by class URI, so creates a stub", async () => {
    await init(Promise.resolve(ontologyService));

    const result = findByClassUri("http://example.com#does-not-exist");
    expect(result).toMatchInlineSnapshot(`
      {
        "alt": "Unknown",
        "backgroundColor": "#121212",
        "classUri": "Unknown",
        "color": "#DDDDDD",
        "iconFallbackText": "?",
      }
    `);
  });
});
