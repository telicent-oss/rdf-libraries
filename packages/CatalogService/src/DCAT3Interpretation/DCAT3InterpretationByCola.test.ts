import { ACLEDTriples } from "./__mocks__/argsForACLEDCatalog";
import { CatalogService } from "../../index";
import { result } from "../apiFactory/operations/mockData/fromFusekiAfterKafka2";
import { systemIntergrationRealData } from "./__mocks__/systemIntergrationRealData";
import { shorten } from "../utils/shorten";

describe("DCAT3InterpretationByCola: ACLEDTriples", () => {
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

describe("DCAT3InterpretationByCola: fromFusekiAfterKafka2", () => {
  const triples = result.results.bindings;
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
      published: interpretation.dcPublishedFromTriples(id, triples),
      title: interpretation.dcTitleFromTriples(id, triples),
    }).toMatchInlineSnapshot(`
      {
        "published": undefined,
        "title": "ACLED Terms of Use & Attribution Policy - 17 October 2023",
      }
    `);
  });

  it("http://telicent.io/catalog#acled_data_set_dataset", async () => {
    const id = "http://telicent.io/catalog#acled_data_dataset";
    expect({
      published: interpretation.dcPublishedFromTriples(id, triples, {
        assert: true,
      }),
      title: interpretation.dcTitleFromTriples(id, triples),
      creatorName: interpretation.creatorNameFromTriples(id, triples),
      creatorEmail: interpretation.creatorEmailFromTriples(id, triples),
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

describe("DCAT3InterpretationByCola: systemIntergrationRealData", () => {
  const triples = systemIntergrationRealData;
  const service = new CatalogService({ writeEnabled: true });
  const interpretation = service.interpretation;
  const ID = {
    bbc: "http://telicent.io/catalog#95fd46da-7a61-4707-898f-49d4e2d73d4f_Dataset",
    acled: "http://telicent.io/catalog#acled_data_dataset",
  };
  it("titles", async () => {
    expect(
      [
        `bbc.title: ${interpretation.dcTitleFromTriples(ID.bbc, triples)}`,
        `acled.title: ${interpretation.dcTitleFromTriples(ID.acled, triples)}`,
        `bbc.rights: ${interpretation.rightsFromTriples(ID.bbc, triples)}`,
        `acled.rights: ${interpretation.rightsFromTriples(ID.acled, triples)}`,
      ].map(shorten)
    ).toMatchInlineSnapshot(`
      [
        "…",
        "…",
        "…",
        "a…",
      ]
    `);
  });
});
