import { prepareWritebackFactory } from "./prepareWritebackFactory";
import { CatalogService, DCATResource } from "../../../index";

const NO_WARNINGS = { config: { NO_WARNINGS: true } };

describe("prepareWritebackFactory", () => {
  it("maps each resource returned by getDCATResource through toUIRepresentation", async () => {
    const cs = new CatalogService({ writeEnabled: false, ...NO_WARNINGS });

    const a = new DCATResource(cs, "http://example.test/A", "Alpha");
    const b = new DCATResource(cs, "http://example.test/B", "Beta");
    jest.spyOn(a, "toUIRepresentation").mockResolvedValue({ uri: a.uri, title: "Alpha" });
    jest.spyOn(b, "toUIRepresentation").mockResolvedValue({ uri: b.uri, title: "Beta" });
    jest.spyOn(cs, "getDCATResource").mockResolvedValue([a, b]);

    const prepareWriteback = prepareWritebackFactory(cs);
    const out = await prepareWriteback({ resourceUri: "http://example.test/A" });

    expect(cs.getDCATResource).toHaveBeenCalledWith({
      resourceUri: "http://example.test/A",
    });
    expect(out).toEqual([
      { uri: a.uri, title: "Alpha" },
      { uri: b.uri, title: "Beta" },
    ]);
  });

  it("returns [] when getDCATResource returns no rows", async () => {
    const cs = new CatalogService({ writeEnabled: false, ...NO_WARNINGS });
    jest.spyOn(cs, "getDCATResource").mockResolvedValue([]);

    const prepareWriteback = prepareWritebackFactory(cs);
    const out = await prepareWriteback({ resourceUri: "http://example.test/none" });
    expect(out).toEqual([]);
  });
});
