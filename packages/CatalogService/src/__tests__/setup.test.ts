import "jest-fetch-mock";
import {
  CatalogService,
  DCATCatalog,
  DCATDataset,
  DCATDataService,
  setup,
  MockSet,
} from "../index";
import { makeStatic } from "./utils/makeStatic";
import { StartedDockerComposeEnvironment } from "testcontainers";
import { setupContainer } from "./utils/setupContainer";
import { formatDataAsArray } from "./utils/formatDataAsArray";
import { SEC } from "../utils/constants";

// QUESTION Why does order of result change when I incr. number?
const testDefaultNamespace = "http://telicent.io/data/";
const cat1Uri = `${testDefaultNamespace}cat1`;
const dataset1Uri = `${testDefaultNamespace}dataset1`;
const dataservice1Uri = `${testDefaultNamespace}dataservice1`;
const triplestoreUri = "http://localhost:3030/";
const initialTripleCount = 11;
const catalogServiceOptions = { triplestoreUri, config: { NO_WARNINGS: true } };

const describeOrSkip = process.env.DO_TEST_CONTAINERS
  ? describe
  : describe.skip;

  const beforeAllOrSkip = process.env.DO_TEST_CONTAINERS
  ? beforeAll
  : console.log;
  const afterAllOrSkip = process.env.DO_TEST_CONTAINERS
  ? afterAll
  : console.log;
  const afterEachOrSkip = process.env.DO_TEST_CONTAINERS
  ? afterEach
  : console.log;

