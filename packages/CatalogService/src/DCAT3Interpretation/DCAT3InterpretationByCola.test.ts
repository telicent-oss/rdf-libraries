import { ACLEDTriples } from "./__mocks__/argsForACLEDCatalog";
import { CatalogService } from "../../index";

describe("DCAT3InterpretationByCola", () => {
  const service = new CatalogService({ writeEnabled: true });
  const interpretation = service.interpretation;
  it("info", () => {
    expect(service.dcTitle).toMatchInlineSnapshot(
      `"http://purl.org/dc/terms/title"`
    );
  });
  it("b0", async () => {
    const id = "b0";
    expect({
      published: interpretation.dcPublishedFromTriples(id, ACLEDTriples),
      title: interpretation.dcTitleFromTriples(id, ACLEDTriples),
    }).toMatchInlineSnapshot(`
      {
        "published": undefined,
        "title": "ACLED Terms of Use & Attribution Policy - 17 October 2023",
      }
    `);
  });

  it("http://telicent.io/catalog#acled_data_set_dataset", async () => {
    const id = "http://telicent.io/catalog#acled_data_set_dataset";
    expect({
      published: interpretation.dcPublishedFromTriples(id, ACLEDTriples, {
        assert: true,
      }),
      title: interpretation.dcTitleFromTriples(id, ACLEDTriples),
      creatorName: interpretation.creatorNameFromTriples(id, ACLEDTriples),
      creatorEmail: interpretation.creatorEmailFromTriples(id, ACLEDTriples),
    }).toMatchInlineSnapshot(`
      {
        "creatorEmail": "admin@acleddata.com",
        "creatorName": "Armed Conflict Location & Event Data Project (ACLED)",
        "published": "2024-09-13T07:00:00+00:00",
        "title": "acled",
      }
    `);
  });
});
