import "jest-fetch-mock";
import { CatalogService, setup } from "../index";
import { Api } from "../apiFactory/apiFactory";
import { StartedDockerComposeEnvironment } from "testcontainers";
import { setupContainer } from "./utils/setupContainer";
import { SEC } from "../utils/constants";

// !TODO Fix test
// HOW
//  1. First version - be able to fully disable "ByCola" logic
//    (as you default "ByBailey")
// WHEN https://telicent.atlassian.net/browse/TELFE-807
describe("apiFactory", () => {
  let environment: StartedDockerComposeEnvironment;
  let api: Api;
  let catalogService: CatalogService;
  const triplestoreUri = "http://localhost:3030/";
  const catalogServiceOptions = {
    triplestoreUri,
    config: { NO_WARNINGS: true },
  };
  beforeAll(async () => {
    ({ environment, catalogService } = await setupContainer(
      catalogServiceOptions
    ));
    api = await setup(catalogServiceOptions);
    await new Promise((resolve) => setTimeout(resolve, 2 * 1000));
  }, 60 * SEC);
  afterAll(async () => {
    await environment.down({ removeVolumes: true });
  }, 60 * SEC);
  it(
    "inits",
    async () => {
      expect(api).toBeDefined();
      expect(api.search).toBeDefined();
      expect(
        (await catalogService.runQuery(`SELECT ?s ?p ?o WHERE { ?s ?p ?o }`))
          .results.bindings.length
      ).toMatchInlineSnapshot(`26`);
    },
    10 * SEC
  );
  // This is not correct, the example data is not correctly structured
  // Test covered in searchFactory.test.ts
  it.skip(
    "can search",
    async () => {
      const res = await api.search({
        dataResourceFilters: ["all"],
        searchText: "data",
      }, {});
      expect(res).toMatchInlineSnapshot(`
        [
          {
            "accessRights": "James Hardacre",
            "creator": "Mario Giacomelli",
            "description": "2020 Royal Engineers’ Cornwall focused data catalog. Includes real-time IoT telemetry and historical archives for environmental and technological research.",
            "id": "http://telicent.io/data/catalog1",
            "modified": "-",
            "publishDate": "-",
            "rights": "Effective Date: 25/10/20241.      1. Introduction      Thi…",
            "title": "Catalog: Cornwall Data",
            "type": "http://www.w3.org/ns/dcat#DataService",
            "uri": "http://telicent.io/data/dataservice1",
          },
          {
            "accessRights": "Damir Sato",
            "creator": "Kiki Sato",
            "description": "Q1 2021 Cornwall incident reports dataset in CSV format. Heavily redacted, supporting public safety analysis and policy development.",
            "id": "http://telicent.io/data/dataset1",
            "modified": "-",
            "publishDate": "-",
            "rights": "Effective Date: 25/10/20241.      1. Introduction      Thi…",
            "title": "Dataset: Q1 2021",
            "type": "Dataset",
            "userHasAccess": false,
          },
          {
            "accessRights": "James Hardacre",
            "creator": "Oleg Novak",
            "description": "Cornwall Wind Detector data via JSON REST API. Real-time, API-token controlled access for analysis by environmental scientists and meteorologists.",
            "id": "http://telicent.io/data/dataservice1",
            "modified": "-",
            "publishDate": "-",
            "rights": "Effective Date: 25/10/20241.      1. Introduction      Thi…",
            "title": "Service: Wind Feed",
            "type": "DataService",
            "userHasAccess": false,
          },
        ]
      `);
    },
    10 * SEC
  );
});
