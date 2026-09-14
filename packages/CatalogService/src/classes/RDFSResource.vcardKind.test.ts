import { CatalogService, vcardKind } from "../index";

const NO_WARNINGS = { config: { NO_WARNINGS: true } };

describe("vcardKind", () => {
  let cs: CatalogService;
  beforeEach(() => {
    cs = new CatalogService({ writeEnabled: false, ...NO_WARNINGS });
    jest.spyOn(cs, "insertTriple").mockResolvedValue("ok");
  });

  it("defaults the RDF type to vcard:Kind when none is given", () => {
    const v = new vcardKind(cs, "http://example.test/kind");
    expect(v.types).toContain("http://www.w3.org/2006/vcard/ns#Kind");
    expect(v.uri).toBe("http://example.test/kind");
  });

  it("returns the cached instance without re-writing when inCache reports true", () => {
    jest.spyOn(cs, "inCache").mockReturnValue(true);
    const v = new vcardKind(cs, "http://example.test/kind");
    expect(v.uri).toBe("http://example.test/kind");
  });

  const findLiteralCall = (uri: string, predicate: string, value: string) =>
    (cs.insertTriple as jest.Mock).mock.calls.find(
      (c) => c[0] === uri && c[1] === predicate && c[2] === value && c[3] === "LITERAL"
    );

  it("setFormattedName inserts a vcard:fn literal and pushes the promise onto constructorPromises", async () => {
    const v = new vcardKind(cs, "http://example.test/kind");
    const before = v.constructorPromises.length;
    await v.setFormattedName("Ada Lovelace");
    expect(v.constructorPromises.length).toBe(before + 1);
    expect(
      findLiteralCall(v.uri, "http://www.w3.org/2006/vcard/ns#fn", "Ada Lovelace")
    ).toBeDefined();
  });

  it("setGivenName inserts a vcard:given-name literal", async () => {
    const v = new vcardKind(cs, "http://example.test/kind");
    await v.setGivenName("Ada");
    expect(
      findLiteralCall(v.uri, "http://www.w3.org/2006/vcard/ns#given-name", "Ada")
    ).toBeDefined();
  });

  it("setFamilyName inserts a vcard:family-name literal", async () => {
    const v = new vcardKind(cs, "http://example.test/kind");
    await v.setFamilyName("Lovelace");
    expect(
      findLiteralCall(v.uri, "http://www.w3.org/2006/vcard/ns#family-name", "Lovelace")
    ).toBeDefined();
  });

  it("setEmail inserts a vcard:hasEmail triple prefixed with mailto:", async () => {
    const v = new vcardKind(cs, "http://example.test/kind");
    await v.setEmail("ada@example.test");
    expect(cs.insertTriple).toHaveBeenCalledWith(
      v.uri,
      "http://www.w3.org/2006/vcard/ns#hasEmail",
      "mailto:ada@example.test"
    );
  });
});
