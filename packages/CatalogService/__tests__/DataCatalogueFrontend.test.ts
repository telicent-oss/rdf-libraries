import "jest-fetch-mock";
import { CatalogService, setup } from "../index";
import { apiFactory, Api } from "../api/DataCatalogueFrontend";
let api: Api;
describe("DataCatalogueFrontend", () => {
  beforeAll(async () => {
    api = await setup({ hostName: "http://localhost:3030/" });
  });
  it("inits", () => {
    expect(api).toBeDefined();
    expect(api.search).toBeDefined();
  });
  it("can search", async () => {
    expect(await api.search({ dataResourceFilters: ["all"], searchText: "" }))
      .toMatchInlineSnapshot(`
      [
        {
          "description": "",
          "id": "http://telicent.io/data/cat1",
          "title": "Catalog One",
          "type": "Catalog",
        },
        {
          "description": "",
          "id": "http://telicent.io/data/dataservice1",
          "title": "Data Service One",
          "type": "DataService",
        },
        {
          "description": "",
          "id": "http://telicent.io/data/dataset1",
          "title": "Dataset One",
          "type": "Dataset",
        },
      ]
    `);
  });
});
