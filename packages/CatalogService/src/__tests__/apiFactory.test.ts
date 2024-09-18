import "jest-fetch-mock";
import { CatalogService, setup } from "../../index";
import { Api } from "../apiFactory/apiFactory";
import { StartedDockerComposeEnvironment } from "testcontainers";
import { setupContainer } from "./utils/setupContainer";
import { SEC } from "../constants";
import { shorten } from "../utils/shorten";

describe("apiFactory", () => {
  let environment: StartedDockerComposeEnvironment;
  let api: Api;
  beforeAll(async () => {
    ({ environment } = await setupContainer());
    api = await setup({ hostName: "http://localhost:3030/" });
  }, 60 * SEC);
  afterAll(async () => {
    await Promise.all(api._service.workAsync);
    await environment.down({ removeVolumes: true });
  }, 60 * SEC);
  it(
    "inits",
    () => {
      expect(api).toBeDefined();
      expect(api.search).toBeDefined();
    },
    10 * SEC
  );
  it(
    "can search",
    async () => {
      const res = await api.search({
        dataResourceFilters: ["all"],
        searchText: "",
      });
      const resMasked = res.map((el) => ({
        ...el,
        publishDate: el.publishDate.endsWith("Z") ? "**" : el.publishDate,
        modified: el.modified.endsWith("Z") ? "**" : el.modified,
        rights: shorten(el.rights, 60),
      }));
      expect(resMasked).toMatchInlineSnapshot(`
        [
          {
            "accessRights": "Damir Sato",
            "creator": "Kiki Sato",
            "description": "Q1 2021 Cornwall incident reports dataset in CSV format. Heavily redacted, supporting public safety analysis and policy development.",
            "id": "http://telicent.io/data/dataset1",
            "modified": "2021-4-5",
            "publishDate": "2021-4-5",
            "rights": "Effective Date: 25/10/20241.      1. Introduction      Thi…",
            "title": "Dataset: Q1 2021",
            "type": "Dataset",
            "userHasAccess": false,
          },
          {
            "accessRights": "James Hardacre",
            "creator": "Mario Giacomelli",
            "description": "2020 Royal Engineers’ Cornwall focused data catalog. Includes real-time IoT telemetry and historical archives for environmental and technological research.",
            "id": "http://telicent.io/data/catalog1",
            "modified": "2023-6-1",
            "publishDate": "2020-3-12",
            "rights": "Effective Date: 25/10/20241.      1. Introduction      Thi…",
            "title": "Catalog: Cornwall Data",
            "type": "Catalog",
            "userHasAccess": false,
          },
          {
            "accessRights": "James Hardacre",
            "creator": "Oleg Novak",
            "description": "Cornwall Wind Detector data via JSON REST API. Real-time, API-token controlled access for analysis by environmental scientists and meteorologists.",
            "id": "http://telicent.io/data/dataservice1",
            "modified": "2023-2-3",
            "publishDate": "2023-2-3",
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
