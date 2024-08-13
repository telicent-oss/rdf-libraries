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
  afterAll(async () => {
    await Promise.all(api._service.workAsync);
  });
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
  });
  it("transformRdfToTree (node)", async () => {
    const res = await api._service.runQuery(`
      SELECT ?s ?p ?o 
      WHERE { ?s ?p ?o }
    `);

    const triples = RDFResponse.parse(res).results.bindings.map((el) =>
      RDFTripleSchema.parse(el)
    );

    const DATASET = "http://www.w3.org/ns/dcat#Dataset";
    const SERVICE = "http://www.w3.org/ns/dcat#DataService";
    const CATALOG = "http://www.w3.org/ns/dcat#Catalog";
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
      }
    `);

    expect(await enrichRdfTree({ tree, service: api._service, triples }))
      .toMatchInlineSnapshot(`
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
      }
    `);
  });
  it("transformRdfToTree (browser variety)", async () => {
    const DATASET = "http://www.w3.org/ns/dcat#Dataset";
    const SERVICE = "http://www.w3.org/ns/dcat#DataService";
    const CATALOG = "http://www.w3.org/ns/dcat#Catalog";
    const CONNECTIONS = [DATASET, SERVICE, CATALOG];

    const RESOURCE = "http://www.w3.org/ns/dcat#Resource";
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
        "id": "http://telicent.io/data/catalog1",
        "label": "http://telicent.io/data/catalog1",
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
      }
    `);
  });
});
