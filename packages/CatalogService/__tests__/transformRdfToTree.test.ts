import "jest-fetch-mock"; // WARNING: fails if: import fetchMock from "jest-fetch-mock";

import { RDFSchema, RDFTripleType } from "@telicent-oss/rdfservice/index";
import { transformRdfToTree } from "../api/DataCatalogueFrontend/transformRdfToTree";
import maybeTriples from "./transformRdfToTree.test.mock";
import { enrichRdfTree } from "../api/DataCatalogueFrontend/enrichRdfTree";
import { Api } from "../api/DataCatalogueFrontend";
import { setup } from "../setup";

let api: Api;

const triples = RDFSchema.parse(maybeTriples) as RDFTripleType[];

const DATASET = "http://www.w3.org/ns/dcat#dataset";
const SERVICE = "http://www.w3.org/ns/dcat#service";
const CATALOG = "http://www.w3.org/ns/dcat#catalog";
const CONNECTIONS = [DATASET, SERVICE, CATALOG];

describe("transformRdfToTree", () => {
  beforeAll(async () => {
    api = await setup({ hostName: "http://localhost:3030/" });
  });
  it("transformRdfToTree", async () => {
    const tree = transformRdfToTree({
      triples,
      edgePredicate: (triple) => CONNECTIONS.includes(triple.p.value),
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
});
