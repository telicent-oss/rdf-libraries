import "jest-fetch-mock"; // WARNING: fails if: import fetchMock from "jest-fetch-mock";
import snapshotDiff from "snapshot-diff";
import {
  RDFSchema,
  RDFTripleSchema,
  RDFTripleType,
} from "@telicent-oss/rdfservice/index";
import { transformRdfToTree } from "../api/DataCatalogueFrontend/transformRdfToTree";
import maybeTriplesNode from "./transformRdfToTree.test.mock";
import maybeTripleBrowser from "./transformRdfToTree.test.mock2";
import { enrichRdfTree } from "../api/DataCatalogueFrontend/enrichRdfTree";
import { Api } from "../api/DataCatalogueFrontend";
import { MockSet, setup } from "../setup";
import { RDFResponseSchema } from "../api/DataCatalogueFrontend/common";
import { makeStatic } from "./makeStatic";
import { CatalogService } from "..";
import { setupContainer } from "./setupContainer";
import { SEC } from "../src/constants";
import { formatDataAsArray } from "./formatDataAsArray";
import { StartedDockerComposeEnvironment } from "testcontainers";

let api: Api;

const triplesNode = RDFSchema.parse(maybeTriplesNode) as RDFTripleType[];
const triplesBrowser = RDFSchema.parse(
  makeStatic(maybeTripleBrowser)
) as RDFTripleType[];

const DATASET = "http://www.w3.org/ns/dcat#Dataset";
const SERVICE = "http://www.w3.org/ns/dcat#DataService";
const CATALOG = "http://www.w3.org/ns/dcat#Catalog";
const CONNECTIONS = [DATASET, SERVICE, CATALOG];

