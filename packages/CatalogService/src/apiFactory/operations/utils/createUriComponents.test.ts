import { createUriComponents } from "./createUriComponents";

describe("createUriComponents", () => {
  const base = "http://example.com/base#";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("builds deterministic URI when identifier is provided", async () => {
    const result = await createUriComponents({
      base,
      identifier: "  dataset-id  ",
      postfix: "_Dataset",
    });

    expect(result).toMatchInlineSnapshot(`
{
  "localName": "dataset-id",
  "postfix": "_Dataset",
  "uri": "http://example.com/base#dataset-id",
}
`);
  });

  it("generates UUID when identifier is absent", async () => {
    const result = await createUriComponents({
      base,
      postfix: "_Dataset",
    });

    expect(result.uuid).toEqual(expect.any(String));

    const { uuid, ...rest } = result;
    const id = rest.localName.replace(/_Dataset$/, "");
    const normalized = {
      ...rest,
      localName: rest.localName.replace(id, "<id>"),
      uri: rest.uri.replace(id, "<id>"),
    };

    expect(normalized).toMatchInlineSnapshot(`
{
  "localName": "<id>_Dataset",
  "postfix": "_Dataset",
  "uri": "http://example.com/base#<id>_Dataset",
}
`);
  });
});
