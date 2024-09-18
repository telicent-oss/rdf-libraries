import "jest-fetch-mock";
import {
  CatalogService,
  DCATCatalog,
  DCATDataset,
  DCATDataService,
  setup,
  MockSet,
} from "../../index";
import { makeStatic } from "./utils/makeStatic";
import { StartedDockerComposeEnvironment } from "testcontainers";
import { setupContainer } from "./utils/setupContainer";
import { formatDataAsArray } from "./utils/formatDataAsArray";
import { SEC } from "../constants";

// QUESTION Why does order of result change when I incr. number?
const testDefaultNamespace = "http://telicent.io/data/";
const cat1 = `${testDefaultNamespace}cat1`;
const dataset1 = `${testDefaultNamespace}dataset1`;
const dataservice1 = `${testDefaultNamespace}dataservice1`;

const initialTripleCount = 11;

describe("CatalogService", () => {
  let environment: StartedDockerComposeEnvironment;
  let catalogService: CatalogService;

  beforeAll(async () => {
    ({ catalogService, environment } = await setupContainer());
  }, 60 * SEC);

  afterAll(async () => {
    await Promise.all(catalogService.workAsync);
    await environment.down({ removeVolumes: true });
  }, 60 * SEC);

  afterEach(async () => {
    await catalogService.runUpdate(["DELETE WHERE {?s ?p ?o }"]); //clear the dataset
  }, 60 * SEC);

  it(
    `setup() should have added the expected amount of triples: ${initialTripleCount}`,
    async () => {
      const api = await setup({
        hostName: "http://localhost:3030/",
        mockSet: MockSet.SIMPLE,
      });
      const query = `SELECT ?s ?p ?o WHERE { ?s ?p ?o }`;
      const data = await catalogService.runQuery(query);
      expect(formatDataAsArray(makeStatic(data.results).bindings))
        .toMatchInlineSnapshot(`
        [
          "s                                    | p                                               | o",
          "http://telicent.io/data/dataservice1 | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#DataService",
          "http://telicent.io/data/dataservice1 | http://purl.org/dc/terms/creator                | Oleg Novak",
          "http://telicent.io/data/dataservice1 | http://purl.org/dc/terms/title                  | Service: Wind Feed",
          "http://telicent.io/data/dataservice1 | http://purl.org/dc/terms/published              | ######## makeStatic() ########",
          "http://telicent.io/data/dataservice1 | http://purl.org/dc/terms/description            | Cornwall Wind Detector data via JSON REST API. Real-time, API-token controlled access for analysis by environmental scientists and meteorologists.",
          "http://telicent.io/data/dataservice1 | http://purl.org/dc/terms/rights                 | James Hardacre",
          "http://telicent.io/data/catalog1     | http://www.w3.org/ns/dcat#Dataset               | http://telicent.io/data/dataset1",
          "http://telicent.io/data/catalog1     | http://www.w3.org/ns/dcat#DataService           | http://telicent.io/data/dataservice1",
          "http://telicent.io/data/catalog1     | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Catalog",
          "http://telicent.io/data/catalog1     | http://purl.org/dc/terms/creator                | Mario Giacomelli",
          "http://telicent.io/data/catalog1     | http://purl.org/dc/terms/title                  | Catalog: Cornwall Data",
          "http://telicent.io/data/catalog1     | http://purl.org/dc/terms/published              | ######## makeStatic() ########",
          "http://telicent.io/data/catalog1     | http://purl.org/dc/terms/description            | 2020 Royal Engineers’ Cornwall focused data catalog. Includes real-time IoT telemetry and historical archives for environmental and technological research.",
          "http://telicent.io/data/catalog1     | http://purl.org/dc/terms/rights                 | James Hardacre",
          "http://telicent.io/data/dataset1     | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Dataset",
          "http://telicent.io/data/dataset1     | http://purl.org/dc/terms/creator                | Kiki Sato",
          "http://telicent.io/data/dataset1     | http://purl.org/dc/terms/title                  | Dataset: Q1 2021",
          "http://telicent.io/data/dataset1     | http://purl.org/dc/terms/published              | ######## makeStatic() ########",
          "http://telicent.io/data/dataset1     | http://purl.org/dc/terms/description            | Q1 2021 Cornwall incident reports dataset in CSV format. Heavily redacted, supporting public safety analysis and policy development.",
          "http://telicent.io/data/dataset1     | http://purl.org/dc/terms/rights                 | Damir Sato",
        ]
      `);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    },
    60 * SEC
  );

  it(
    "Should find catalog-owned items",
    async () => {
      const TITLES = {
        cat1: "cat1",
        dataset1: "dataset1",
        dataservice1: "dataservice1",
      };
      const cat = new DCATCatalog(catalogService, cat1, TITLES.cat1);
      await Promise.all(cat.workAsync); // TODO remove; Just paranoid
      expect(cat.statement).toMatchInlineSnapshot(`undefined`);
      // REQUIREMENT 6.1 Search by dataResourceFilter: selected data-resources
      const d1 = new DCATDataset(catalogService, dataset1, TITLES.dataset1);
      await Promise.all(d1.workAsync); // TODO remove; Just paranoid
      await cat.addOwnedDataset(d1);
      await Promise.all(d1.workAsync);
      await Promise.all(cat.workAsync);

      const ds1 = new DCATDataService(
        catalogService,
        dataservice1,
        TITLES.dataservice1
      );
      await Promise.all(ds1.workAsync); // TODO remove; Just paranoid
      await cat.addOwnedService(ds1);
      await Promise.all(cat.workAsync);
      await Promise.all(ds1.workAsync);
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // await new Promise(resolve => setTimeout(resolve, 1000))
      const data = await catalogService.runQuery(
        `SELECT ?s ?p ?o WHERE { ?s ?p ?o }`
      );
      expect(formatDataAsArray(makeStatic(data.results).bindings))
        .toMatchInlineSnapshot(`
        [
          "s                                    | p                                               | o",
          "http://telicent.io/data/cat1         | http://www.w3.org/ns/dcat#Dataset               | http://telicent.io/data/dataset1",
          "http://telicent.io/data/cat1         | http://www.w3.org/ns/dcat#DataService           | http://telicent.io/data/dataservice1",
          "http://telicent.io/data/cat1         | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Catalog",
          "http://telicent.io/data/cat1         | http://purl.org/dc/terms/title                  | cat1",
          "http://telicent.io/data/cat1         | http://purl.org/dc/terms/published              | ######## makeStatic() ########",
          "http://telicent.io/data/dataservice1 | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#DataService",
          "http://telicent.io/data/dataservice1 | http://purl.org/dc/terms/title                  | dataservice1",
          "http://telicent.io/data/dataservice1 | http://purl.org/dc/terms/published              | ######## makeStatic() ########",
          "http://telicent.io/data/dataset1     | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Dataset",
          "http://telicent.io/data/dataset1     | http://purl.org/dc/terms/title                  | dataset1",
          "http://telicent.io/data/dataset1     | http://purl.org/dc/terms/published              | ######## makeStatic() ########",
        ]
      `);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const ownedResources = await cat.getOwnedResources();
      await Promise.all(cat.workAsync);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      expect(ownedResources.map((el) => el.uri)).toEqual([
        `http://telicent.io/data/${TITLES.dataset1}`,
        `http://telicent.io/data/${TITLES.dataservice1}`,
      ]);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    },
    60 * SEC
  );

  // TODO: Fix test
  // WHEN: When code is more stable; Non-urgent as basically doubling-up existing tests.
  // WHY: Test frequently breaks in the course of refactoring
  it.skip(
    "Specialised getOwned___ methods should return correct items",
    async () => {
      const cat = new DCATCatalog(catalogService, cat1, "cat1");
      const catChild = new DCATCatalog(
        catalogService,
        `${testDefaultNamespace}catChild`,
        "catChild"
      );
      await cat.addOwnedCatalog(catChild);
      await Promise.all(cat.workAsync);
      await Promise.all(catChild.workAsync);

      await Promise.all(cat.workAsync); // TODO remove; Just paranoid
      // REQUIREMENT 6.1 Search by dataResourceFilter: selected data-resources
      const d1 = new DCATDataset(catalogService, dataset1, "dataset1");
      await Promise.all(d1.workAsync); // TODO remove; Just paranoid
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await cat.addOwnedDataset(d1);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await Promise.all(d1.workAsync);
      await Promise.all(cat.workAsync);
      await Promise.all(d1.service.workAsync);

      const ds1 = new DCATDataService(
        catalogService,
        dataservice1,
        "dataservice1"
      );
      await Promise.all(ds1.workAsync); // TODO remove; Just paranoid
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await cat.addOwnedService(ds1);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await Promise.all(cat.workAsync);
      await Promise.all(ds1.workAsync);
      await Promise.all(ds1.service.workAsync);
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const data = await catalogService.runQuery(
        `SELECT ?s ?p ?o WHERE { ?s ?p ?o }`
      );
      await new Promise((resolve) => setTimeout(resolve, 2000));

      expect(formatDataAsArray(makeStatic(data.results).bindings))
        .toMatchInlineSnapshot(`
        [
          "s                                    | p                                               | o",
          "http://telicent.io/data/cat1         | http://www.w3.org/ns/dcat#Dataset               | http://telicent.io/data/dataset1",
          "http://telicent.io/data/cat1         | http://www.w3.org/ns/dcat#DataService           | http://telicent.io/data/dataservice1",
          "http://telicent.io/data/cat1         | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Catalog",
          "http://telicent.io/data/cat1         | http://purl.org/dc/terms/title                  | cat1",
          "http://telicent.io/data/cat1         | http://www.w3.org/ns/dcat#Catalog               | http://telicent.io/data/catChild",
          "http://telicent.io/data/cat1         | http://purl.org/dc/terms/published              | ######## makeStatic() ########",
          "http://telicent.io/data/catChild     | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Catalog",
          "http://telicent.io/data/catChild     | http://purl.org/dc/terms/title                  | catChild",
          "http://telicent.io/data/catChild     | http://purl.org/dc/terms/published              | ######## makeStatic() ########",
          "http://telicent.io/data/dataservice1 | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#DataService",
          "http://telicent.io/data/dataservice1 | http://purl.org/dc/terms/title                  | dataservice1",
          "http://telicent.io/data/dataservice1 | http://purl.org/dc/terms/published              | ######## makeStatic() ########",
          "http://telicent.io/data/dataset1     | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Dataset",
          "http://telicent.io/data/dataset1     | http://purl.org/dc/terms/title                  | dataset1",
          "http://telicent.io/data/dataset1     | http://purl.org/dc/terms/published              | ######## makeStatic() ########",
        ]
      `);

      const ownedDatasets = await cat.getOwnedDatasets();
      await Promise.all(cat.workAsync);
      expect(ownedDatasets.map((el) => el.uri)).toMatchInlineSnapshot(`
        [
          "http://telicent.io/data/dataset1",
        ]
      `);

      const ownedDataServices = await cat.getOwnedServices();
      await Promise.all(cat.workAsync);
      expect(ownedDataServices.map((el) => el.uri)).toMatchInlineSnapshot(`
        [
          "http://telicent.io/data/dataservice1",
        ]
      `);

      const ownedCatalogs = await cat.getOwnedCatalogs();
      await Promise.all(cat.workAsync);
      expect(ownedCatalogs.map((el) => el.uri)).toMatchInlineSnapshot(`
        [
          "http://telicent.io/data/catChild",
        ]
      `);
    },
    15 * SEC
  );
});
