import "jest-fetch-mock"; // WARNING: fails if: import fetchMock from "jest-fetch-mock";
import { RDFTripleSchema } from "@telicent-oss/rdfservice/index";
import { transformRdfToTree } from "../apiFactory/operations/utils/transformRdfToTree";
import { enrichRdfTree } from "../apiFactory/operations/utils/enrichRdfTree";
import { Api } from "../apiFactory/apiFactory";
import { setup } from "../setup";
import { RDFResponseSchema } from "../apiFactory/operations/utils/common";
import { makeStatic } from "./utils/makeStatic";

import { setupContainer } from "./utils/setupContainer";
import { SEC } from "../constants";
import { formatDataAsArray } from "./utils/formatDataAsArray";
import { StartedDockerComposeEnvironment } from "testcontainers";
import { CatalogService, MockSet } from "../../index";

let api: Api;

const DATASET = "http://www.w3.org/ns/dcat#Dataset";
const SERVICE = "http://www.w3.org/ns/dcat#DataService";
const CATALOG = "http://www.w3.org/ns/dcat#Catalog";
const CONNECTIONS = [DATASET, SERVICE, CATALOG];

describe("transformRdfToTree: SIMPLE", () => {
  let catalogService: CatalogService;
  let environment: StartedDockerComposeEnvironment;
  beforeAll(async () => {
    try {
      ({ catalogService, environment } = await setupContainer());
      api = await setup({ catalogService });
    } catch (err) {
      console.error(err);
      throw err;
    }
  }, 60 * SEC);
  afterAll(async () => {
    await Promise.all(api._service.workAsync);
    await environment.down({ removeVolumes: true });
  }, 60 * SEC);
  it(
    "transformRdfToTree",
    async () => {
      const res = await api._service.runQuery(`
      SELECT ?s ?p ?o 
      WHERE { ?s ?p ?o }
    `);

      const triples = RDFResponseSchema.parse(res).results.bindings.map((el) =>
        RDFTripleSchema.parse(el)
      );

      const tree = transformRdfToTree({
        triples,
        edgePredicate: (triple) => CONNECTIONS.includes(triple.p.value),
        reverseEdgePredicate: (triple) => false,
      });
      expect(tree).toMatchInlineSnapshot(`
        [
          {
            "children": [
              {
                "children": [],
                "id": "http://telicent.io/data/dataservice1",
                "label": "http://telicent.io/data/dataservice1",
              },
              {
                "children": [],
                "id": "http://telicent.io/data/dataset1",
                "label": "http://telicent.io/data/dataset1",
              },
            ],
            "id": "http://telicent.io/data/catalog1",
            "label": "http://telicent.io/data/catalog1",
          },
        ]
      `);

      expect(await enrichRdfTree({ tree, service: api._service, triples }))
        .toMatchInlineSnapshot(`
        [
          {
            "children": [
              {
                "children": [],
                "id": "http://telicent.io/data/dataservice1",
                "label": "Service: Wind Feed",
              },
              {
                "children": [],
                "id": "http://telicent.io/data/dataset1",
                "label": "Dataset: Q1 2021",
              },
            ],
            "id": "http://telicent.io/data/catalog1",
            "label": "Catalog: Cornwall Data",
          },
        ]
      `);
    },
    10 * SEC
  );
});

