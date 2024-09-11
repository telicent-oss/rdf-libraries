import "jest-fetch-mock";
import { setup } from "../index";
import { Api } from "../api/DataCatalogueFrontend";

let api: Api;

describe("DataCatalogueFrontend", () => {
  beforeAll(async () => {
    api = await setup({ hostName: "http://localhost:3030/" });
  });
  afterAll(async () => {
    await Promise.all(api._service.workAsync);
  });
  it("inits", () => {
    expect(api).toBeDefined();
    expect(api.search).toBeDefined();
  });
  it("can search", async () => {
    const res = await api.search({
      dataResourceFilters: ["all"],
      searchText: "",
    });
    const resMasked = res.map((el) => ({
      ...el,
      publishDate: el.publishDate.endsWith("Z")
        ? "**" // el.publishDate.substring(1, 21) // trim ISOString
        : el.publishDate,
    }));
    expect(resMasked).toMatchInlineSnapshot(`
      [
        {
          "creator": "Oleg Novak",
          "description": "Cornwall Wind Detector data via JSON REST API. Real-time, API-token controlled access for analysis by environmental scientists and meteorologists.",
          "id": "http://telicent.io/data/dataservice1",
          "owner": "James Hardacre",
          "publishDate": "2023-2-3",
          "title": "Service: Wind Feed",
          "type": "DataService",
          "userHasAccess": true,
        },
        {
          "creator": "Mario Giacomelli",
          "description": "2020 Royal Engineers’ Cornwall focused data catalog. Includes real-time IoT telemetry and historical archives for environmental and technological research.",
          "id": "http://telicent.io/data/catalog1",
          "owner": "James Hardacre",
          "publishDate": "2020-3-12",
          "title": "Catalog: Cornwall Data",
          "type": "Catalog",
          "userHasAccess": true,
        },
        {
          "creator": "Kiki Sato",
          "description": "Q1 2021 Cornwall incident reports dataset in CSV format. Heavily redacted, supporting public safety analysis and policy development.",
          "id": "http://telicent.io/data/dataset1",
          "owner": "Damir Sato",
          "publishDate": "2021-4-5",
          "title": "Dataset: Q1 2021",
          "type": "Dataset",
          "userHasAccess": false,
        },
      ]
    `);
  });
});