describe("transformRdfToTree: SIMPLE", () => {
  let catalogService: CatalogService;
  let environment: StartedDockerComposeEnvironment;
  beforeAll(async () => {
    ({ catalogService, environment} = await setupContainer());
    api = await setup({ catalogService });
  }, 60 * SEC);
  afterAll(async () => {
    await Promise.all(api._service.workAsync);
    await environment.down({ removeVolumes: true });
  }, 60 * SEC);
  it("NOT same data when in in browser vs node [TEST BASED ON OLD-GENERATED DATA, MAY BE FIXED]", () => {
    // TODO! IMPORTANT! Graphs are racey by design.
    expect(
      snapshotDiff(
        triplesNode.map((el) => JSON.stringify(el)).sort(),
        triplesBrowser.map((el) => JSON.stringify(el)).sort(),
        { contextLines: 0 }
      )
    ).toMatchInlineSnapshot(`
      "Snapshot Diff:
      - First value
      + Second value

      @@ -8,1 +8,1 @@
      -   "{\\"o\\":{\\"type\\":\\"uri\\",\\"value\\":\\"http://telicent.io/data/dataservice1\\"},\\"p\\":{\\"type\\":\\"uri\\",\\"value\\":\\"http://www.w3.org/ns/dcat#Service\\"},\\"s\\":{\\"type\\":\\"uri\\",\\"value\\":\\"http://telicent.io/data/catalog1\\"}}",
      +   "{\\"o\\":{\\"type\\":\\"uri\\",\\"value\\":\\"http://telicent.io/data/catalog1\\"},\\"p\\":{\\"type\\":\\"uri\\",\\"value\\":\\"http://www.w3.org/ns/dcat#Resource\\"},\\"s\\":{\\"type\\":\\"uri\\",\\"value\\":\\"http://telicent.io/data/dataservice1\\"}}","
    `);
  }, 10 * SEC);
  it("transformRdfToTree", async () => {
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
              "id": "http://telicent.io/data/dataset1",
              "label": "http://telicent.io/data/dataset1",
            },
            {
              "children": [],
              "id": "http://telicent.io/data/dataservice1",
              "label": "http://telicent.io/data/dataservice1",
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
              "id": "http://telicent.io/data/dataset1",
              "label": "Dataset: Q1 2021",
            },
            {
              "children": [],
              "id": "http://telicent.io/data/dataservice1",
              "label": "Service: Wind Feed",
            },
          ],
          "id": "http://telicent.io/data/catalog1",
          "label": "Catalog: Cornwall Data",
        },
      ]
    `);
  }, 10 * SEC);
});

describe("transformRdfToTree: COMPLEX", () => {
  let catalogService: CatalogService;
  let environment: StartedDockerComposeEnvironment;
  beforeAll(async () => {
    ({ catalogService, environment} = await setupContainer());
    api = await setup({ catalogService, mockSet: MockSet.COMPLEX });
  }, 60 * SEC);
  afterAll(async () => {
    await Promise.all(api._service.workAsync);
    await environment.down({ removeVolumes: true });
  }, 50 * SEC);

  it("transformRdfToTree (node)", async () => {
    const data = await api._service.runQuery(`
      SELECT ?s ?p ?o 
      WHERE { ?s ?p ?o }
    `);

    const triples = RDFResponseSchema.parse(data).results.bindings.map((el) =>
      RDFTripleSchema.parse(el)
    );

    const simpleTriples = triples.filter(
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

    expect(new Set(simpleTriples.map(({ s }) => s.value)))
      .toMatchInlineSnapshot(`
      Set {
        "http://telicent.io/data/catalog1",
        "http://telicent.io/data/catalog1.1",
        "http://telicent.io/data/cat2",
      }
    `);
    expect(formatDataAsArray(makeStatic(simpleTriples))).toMatchInlineSnapshot(`
      [
        "s                                  | p                                               | o",
        "http://telicent.io/data/catalog1   | http://www.w3.org/ns/dcat#Dataset               | http://telicent.io/data/dataset4",
        "http://telicent.io/data/catalog1   | http://www.w3.org/ns/dcat#Dataset               | http://telicent.io/data/dataset1",
        "http://telicent.io/data/catalog1   | http://www.w3.org/ns/dcat#Dataset               | http://telicent.io/data/dataset2",
        "http://telicent.io/data/catalog1   | http://www.w3.org/ns/dcat#Dataset               | http://telicent.io/data/dataset3",
        "http://telicent.io/data/catalog1   | http://www.w3.org/ns/dcat#DataService           | http://telicent.io/data/dataservice1",
        "http://telicent.io/data/catalog1   | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Catalog",
        "http://telicent.io/data/catalog1   | http://www.w3.org/ns/dcat#Catalog               | http://telicent.io/data/catalog1.1",
        "http://telicent.io/data/catalog1.1 | http://www.w3.org/ns/dcat#Dataset               | http://telicent.io/data/catalog1_1_dataset",
        "http://telicent.io/data/catalog1.1 | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Catalog",
        "http://telicent.io/data/cat2       | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Catalog",
      ]
    `);

    expect(formatDataAsArray(makeStatic(data.results).bindings))
      .toMatchInlineSnapshot(`
        [
          "s                                          | p                                               | o",
          "http://telicent.io/data/dataset4           | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Dataset",
          "http://telicent.io/data/dataset4           | http://purl.org/dc/terms/creator                | Kiki Sato",
          "http://telicent.io/data/dataset4           | http://purl.org/dc/terms/title                  | Dataset: Q4 2021",
          "http://telicent.io/data/dataset4           | http://purl.org/dc/terms/published              | ######## makeStatic() ########",
          "http://telicent.io/data/dataset4           | http://purl.org/dc/terms/description            | Q4 2021 Cornwall incident reports dataset in CSV format. Heavily redacted, supporting public safety analysis and policy development.",
          "http://telicent.io/data/dataset4           | http://purl.org/dc/terms/rights                 | Wei Zhang",
          "http://telicent.io/data/dataservice1       | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#DataService",
          "http://telicent.io/data/dataservice1       | http://purl.org/dc/terms/creator                | Oleg Novak",
          "http://telicent.io/data/dataservice1       | http://purl.org/dc/terms/title                  | Service: Wind Feed",
          "http://telicent.io/data/dataservice1       | http://purl.org/dc/terms/published              | ######## makeStatic() ########",
          "http://telicent.io/data/dataservice1       | http://purl.org/dc/terms/description            | Cornwall Wind Detector data via JSON REST API. Real-time, API-token controlled access for analysis by environmental scientists and meteorologists.",
          "http://telicent.io/data/dataservice1       | http://purl.org/dc/terms/rights                 | James Hardacre",
          "http://telicent.io/data/catalog1_1_dataset | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Dataset",
          "http://telicent.io/data/catalog1_1_dataset | http://purl.org/dc/terms/creator                | George Maxwell",
          "http://telicent.io/data/catalog1_1_dataset | http://purl.org/dc/terms/title                  | Dataset: Region 44",
          "http://telicent.io/data/catalog1_1_dataset | http://purl.org/dc/terms/published              | ######## makeStatic() ########",
          "http://telicent.io/data/catalog1_1_dataset | http://purl.org/dc/terms/description            | Turbines around Trefranc and St Clether.",
          "http://telicent.io/data/catalog1_1_dataset | http://purl.org/dc/terms/rights                 | Aiman Ismail",
          "http://telicent.io/data/catalog1           | http://www.w3.org/ns/dcat#Dataset               | http://telicent.io/data/dataset4",
          "http://telicent.io/data/catalog1           | http://www.w3.org/ns/dcat#Dataset               | http://telicent.io/data/dataset1",
          "http://telicent.io/data/catalog1           | http://www.w3.org/ns/dcat#Dataset               | http://telicent.io/data/dataset2",
          "http://telicent.io/data/catalog1           | http://www.w3.org/ns/dcat#Dataset               | http://telicent.io/data/dataset3",
          "http://telicent.io/data/catalog1           | http://www.w3.org/ns/dcat#DataService           | http://telicent.io/data/dataservice1",
          "http://telicent.io/data/catalog1           | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Catalog",
          "http://telicent.io/data/catalog1           | http://purl.org/dc/terms/creator                | Mario Giacomelli",
          "http://telicent.io/data/catalog1           | http://purl.org/dc/terms/title                  | Catalog: Cornwall Data",
          "http://telicent.io/data/catalog1           | http://www.w3.org/ns/dcat#Catalog               | http://telicent.io/data/catalog1.1",
          "http://telicent.io/data/catalog1           | http://purl.org/dc/terms/published              | ######## makeStatic() ########",
          "http://telicent.io/data/catalog1           | http://purl.org/dc/terms/description            | 2020 Royal Engineers’ Cornwall focused data catalog. Includes real-time IoT telemetry and historical archives for environmental and technological research.",
          "http://telicent.io/data/catalog1           | http://purl.org/dc/terms/rights                 | James Hardacre",
          "http://telicent.io/data/dataset1           | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Dataset",
          "http://telicent.io/data/dataset1           | http://purl.org/dc/terms/creator                | Kiki Sato",
          "http://telicent.io/data/dataset1           | http://purl.org/dc/terms/title                  | Dataset: Q1 2021",
          "http://telicent.io/data/dataset1           | http://purl.org/dc/terms/published              | ######## makeStatic() ########",
          "http://telicent.io/data/dataset1           | http://purl.org/dc/terms/description            | Q1 2021 Cornwall incident reports dataset in CSV format. Heavily redacted, supporting public safety analysis and policy development.",
          "http://telicent.io/data/dataset1           | http://purl.org/dc/terms/rights                 | Damir Sato",
          "http://telicent.io/data/dataset2           | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Dataset",
          "http://telicent.io/data/dataset2           | http://purl.org/dc/terms/creator                | Kiki Sato",
          "http://telicent.io/data/dataset2           | http://purl.org/dc/terms/title                  | Dataset: Q2 2021",
          "http://telicent.io/data/dataset2           | http://purl.org/dc/terms/published              | ######## makeStatic() ########",
          "http://telicent.io/data/dataset2           | http://purl.org/dc/terms/description            | Q2 2021 Cornwall incident reports dataset in CSV format. Heavily redacted, supporting public safety analysis and policy development.",
          "http://telicent.io/data/dataset2           | http://purl.org/dc/terms/rights                 | Damir Sato",
          "http://telicent.io/data/catalog1.1         | http://www.w3.org/ns/dcat#Dataset               | http://telicent.io/data/catalog1_1_dataset",
          "http://telicent.io/data/catalog1.1         | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Catalog",
          "http://telicent.io/data/catalog1.1         | http://purl.org/dc/terms/creator                | Hans Müller",
          "http://telicent.io/data/catalog1.1         | http://purl.org/dc/terms/title                  | Catalog: St Clement Wind turbine",
          "http://telicent.io/data/catalog1.1         | http://purl.org/dc/terms/published              | ######## makeStatic() ########",
          "http://telicent.io/data/catalog1.1         | http://purl.org/dc/terms/description            | Third-party data pulled from Wind Turbine register.",
          "http://telicent.io/data/catalog1.1         | http://purl.org/dc/terms/rights                 | Aarav Sharma",
          "http://telicent.io/data/dataset3           | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Dataset",
          "http://telicent.io/data/dataset3           | http://purl.org/dc/terms/creator                | Kiki Sato",
          "http://telicent.io/data/dataset3           | http://purl.org/dc/terms/title                  | Dataset: Q3 2021",
          "http://telicent.io/data/dataset3           | http://purl.org/dc/terms/published              | ######## makeStatic() ########",
          "http://telicent.io/data/dataset3           | http://purl.org/dc/terms/description            | Q3 2021 Cornwall incident reports dataset in CSV format. Heavily redacted, supporting public safety analysis and policy development.",
          "http://telicent.io/data/dataset3           | http://purl.org/dc/terms/rights                 | Damir Sato",
          "http://telicent.io/data/cat2               | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Catalog",
          "http://telicent.io/data/cat2               | http://purl.org/dc/terms/creator                | Amina Okeke",
          "http://telicent.io/data/cat2               | http://purl.org/dc/terms/title                  | Catalog: Sussex Data",
          "http://telicent.io/data/cat2               | http://purl.org/dc/terms/published              | ######## makeStatic() ########",
          "http://telicent.io/data/cat2               | http://purl.org/dc/terms/description            | 2020 Royal Engineers’ Cornwall focused data catalog. Includes real-time IoT telemetry and historical archives for environmental and technological research.",
          "http://telicent.io/data/cat2               | http://purl.org/dc/terms/rights                 | Erik Johansson",
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
              "id": "http://telicent.io/data/dataset4",
              "label": "http://telicent.io/data/dataset4",
            },
            {
              "children": [],
              "id": "http://telicent.io/data/dataset1",
              "label": "http://telicent.io/data/dataset1",
            },
            {
              "children": [],
              "id": "http://telicent.io/data/dataset2",
              "label": "http://telicent.io/data/dataset2",
            },
            {
              "children": [],
              "id": "http://telicent.io/data/dataset3",
              "label": "http://telicent.io/data/dataset3",
            },
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
              "id": "http://telicent.io/data/dataset4",
              "label": "Dataset: Q4 2021",
            },
            {
              "children": [],
              "id": "http://telicent.io/data/dataset1",
              "label": "Dataset: Q1 2021",
            },
            {
              "children": [],
              "id": "http://telicent.io/data/dataset2",
              "label": "Dataset: Q2 2021",
            },
            {
              "children": [],
              "id": "http://telicent.io/data/dataset3",
              "label": "Dataset: Q3 2021",
            },
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
  }, 10 * SEC);
});
