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
  it("b0 title", async () => {
    expect(
      interpretation.dcTitleFromTriples("b0", ACLEDTriples)
    ).toMatchInlineSnapshot(
      `"ACLED Terms of Use & Attribution Policy - 17 October 2023"`
    );
  });

  it("http://telicent.io/catalog#acled_data_set_dataset title", async () => {
    expect(
      interpretation.dcTitleFromTriples(
        "http://telicent.io/catalog#acled_data_set_dataset",
        ACLEDTriples
      )
    ).toMatchInlineSnapshot(`"acled"`);
  });
});
