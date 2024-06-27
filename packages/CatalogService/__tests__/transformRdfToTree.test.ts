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
import { setup } from "../setup";
import { RDFResponse } from "../api/DataCatalogueFrontend/common";
import { makeStatic } from "./makeStatic";

let api: Api;

const triplesNode = RDFSchema.parse(maybeTriplesNode) as RDFTripleType[];
const triplesBrowser = RDFSchema.parse(
  makeStatic(maybeTripleBrowser)
) as RDFTripleType[];

describe("transformRdfToTree", () => {
  beforeAll(async () => {
    api = await setup({ hostName: "http://localhost:3030/" });
  });
  it("NOT same data when in in browser vs node", () => {
    // TODO! IMPORTANT! Graphs are racey by design.
    expect(
      snapshotDiff(
        triplesNode.map((el) => JSON.stringify(el)).sort(),
        triplesBrowser.map((el) => JSON.stringify(el)).sort()
      )
    ).toMatchInlineSnapshot(`
      "Snapshot Diff:
      - First value
      + Second value

      @@ -3,11 +3,11 @@
          "{\\"o\\":{\\"type\\":\\"literal\\",\\"value\\":\\"######## makeStatic() ########\\"},\\"p\\":{\\"type\\":\\"uri\\",\\"value\\":\\"http://purl.org/dc/terms/published\\"},\\"s\\":{\\"type\\":\\"uri\\",\\"value\\":\\"http://telicent.io/data/dataservice1\\"}}",
          "{\\"o\\":{\\"type\\":\\"literal\\",\\"value\\":\\"######## makeStatic() ########\\"},\\"p\\":{\\"type\\":\\"uri\\",\\"value\\":\\"http://purl.org/dc/terms/published\\"},\\"s\\":{\\"type\\":\\"uri\\",\\"value\\":\\"http://telicent.io/data/dataset1\\"}}",
          "{\\"o\\":{\\"type\\":\\"literal\\",\\"value\\":\\"Catalog One\\"},\\"p\\":{\\"type\\":\\"uri\\",\\"value\\":\\"http://purl.org/dc/terms/title\\"},\\"s\\":{\\"type\\":\\"uri\\",\\"value\\":\\"http://telicent.io/data/cat1\\"}}",
          "{\\"o\\":{\\"type\\":\\"literal\\",\\"value\\":\\"Data Service One\\"},\\"p\\":{\\"type\\":\\"uri\\",\\"value\\":\\"http://purl.org/dc/terms/title\\"},\\"s\\":{\\"type\\":\\"uri\\",\\"value\\":\\"http://telicent.io/data/dataservice1\\"}}",
          "{\\"o\\":{\\"type\\":\\"literal\\",\\"value\\":\\"Dataset One\\"},\\"p\\":{\\"type\\":\\"uri\\",\\"value\\":\\"http://purl.org/dc/terms/title\\"},\\"s\\":{\\"type\\":\\"uri\\",\\"value\\":\\"http://telicent.io/data/dataset1\\"}}",
      -   "{\\"o\\":{\\"type\\":\\"uri\\",\\"value\\":\\"http://telicent.io/data/dataservice1\\"},\\"p\\":{\\"type\\":\\"uri\\",\\"value\\":\\"http://www.w3.org/ns/dcat#service\\"},\\"s\\":{\\"type\\":\\"uri\\",\\"value\\":\\"http://telicent.io/data/cat1\\"}}",
      +   "{\\"o\\":{\\"type\\":\\"uri\\",\\"value\\":\\"http://telicent.io/data/cat1\\"},\\"p\\":{\\"type\\":\\"uri\\",\\"value\\":\\"http://www.w3.org/ns/dcat#resource\\"},\\"s\\":{\\"type\\":\\"uri\\",\\"value\\":\\"http://telicent.io/data/dataservice1\\"}}",
          "{\\"o\\":{\\"type\\":\\"uri\\",\\"value\\":\\"http://telicent.io/data/dataset1\\"},\\"p\\":{\\"type\\":\\"uri\\",\\"value\\":\\"http://www.w3.org/ns/dcat#dataset\\"},\\"s\\":{\\"type\\":\\"uri\\",\\"value\\":\\"http://telicent.io/data/cat1\\"}}",
          "{\\"o\\":{\\"type\\":\\"uri\\",\\"value\\":\\"http://www.w3.org/ns/dcat#Catalog\\"},\\"p\\":{\\"type\\":\\"uri\\",\\"value\\":\\"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\\"},\\"s\\":{\\"type\\":\\"uri\\",\\"value\\":\\"http://telicent.io/data/cat1\\"}}",
          "{\\"o\\":{\\"type\\":\\"uri\\",\\"value\\":\\"http://www.w3.org/ns/dcat#DataService\\"},\\"p\\":{\\"type\\":\\"uri\\",\\"value\\":\\"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\\"},\\"s\\":{\\"type\\":\\"uri\\",\\"value\\":\\"http://telicent.io/data/dataservice1\\"}}",
          "{\\"o\\":{\\"type\\":\\"uri\\",\\"value\\":\\"http://www.w3.org/ns/dcat#Dataset\\"},\\"p\\":{\\"type\\":\\"uri\\",\\"value\\":\\"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\\"},\\"s\\":{\\"type\\":\\"uri\\",\\"value\\":\\"http://telicent.io/data/dataset1\\"}}",
        ]"
    `);
  });
  it("transformRdfToTree (node)", async () => {
    const res = await api._service.runQuery(`
      SELECT ?s ?p ?o 
      WHERE { ?s ?p ?o }
    `);

    const triples = RDFResponse.parse(res).results.bindings.map((el) =>
      RDFTripleSchema.parse(el)
    );

    const DATASET = "http://www.w3.org/ns/dcat#dataset";
    const SERVICE = "http://www.w3.org/ns/dcat#service";
    const CATALOG = "http://www.w3.org/ns/dcat#catalog";
    const CONNECTIONS = [DATASET, SERVICE, CATALOG];

    const tree = transformRdfToTree({
      triples,
      edgePredicate: (triple) => CONNECTIONS.includes(triple.p.value),
      reverseEdgePredicate: (triple) => false,
    });
    expect(tree).toMatchInlineSnapshot(`
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
            "id": "http://telicent.io/data/cat1",
            "label": "http://telicent.io/data/cat1",
          }
      `);

    expect(
      await enrichRdfTree({ tree, service: api._service, triples })
    ).toEqual({
      id: "http://telicent.io/data/cat1",
      label: "Catalog One",
      children: [
        {
          id: "http://telicent.io/data/dataservice1",
          label: "Data Service One",
          children: [],
        },
        {
          id: "http://telicent.io/data/dataset1",
          label: "Dataset One",
          children: [],
        },
      ],
    });
  });
  it("transformRdfToTree (browser variety)", async () => {
    const DATASET = "http://www.w3.org/ns/dcat#dataset";
    const SERVICE = "http://www.w3.org/ns/dcat#service";
    const CATALOG = "http://www.w3.org/ns/dcat#catalog";
    const CONNECTIONS = [DATASET, SERVICE, CATALOG];

    const RESOURCE = "http://www.w3.org/ns/dcat#resource";
    const CONNECTIONS_REVERSE = [RESOURCE];

    const tree = transformRdfToTree({
      triples: triplesBrowser,
      edgePredicate: (triple) => CONNECTIONS.includes(triple.p.value),
      reverseEdgePredicate: (triple) =>
        CONNECTIONS_REVERSE.includes(triple.p.value),
    });
    expect(tree).toMatchInlineSnapshot(`
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
        "id": "http://telicent.io/data/cat1",
        "label": "http://telicent.io/data/cat1",
      }
    `);

    expect(
      await enrichRdfTree({
        tree,
        service: api._service,
        triples: triplesBrowser,
      })
    ).toMatchInlineSnapshot(`
      {
        "children": [
          {
            "children": [],
            "id": "http://telicent.io/data/dataset1",
            "label": "Dataset One",
          },
          {
            "children": [],
            "id": "http://telicent.io/data/dataservice1",
            "label": "Data Service One",
          },
        ],
        "id": "http://telicent.io/data/cat1",
        "label": "Catalog One",
      }
    `);
  });
});