describeOrSkip("CatalogService", () => {
  let environment: StartedDockerComposeEnvironment;
  let catalogService: CatalogService;

  beforeAllOrSkip(async () => {
    ({ catalogService, environment } = await setupContainer(
      catalogServiceOptions
    ));
  }, 60 * SEC);

  afterAllOrSkip(async () => {
    await environment.down({ removeVolumes: true });
  }, 60 * SEC);

  afterEachOrSkip(async () => {
    await catalogService.runUpdate(["DELETE WHERE {?s ?p ?o }"]); //clear the dataset
  }, 60 * SEC);

  it(
    `setup() should have added the expected amount of triples: ${initialTripleCount}`,
    async () => {
      await setup({
        ...catalogServiceOptions,
        mockSet: MockSet.SIMPLE,
        /**
         * WARNING Re-using the same service causes problems. Unsure why
         * See https://telicent.atlassian.net/browse/TELFE-787
         */
        // catalogService,
      });
      const query = `SELECT ?s ?p ?o WHERE { ?s ?p ?o }`;
      const data = await catalogService.runQuery(query);
      expect(formatDataAsArray(makeStatic(data.results).bindings))
        .toMatchInlineSnapshot(`
        [
          "s                                    | p                                               | o",
          "http://telicent.io/data/dataset1     | http://purl.org/dc/terms/description            | Q1 2021 Cornwall incident reports dataset in CSV format. H…",
          "http://telicent.io/data/dataset1     | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Dataset",
          "http://telicent.io/data/dataset1     | http://purl.org/dc/terms/creator                | Kiki Sato",
          "http://telicent.io/data/dataset1     | http://purl.org/dc/terms/title                  | Dataset: Q1 2021",
          "http://telicent.io/data/dataset1     | http://purl.org/dc/terms/rights                 | Effective Date: 25/10/20241.      1. Introduction      This agency is committed to ensuring the security and confidentiality of the personal and sensitive data we handle. This policy outlines the procedures and responsibilities for managing and protecting data to comply with relevant laws and regulations.      2. Purpose      The purpose of this policy is to:Ensure the proper handling, protection, and use of data.Comply with applicable data protection laws and regulations.Protect the privacy rights of individuals whose data we handle.      3. Scope      This policy applies to all employees, contractors, and third-party service providers of who have access to, or handle, data.      4. Data Collection      Lawful and Fair Collection: Data must be collected lawfully and fairly, and only for specified, explicit, and legitimate purposes.Consent: Where applicable, data subjects must provide informed consent for the collection and processing of their data.      5. Data Use      Purpose Limitation: Data must be used only for the purposes for which it was collected and not further processed in a manner incompatible with those purposes.Data Minimization: Only the minimum necessary data should be collected and processed.      6. Data Storage      Secure Storage: Data must be stored securely to prevent unauthorized access, loss, or damage. This includes physical and electronic storage measures.Retention Period: Data must be retained only for as long as necessary to fulfill the purposes for which it was collected, or as required by law.      For questions or concerns about this policy or data protection practices, contact John Smiley at 0394 300498.      Approved by:John Smiley   Head of Data Capture   The agency      25/03/2024",
          "http://telicent.io/data/dataset1     | http://purl.org/dc/terms/modified               | 2021-4-5",
          "http://telicent.io/data/dataset1     | http://purl.org/dc/terms/accessRights           | Damir Sato",
          "http://telicent.io/data/dataset1     | http://purl.org/dc/terms/published              | ######## makeStatic() ########",
          "http://telicent.io/data/catalog1     | http://purl.org/dc/terms/description            | 2020 Royal Engineers’ Cornwall focused data catalog. Inclu…",
          "http://telicent.io/data/catalog1     | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Catalog",
          "http://telicent.io/data/catalog1     | http://www.w3.org/ns/dcat#dataset               | http://telicent.io/data/dataset1",
          "http://telicent.io/data/catalog1     | http://www.w3.org/ns/dcat#service               | http://telicent.io/data/dataservice1",
          "http://telicent.io/data/catalog1     | http://purl.org/dc/terms/creator                | Mario Giacomelli",
          "http://telicent.io/data/catalog1     | http://purl.org/dc/terms/title                  | Catalog: Cornwall Data",
          "http://telicent.io/data/catalog1     | http://purl.org/dc/terms/rights                 | Effective Date: 25/10/20241.      1. Introduction      This agency is committed to ensuring the security and confidentiality of the personal and sensitive data we handle. This policy outlines the procedures and responsibilities for managing and protecting data to comply with relevant laws and regulations.      2. Purpose      The purpose of this policy is to:Ensure the proper handling, protection, and use of data.Comply with applicable data protection laws and regulations.Protect the privacy rights of individuals whose data we handle.      3. Scope      This policy applies to all employees, contractors, and third-party service providers of who have access to, or handle, data.      4. Data Collection      Lawful and Fair Collection: Data must be collected lawfully and fairly, and only for specified, explicit, and legitimate purposes.Consent: Where applicable, data subjects must provide informed consent for the collection and processing of their data.      5. Data Use      Purpose Limitation: Data must be used only for the purposes for which it was collected and not further processed in a manner incompatible with those purposes.Data Minimization: Only the minimum necessary data should be collected and processed.      6. Data Storage      Secure Storage: Data must be stored securely to prevent unauthorized access, loss, or damage. This includes physical and electronic storage measures.Retention Period: Data must be retained only for as long as necessary to fulfill the purposes for which it was collected, or as required by law.      For questions or concerns about this policy or data protection practices, contact John Smiley at 0394 300498.      Approved by:John Smiley   Head of Data Capture   The agency      25/03/2024",
          "http://telicent.io/data/catalog1     | http://purl.org/dc/terms/modified               | 2023-6-1",
          "http://telicent.io/data/catalog1     | http://purl.org/dc/terms/accessRights           | James Hardacre",
          "http://telicent.io/data/catalog1     | http://purl.org/dc/terms/published              | ######## makeStatic() ########",
          "http://telicent.io/data/dataservice1 | http://purl.org/dc/terms/description            | Cornwall Wind Detector data via JSON REST API. Real-time, …",
          "http://telicent.io/data/dataservice1 | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#DataService",
          "http://telicent.io/data/dataservice1 | http://purl.org/dc/terms/creator                | Oleg Novak",
          "http://telicent.io/data/dataservice1 | http://purl.org/dc/terms/title                  | Service: Wind Feed",
          "http://telicent.io/data/dataservice1 | http://purl.org/dc/terms/rights                 | Effective Date: 25/10/20241.      1. Introduction      This agency is committed to ensuring the security and confidentiality of the personal and sensitive data we handle. This policy outlines the procedures and responsibilities for managing and protecting data to comply with relevant laws and regulations.      2. Purpose      The purpose of this policy is to:Ensure the proper handling, protection, and use of data.Comply with applicable data protection laws and regulations.Protect the privacy rights of individuals whose data we handle.      3. Scope      This policy applies to all employees, contractors, and third-party service providers of who have access to, or handle, data.      4. Data Collection      Lawful and Fair Collection: Data must be collected lawfully and fairly, and only for specified, explicit, and legitimate purposes.Consent: Where applicable, data subjects must provide informed consent for the collection and processing of their data.      5. Data Use      Purpose Limitation: Data must be used only for the purposes for which it was collected and not further processed in a manner incompatible with those purposes.Data Minimization: Only the minimum necessary data should be collected and processed.      6. Data Storage      Secure Storage: Data must be stored securely to prevent unauthorized access, loss, or damage. This includes physical and electronic storage measures.Retention Period: Data must be retained only for as long as necessary to fulfill the purposes for which it was collected, or as required by law.      For questions or concerns about this policy or data protection practices, contact John Smiley at 0394 300498.      Approved by:John Smiley   Head of Data Capture   The agency      25/03/2024",
          "http://telicent.io/data/dataservice1 | http://purl.org/dc/terms/modified               | 2023-2-3",
          "http://telicent.io/data/dataservice1 | http://purl.org/dc/terms/accessRights           | James Hardacre",
          "http://telicent.io/data/dataservice1 | http://purl.org/dc/terms/published              | ######## makeStatic() ########",
        ]
      `);
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

      const cat = await DCATCatalog.createAsync(
        catalogService,
        cat1Uri,
        TITLES.cat1
      );
      expect(cat.statement).toMatchInlineSnapshot(`undefined`);
      // REQUIREMENT 6.1 Search by dataResourceFilter: selected data-resources
      const d1 = await DCATDataset.createAsync(
        catalogService,
        dataset1Uri,
        TITLES.dataset1
      );
      await cat.addOwnedDataset(d1);

      const ds1 = await DCATDataService.createAsync(
        catalogService,
        dataservice1Uri,
        TITLES.dataservice1
      );
      // Required https://telicent.atlassian.net/browse/TELFE-788
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await cat.addOwnedService(ds1);

      const data = await catalogService.runQuery(
        `SELECT ?s ?p ?o WHERE { ?s ?p ?o }`
      );
      expect(formatDataAsArray(makeStatic(data.results).bindings))
        .toMatchInlineSnapshot(`
        [
          "s                                    | p                                               | o",
          "http://telicent.io/data/cat1         | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Catalog",
          "http://telicent.io/data/cat1         | http://www.w3.org/ns/dcat#dataset               | http://telicent.io/data/dataset1",
          "http://telicent.io/data/cat1         | http://www.w3.org/ns/dcat#service               | http://telicent.io/data/dataservice1",
          "http://telicent.io/data/cat1         | http://purl.org/dc/terms/title                  | cat1",
          "http://telicent.io/data/dataset1     | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Dataset",
          "http://telicent.io/data/dataset1     | http://purl.org/dc/terms/title                  | dataset1",
          "http://telicent.io/data/dataservice1 | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#DataService",
          "http://telicent.io/data/dataservice1 | http://purl.org/dc/terms/title                  | dataservice1",
        ]
      `);
      const ownedResources = await cat.getOwnedResources();
      expect(ownedResources.map((el) => el.uri)).toEqual([
        `http://telicent.io/data/${TITLES.dataset1}`,
        `http://telicent.io/data/${TITLES.dataservice1}`,
      ]);
    },
    60 * SEC
  );

  // TODO: Fix test
  // WHEN: When code is more stable; Non-urgent as basically doubling-up existing tests.
  // WHY: Test frequently breaks in the course of refactoring
  it.skip(
    "Specialised getOwned___ methods should return correct items",
    async () => {
      const cat = await DCATCatalog.createAsync(
        catalogService,
        cat1Uri,
        "cat1"
      );
      const catChild = await DCATCatalog.createAsync(
        catalogService,
        `${testDefaultNamespace}catChild`,
        "catChild"
      );
      await cat.addOwnedCatalog(catChild);

      // REQUIREMENT 6.1 Search by dataResourceFilter: selected data-resources
      const d1 = await DCATDataset.createAsync(
        catalogService,
        dataset1Uri,
        "dataset1"
      );
      await cat.addOwnedDataset(d1);
      const ds1 = await DCATDataService.createAsync(
        catalogService,
        dataservice1Uri,
        "dataservice1"
      );
      await cat.addOwnedService(ds1);
      const data = await catalogService.runQuery(
        `SELECT ?s ?p ?o WHERE { ?s ?p ?o }`
      );

      expect(formatDataAsArray(makeStatic(data.results).bindings))
        .toMatchInlineSnapshot(`
        [
          "s                                    | p                                               | o",
          "http://telicent.io/data/cat1         | http://www.w3.org/ns/dcat#dataset               | http://telicent.io/data/dataset1",
          "http://telicent.io/data/cat1         | http://www.w3.org/ns/dcat#service               | http://telicent.io/data/dataservice1",
          "http://telicent.io/data/cat1         | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Catalog",
          "http://telicent.io/data/cat1         | http://purl.org/dc/terms/title                  | cat1",
          "http://telicent.io/data/cat1         | http://www.w3.org/ns/dcat#catalog               | http://telicent.io/data/catChild",
          "http://telicent.io/data/catChild     | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Catalog",
          "http://telicent.io/data/catChild     | http://purl.org/dc/terms/title                  | catChild",
          "http://telicent.io/data/dataservice1 | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#DataService",
          "http://telicent.io/data/dataservice1 | http://purl.org/dc/terms/title                  | dataservice1",
          "http://telicent.io/data/dataset1     | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Dataset",
          "http://telicent.io/data/dataset1     | http://purl.org/dc/terms/title                  | dataset1",
        ]
      `);

      const ownedDatasets = await cat.getOwnedDatasets();
      expect(ownedDatasets.map((el) => el.uri)).toMatchInlineSnapshot(`
        [
          "http://telicent.io/data/dataset1",
        ]
      `);

      const ownedDataServices = await cat.getOwnedServices();
      expect(ownedDataServices.map((el) => el.uri)).toMatchInlineSnapshot(`
        [
          "http://telicent.io/data/dataservice1",
        ]
      `);

      const ownedCatalogs = await cat.getOwnedCatalogs();
      expect(ownedCatalogs.map((el) => el.uri)).toMatchInlineSnapshot(`
        [
          "http://telicent.io/data/catChild",
        ]
      `);
    },
    15 * SEC
  );
});