describe("transformRdfToTree: COMPLEX", () => {
  let catalogService: CatalogService;
  let environment: StartedDockerComposeEnvironment;
  beforeAll(async () => {
    ({ catalogService, environment } = await setupContainer());
    api = await setup({ catalogService, mockSet: MockSet.COMPLEX });
  }, 60 * SEC);
  afterAll(async () => {
    await Promise.all(api._service.workAsync);
    await environment.down({ removeVolumes: true });
  }, 50 * SEC);

  it(
    "transformRdfToTree (node)",
    async () => {
      const data = await api._service.runQuery(`
      SELECT ?s ?p ?o 
      WHERE { ?s ?p ?o }
    `);

      const triples = RDFResponseSchema.parse(data).results.bindings.map((el) =>
        RDFTripleSchema.parse(el)
      );

      const catalogWithSiblingAndChild = triples.filter(
        ({ s, p, o }) =>
          (s.value.endsWith("catalog1") ||
            s.value.endsWith("catalog1.1") ||
            s.value.endsWith("cat2")) &&
          (o.value.endsWith("catalog1") ||
            o.value.endsWith("catalog1.1") ||
            o.value.endsWith("cat2") ||
            p.value.startsWith("http://www.w3.org/1999/02/22-rdf-syntax-ns") ||
            p.value.startsWith("http://www.w3.org/ns/dcat#"))
      );

      expect(new Set(catalogWithSiblingAndChild.map(({ s }) => s.value)))
        .toMatchInlineSnapshot(`
              Set {
                "http://telicent.io/data/catalog1",
                "http://telicent.io/data/catalog1.1",
                "http://telicent.io/data/cat2",
              }
          `);
      expect(formatDataAsArray(makeStatic(catalogWithSiblingAndChild)))
        .toMatchInlineSnapshot(`
        [
          "s                                  | p                                               | o",
          "http://telicent.io/data/catalog1   | http://www.w3.org/ns/dcat#DataService           | http://telicent.io/data/dataservice1",
          "http://telicent.io/data/catalog1   | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Catalog",
          "http://telicent.io/data/catalog1   | http://www.w3.org/ns/dcat#Catalog               | http://telicent.io/data/catalog1.1",
          "http://telicent.io/data/catalog1   | http://www.w3.org/ns/dcat#Dataset               | http://telicent.io/data/dataset1",
          "http://telicent.io/data/catalog1   | http://www.w3.org/ns/dcat#Dataset               | http://telicent.io/data/dataset4",
          "http://telicent.io/data/catalog1   | http://www.w3.org/ns/dcat#Dataset               | http://telicent.io/data/dataset3",
          "http://telicent.io/data/catalog1   | http://www.w3.org/ns/dcat#Dataset               | http://telicent.io/data/dataset2",
          "http://telicent.io/data/catalog1.1 | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Catalog",
          "http://telicent.io/data/catalog1.1 | http://www.w3.org/ns/dcat#Dataset               | http://telicent.io/data/catalog1_1_dataset",
          "http://telicent.io/data/cat2       | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Catalog",
        ]
      `);

      expect(formatDataAsArray(makeStatic(data.results).bindings))
        .toMatchInlineSnapshot(`
        [
          "s                                          | p                                               | o",
          "http://telicent.io/data/dataset1           | http://purl.org/dc/terms/description            | Q1 2021 Cornwall incident reports dataset in CSV format. H…",
          "http://telicent.io/data/dataset1           | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Dataset",
          "http://telicent.io/data/dataset1           | http://purl.org/dc/terms/creator                | Kiki Sato",
          "http://telicent.io/data/dataset1           | http://purl.org/dc/terms/title                  | Dataset: Q1 2021",
          "http://telicent.io/data/dataset1           | http://purl.org/dc/terms/rights                 | Effective Date: 25/10/20241.      1. Introduction      This agency is committed to ensuring the security and confidentiality of the personal and sensitive data we handle. This policy outlines the procedures and responsibilities for managing and protecting data to comply with relevant laws and regulations.      2. Purpose      The purpose of this policy is to:Ensure the proper handling, protection, and use of data.Comply with applicable data protection laws and regulations.Protect the privacy rights of individuals whose data we handle.      3. Scope      This policy applies to all employees, contractors, and third-party service providers of who have access to, or handle, data.      4. Data Collection      Lawful and Fair Collection: Data must be collected lawfully and fairly, and only for specified, explicit, and legitimate purposes.Consent: Where applicable, data subjects must provide informed consent for the collection and processing of their data.      5. Data Use      Purpose Limitation: Data must be used only for the purposes for which it was collected and not further processed in a manner incompatible with those purposes.Data Minimization: Only the minimum necessary data should be collected and processed.      6. Data Storage      Secure Storage: Data must be stored securely to prevent unauthorized access, loss, or damage. This includes physical and electronic storage measures.Retention Period: Data must be retained only for as long as necessary to fulfill the purposes for which it was collected, or as required by law.      For questions or concerns about this policy or data protection practices, contact John Smiley at 0394 300498.      Approved by:John Smiley   Head of Data Capture   The agency      25/03/2024",
          "http://telicent.io/data/dataset1           | http://purl.org/dc/terms/modified               | 2021-4-5",
          "http://telicent.io/data/dataset1           | http://purl.org/dc/terms/accessRights           | Damir Sato",
          "http://telicent.io/data/dataset1           | http://purl.org/dc/terms/published              | ######## makeStatic() ########",
          "http://telicent.io/data/dataset4           | http://purl.org/dc/terms/description            | Q4 2021 Cornwall incident reports dataset in CSV format. H…",
          "http://telicent.io/data/dataset4           | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Dataset",
          "http://telicent.io/data/dataset4           | http://purl.org/dc/terms/creator                | Kiki Sato",
          "http://telicent.io/data/dataset4           | http://purl.org/dc/terms/title                  | Dataset: Q4 2021",
          "http://telicent.io/data/dataset4           | http://purl.org/dc/terms/rights                 | Effective Date: 25/10/20241.      1. Introduction      This agency is committed to ensuring the security and confidentiality of the personal and sensitive data we handle. This policy outlines the procedures and responsibilities for managing and protecting data to comply with relevant laws and regulations.      2. Purpose      The purpose of this policy is to:Ensure the proper handling, protection, and use of data.Comply with applicable data protection laws and regulations.Protect the privacy rights of individuals whose data we handle.      3. Scope      This policy applies to all employees, contractors, and third-party service providers of who have access to, or handle, data.      4. Data Collection      Lawful and Fair Collection: Data must be collected lawfully and fairly, and only for specified, explicit, and legitimate purposes.Consent: Where applicable, data subjects must provide informed consent for the collection and processing of their data.      5. Data Use      Purpose Limitation: Data must be used only for the purposes for which it was collected and not further processed in a manner incompatible with those purposes.Data Minimization: Only the minimum necessary data should be collected and processed.      6. Data Storage      Secure Storage: Data must be stored securely to prevent unauthorized access, loss, or damage. This includes physical and electronic storage measures.Retention Period: Data must be retained only for as long as necessary to fulfill the purposes for which it was collected, or as required by law.      For questions or concerns about this policy or data protection practices, contact John Smiley at 0394 300498.      Approved by:John Smiley   Head of Data Capture   The agency      25/03/2024",
          "http://telicent.io/data/dataset4           | http://purl.org/dc/terms/modified               | 2023-3-21",
          "http://telicent.io/data/dataset4           | http://purl.org/dc/terms/accessRights           | Wei Zhang",
          "http://telicent.io/data/dataset4           | http://purl.org/dc/terms/published              | ######## makeStatic() ########",
          "http://telicent.io/data/catalog1           | http://www.w3.org/ns/dcat#DataService           | http://telicent.io/data/dataservice1",
          "http://telicent.io/data/catalog1           | http://purl.org/dc/terms/description            | 2020 Royal Engineers’ Cornwall focused data catalog. Inclu…",
          "http://telicent.io/data/catalog1           | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Catalog",
          "http://telicent.io/data/catalog1           | http://www.w3.org/ns/dcat#Catalog               | http://telicent.io/data/catalog1.1",
          "http://telicent.io/data/catalog1           | http://purl.org/dc/terms/creator                | Mario Giacomelli",
          "http://telicent.io/data/catalog1           | http://www.w3.org/ns/dcat#Dataset               | http://telicent.io/data/dataset1",
          "http://telicent.io/data/catalog1           | http://www.w3.org/ns/dcat#Dataset               | http://telicent.io/data/dataset4",
          "http://telicent.io/data/catalog1           | http://www.w3.org/ns/dcat#Dataset               | http://telicent.io/data/dataset3",
          "http://telicent.io/data/catalog1           | http://www.w3.org/ns/dcat#Dataset               | http://telicent.io/data/dataset2",
          "http://telicent.io/data/catalog1           | http://purl.org/dc/terms/title                  | Catalog: Cornwall Data",
          "http://telicent.io/data/catalog1           | http://purl.org/dc/terms/rights                 | Effective Date: 25/10/20241.      1. Introduction      This agency is committed to ensuring the security and confidentiality of the personal and sensitive data we handle. This policy outlines the procedures and responsibilities for managing and protecting data to comply with relevant laws and regulations.      2. Purpose      The purpose of this policy is to:Ensure the proper handling, protection, and use of data.Comply with applicable data protection laws and regulations.Protect the privacy rights of individuals whose data we handle.      3. Scope      This policy applies to all employees, contractors, and third-party service providers of who have access to, or handle, data.      4. Data Collection      Lawful and Fair Collection: Data must be collected lawfully and fairly, and only for specified, explicit, and legitimate purposes.Consent: Where applicable, data subjects must provide informed consent for the collection and processing of their data.      5. Data Use      Purpose Limitation: Data must be used only for the purposes for which it was collected and not further processed in a manner incompatible with those purposes.Data Minimization: Only the minimum necessary data should be collected and processed.      6. Data Storage      Secure Storage: Data must be stored securely to prevent unauthorized access, loss, or damage. This includes physical and electronic storage measures.Retention Period: Data must be retained only for as long as necessary to fulfill the purposes for which it was collected, or as required by law.      For questions or concerns about this policy or data protection practices, contact John Smiley at 0394 300498.      Approved by:John Smiley   Head of Data Capture   The agency      25/03/2024",
          "http://telicent.io/data/catalog1           | http://purl.org/dc/terms/modified               | 2023-6-1",
          "http://telicent.io/data/catalog1           | http://purl.org/dc/terms/accessRights           | James Hardacre",
          "http://telicent.io/data/catalog1           | http://purl.org/dc/terms/published              | ######## makeStatic() ########",
          "http://telicent.io/data/catalog1_1_dataset | http://purl.org/dc/terms/description            | Turbines around Trefranc and St Clether.",
          "http://telicent.io/data/catalog1_1_dataset | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Dataset",
          "http://telicent.io/data/catalog1_1_dataset | http://purl.org/dc/terms/creator                | George Maxwell",
          "http://telicent.io/data/catalog1_1_dataset | http://purl.org/dc/terms/title                  | Dataset: Region 44",
          "http://telicent.io/data/catalog1_1_dataset | http://purl.org/dc/terms/rights                 | Effective Date: 25/10/20241.      1. Introduction      This agency is committed to ensuring the security and confidentiality of the personal and sensitive data we handle. This policy outlines the procedures and responsibilities for managing and protecting data to comply with relevant laws and regulations.      2. Purpose      The purpose of this policy is to:Ensure the proper handling, protection, and use of data.Comply with applicable data protection laws and regulations.Protect the privacy rights of individuals whose data we handle.      3. Scope      This policy applies to all employees, contractors, and third-party service providers of who have access to, or handle, data.      4. Data Collection      Lawful and Fair Collection: Data must be collected lawfully and fairly, and only for specified, explicit, and legitimate purposes.Consent: Where applicable, data subjects must provide informed consent for the collection and processing of their data.      5. Data Use      Purpose Limitation: Data must be used only for the purposes for which it was collected and not further processed in a manner incompatible with those purposes.Data Minimization: Only the minimum necessary data should be collected and processed.      6. Data Storage      Secure Storage: Data must be stored securely to prevent unauthorized access, loss, or damage. This includes physical and electronic storage measures.Retention Period: Data must be retained only for as long as necessary to fulfill the purposes for which it was collected, or as required by law.      For questions or concerns about this policy or data protection practices, contact John Smiley at 0394 300498.      Approved by:John Smiley   Head of Data Capture   The agency      25/03/2024",
          "http://telicent.io/data/catalog1_1_dataset | http://purl.org/dc/terms/modified               | 2022-6-5",
          "http://telicent.io/data/catalog1_1_dataset | http://purl.org/dc/terms/accessRights           | Aiman Ismail",
          "http://telicent.io/data/catalog1_1_dataset | http://purl.org/dc/terms/published              | ######## makeStatic() ########",
          "http://telicent.io/data/dataset3           | http://purl.org/dc/terms/description            | Q3 2021 Cornwall incident reports dataset in CSV format. H…",
          "http://telicent.io/data/dataset3           | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Dataset",
          "http://telicent.io/data/dataset3           | http://purl.org/dc/terms/creator                | Kiki Sato",
          "http://telicent.io/data/dataset3           | http://purl.org/dc/terms/title                  | Dataset: Q3 2021",
          "http://telicent.io/data/dataset3           | http://purl.org/dc/terms/rights                 | Effective Date: 25/10/20241.      1. Introduction      This agency is committed to ensuring the security and confidentiality of the personal and sensitive data we handle. This policy outlines the procedures and responsibilities for managing and protecting data to comply with relevant laws and regulations.      2. Purpose      The purpose of this policy is to:Ensure the proper handling, protection, and use of data.Comply with applicable data protection laws and regulations.Protect the privacy rights of individuals whose data we handle.      3. Scope      This policy applies to all employees, contractors, and third-party service providers of who have access to, or handle, data.      4. Data Collection      Lawful and Fair Collection: Data must be collected lawfully and fairly, and only for specified, explicit, and legitimate purposes.Consent: Where applicable, data subjects must provide informed consent for the collection and processing of their data.      5. Data Use      Purpose Limitation: Data must be used only for the purposes for which it was collected and not further processed in a manner incompatible with those purposes.Data Minimization: Only the minimum necessary data should be collected and processed.      6. Data Storage      Secure Storage: Data must be stored securely to prevent unauthorized access, loss, or damage. This includes physical and electronic storage measures.Retention Period: Data must be retained only for as long as necessary to fulfill the purposes for which it was collected, or as required by law.      For questions or concerns about this policy or data protection practices, contact John Smiley at 0394 300498.      Approved by:John Smiley   Head of Data Capture   The agency      25/03/2024",
          "http://telicent.io/data/dataset3           | http://purl.org/dc/terms/modified               | 2022-10-6",
          "http://telicent.io/data/dataset3           | http://purl.org/dc/terms/accessRights           | Damir Sato",
          "http://telicent.io/data/dataset3           | http://purl.org/dc/terms/published              | ######## makeStatic() ########",
          "http://telicent.io/data/dataservice1       | http://purl.org/dc/terms/description            | Cornwall Wind Detector data via JSON REST API. Real-time, …",
          "http://telicent.io/data/dataservice1       | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#DataService",
          "http://telicent.io/data/dataservice1       | http://purl.org/dc/terms/creator                | Oleg Novak",
          "http://telicent.io/data/dataservice1       | http://purl.org/dc/terms/title                  | Service: Wind Feed",
          "http://telicent.io/data/dataservice1       | http://purl.org/dc/terms/rights                 | Effective Date: 25/10/20241.      1. Introduction      This agency is committed to ensuring the security and confidentiality of the personal and sensitive data we handle. This policy outlines the procedures and responsibilities for managing and protecting data to comply with relevant laws and regulations.      2. Purpose      The purpose of this policy is to:Ensure the proper handling, protection, and use of data.Comply with applicable data protection laws and regulations.Protect the privacy rights of individuals whose data we handle.      3. Scope      This policy applies to all employees, contractors, and third-party service providers of who have access to, or handle, data.      4. Data Collection      Lawful and Fair Collection: Data must be collected lawfully and fairly, and only for specified, explicit, and legitimate purposes.Consent: Where applicable, data subjects must provide informed consent for the collection and processing of their data.      5. Data Use      Purpose Limitation: Data must be used only for the purposes for which it was collected and not further processed in a manner incompatible with those purposes.Data Minimization: Only the minimum necessary data should be collected and processed.      6. Data Storage      Secure Storage: Data must be stored securely to prevent unauthorized access, loss, or damage. This includes physical and electronic storage measures.Retention Period: Data must be retained only for as long as necessary to fulfill the purposes for which it was collected, or as required by law.      For questions or concerns about this policy or data protection practices, contact John Smiley at 0394 300498.      Approved by:John Smiley   Head of Data Capture   The agency      25/03/2024",
          "http://telicent.io/data/dataservice1       | http://purl.org/dc/terms/modified               | 2023-2-3",
          "http://telicent.io/data/dataservice1       | http://purl.org/dc/terms/accessRights           | James Hardacre",
          "http://telicent.io/data/dataservice1       | http://purl.org/dc/terms/published              | ######## makeStatic() ########",
          "http://telicent.io/data/dataset2           | http://purl.org/dc/terms/description            | Q2 2021 Cornwall incident reports dataset in CSV format. H…",
          "http://telicent.io/data/dataset2           | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Dataset",
          "http://telicent.io/data/dataset2           | http://purl.org/dc/terms/creator                | Kiki Sato",
          "http://telicent.io/data/dataset2           | http://purl.org/dc/terms/title                  | Dataset: Q2 2021",
          "http://telicent.io/data/dataset2           | http://purl.org/dc/terms/rights                 | Effective Date: 25/10/20241.      1. Introduction      This agency is committed to ensuring the security and confidentiality of the personal and sensitive data we handle. This policy outlines the procedures and responsibilities for managing and protecting data to comply with relevant laws and regulations.      2. Purpose      The purpose of this policy is to:Ensure the proper handling, protection, and use of data.Comply with applicable data protection laws and regulations.Protect the privacy rights of individuals whose data we handle.      3. Scope      This policy applies to all employees, contractors, and third-party service providers of who have access to, or handle, data.      4. Data Collection      Lawful and Fair Collection: Data must be collected lawfully and fairly, and only for specified, explicit, and legitimate purposes.Consent: Where applicable, data subjects must provide informed consent for the collection and processing of their data.      5. Data Use      Purpose Limitation: Data must be used only for the purposes for which it was collected and not further processed in a manner incompatible with those purposes.Data Minimization: Only the minimum necessary data should be collected and processed.      6. Data Storage      Secure Storage: Data must be stored securely to prevent unauthorized access, loss, or damage. This includes physical and electronic storage measures.Retention Period: Data must be retained only for as long as necessary to fulfill the purposes for which it was collected, or as required by law.      For questions or concerns about this policy or data protection practices, contact John Smiley at 0394 300498.      Approved by:John Smiley   Head of Data Capture   The agency      25/03/2024",
          "http://telicent.io/data/dataset2           | http://purl.org/dc/terms/modified               | 2021-7-5",
          "http://telicent.io/data/dataset2           | http://purl.org/dc/terms/accessRights           | Damir Sato",
          "http://telicent.io/data/dataset2           | http://purl.org/dc/terms/published              | ######## makeStatic() ########",
          "http://telicent.io/data/catalog1.1         | http://purl.org/dc/terms/description            | Third-party data pulled from Wind Turbine register.",
          "http://telicent.io/data/catalog1.1         | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Catalog",
          "http://telicent.io/data/catalog1.1         | http://purl.org/dc/terms/creator                | Hans Müller",
          "http://telicent.io/data/catalog1.1         | http://www.w3.org/ns/dcat#Dataset               | http://telicent.io/data/catalog1_1_dataset",
          "http://telicent.io/data/catalog1.1         | http://purl.org/dc/terms/title                  | Catalog: St Clement Wind turbine",
          "http://telicent.io/data/catalog1.1         | http://purl.org/dc/terms/rights                 | Effective Date: 25/10/20241.      1. Introduction      This agency is committed to ensuring the security and confidentiality of the personal and sensitive data we handle. This policy outlines the procedures and responsibilities for managing and protecting data to comply with relevant laws and regulations.      2. Purpose      The purpose of this policy is to:Ensure the proper handling, protection, and use of data.Comply with applicable data protection laws and regulations.Protect the privacy rights of individuals whose data we handle.      3. Scope      This policy applies to all employees, contractors, and third-party service providers of who have access to, or handle, data.      4. Data Collection      Lawful and Fair Collection: Data must be collected lawfully and fairly, and only for specified, explicit, and legitimate purposes.Consent: Where applicable, data subjects must provide informed consent for the collection and processing of their data.      5. Data Use      Purpose Limitation: Data must be used only for the purposes for which it was collected and not further processed in a manner incompatible with those purposes.Data Minimization: Only the minimum necessary data should be collected and processed.      6. Data Storage      Secure Storage: Data must be stored securely to prevent unauthorized access, loss, or damage. This includes physical and electronic storage measures.Retention Period: Data must be retained only for as long as necessary to fulfill the purposes for which it was collected, or as required by law.      For questions or concerns about this policy or data protection practices, contact John Smiley at 0394 300498.      Approved by:John Smiley   Head of Data Capture   The agency      25/03/2024",
          "http://telicent.io/data/catalog1.1         | http://purl.org/dc/terms/modified               | 2019-5-3",
          "http://telicent.io/data/catalog1.1         | http://purl.org/dc/terms/accessRights           | Aarav Sharma",
          "http://telicent.io/data/catalog1.1         | http://purl.org/dc/terms/published              | ######## makeStatic() ########",
          "http://telicent.io/data/cat2               | http://purl.org/dc/terms/description            | 2020 Royal Engineers’ Cornwall focused data catalog. Inclu…",
          "http://telicent.io/data/cat2               | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Catalog",
          "http://telicent.io/data/cat2               | http://purl.org/dc/terms/creator                | Amina Okeke",
          "http://telicent.io/data/cat2               | http://purl.org/dc/terms/title                  | Catalog: Sussex Data",
          "http://telicent.io/data/cat2               | http://purl.org/dc/terms/rights                 | Effective Date: 25/10/20241.      1. Introduction      This agency is committed to ensuring the security and confidentiality of the personal and sensitive data we handle. This policy outlines the procedures and responsibilities for managing and protecting data to comply with relevant laws and regulations.      2. Purpose      The purpose of this policy is to:Ensure the proper handling, protection, and use of data.Comply with applicable data protection laws and regulations.Protect the privacy rights of individuals whose data we handle.      3. Scope      This policy applies to all employees, contractors, and third-party service providers of who have access to, or handle, data.      4. Data Collection      Lawful and Fair Collection: Data must be collected lawfully and fairly, and only for specified, explicit, and legitimate purposes.Consent: Where applicable, data subjects must provide informed consent for the collection and processing of their data.      5. Data Use      Purpose Limitation: Data must be used only for the purposes for which it was collected and not further processed in a manner incompatible with those purposes.Data Minimization: Only the minimum necessary data should be collected and processed.      6. Data Storage      Secure Storage: Data must be stored securely to prevent unauthorized access, loss, or damage. This includes physical and electronic storage measures.Retention Period: Data must be retained only for as long as necessary to fulfill the purposes for which it was collected, or as required by law.      For questions or concerns about this policy or data protection practices, contact John Smiley at 0394 300498.      Approved by:John Smiley   Head of Data Capture   The agency      25/03/2024",
          "http://telicent.io/data/cat2               | http://purl.org/dc/terms/modified               | 2020-3-12",
          "http://telicent.io/data/cat2               | http://purl.org/dc/terms/accessRights           | Erik Johansson",
          "http://telicent.io/data/cat2               | http://purl.org/dc/terms/published              | ######## makeStatic() ########",
        ]
      `);

      const DATASET = "http://www.w3.org/ns/dcat#Dataset";
      const SERVICE = "http://www.w3.org/ns/dcat#DataService";
      const CATALOG = "http://www.w3.org/ns/dcat#Catalog";
      const CONNECTIONS = [DATASET, SERVICE, CATALOG];

      const tree = transformRdfToTree({
        triples,
        edgePredicate: (triple) => CONNECTIONS.includes(triple.p.value),
        reverseEdgePredicate: () => false,
      });
      expect(tree).toMatchInlineSnapshot(`
        [
          {
            "children": [
              {
                "children": [],
                "id": "http://telicent.io/data/dataservice1",
                "label": "http://telicent.io/data/dataservice1",
              },
              {
                "children": [
                  {
                    "children": [],
                    "id": "http://telicent.io/data/catalog1_1_dataset",
                    "label": "http://telicent.io/data/catalog1_1_dataset",
                  },
                ],
                "id": "http://telicent.io/data/catalog1.1",
                "label": "http://telicent.io/data/catalog1.1",
              },
              {
                "children": [],
                "id": "http://telicent.io/data/dataset1",
                "label": "http://telicent.io/data/dataset1",
              },
              {
                "children": [],
                "id": "http://telicent.io/data/dataset4",
                "label": "http://telicent.io/data/dataset4",
              },
              {
                "children": [],
                "id": "http://telicent.io/data/dataset3",
                "label": "http://telicent.io/data/dataset3",
              },
              {
                "children": [],
                "id": "http://telicent.io/data/dataset2",
                "label": "http://telicent.io/data/dataset2",
              },
            ],
            "id": "http://telicent.io/data/catalog1",
            "label": "http://telicent.io/data/catalog1",
          },
          {
            "children": [],
            "id": "http://telicent.io/data/cat2",
            "label": "http://telicent.io/data/cat2",
          },
        ]
      `);

      expect(await enrichRdfTree({ tree, service: api._service, triples }))
        .toMatchInlineSnapshot(`
        [
          {
            "children": [
              {
                "children": [],
                "id": "http://telicent.io/data/dataservice1",
                "label": "Service: Wind Feed",
              },
              {
                "children": [
                  {
                    "children": [],
                    "id": "http://telicent.io/data/catalog1_1_dataset",
                    "label": "Dataset: Region 44",
                  },
                ],
                "id": "http://telicent.io/data/catalog1.1",
                "label": "Catalog: St Clement Wind turbine",
              },
              {
                "children": [],
                "id": "http://telicent.io/data/dataset1",
                "label": "Dataset: Q1 2021",
              },
              {
                "children": [],
                "id": "http://telicent.io/data/dataset4",
                "label": "Dataset: Q4 2021",
              },
              {
                "children": [],
                "id": "http://telicent.io/data/dataset3",
                "label": "Dataset: Q3 2021",
              },
              {
                "children": [],
                "id": "http://telicent.io/data/dataset2",
                "label": "Dataset: Q2 2021",
              },
            ],
            "id": "http://telicent.io/data/catalog1",
            "label": "Catalog: Cornwall Data",
          },
          {
            "children": [],
            "id": "http://telicent.io/data/cat2",
            "label": "Catalog: Sussex Data",
          },
        ]
      `);
    },
    10 * SEC
  );
});
