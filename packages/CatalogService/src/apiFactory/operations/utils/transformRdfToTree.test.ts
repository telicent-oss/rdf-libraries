import { z } from "zod";
import { transformRdfToTree } from "./transformRdfToTree";
import {
  CATALOG_URI,
  DATASET_URI,
  DCATResourceSchema,
  RDF_TYPE_URI,
  RESOURCE_URI,
  SERVICE_URI,
} from "./common";
import { ACLEDTriples } from "../../../../archieve/DCAT3Interpretation/__mocks__/argsForACLEDCatalog";
import { findTripleBySchema } from "../../../../archieve/utils/triplesOrNeighborWithType";
import { RDFTripleType } from "@telicent-oss/rdfservice";
import { formatDataAsArray } from "packages/CatalogService/src/__tests__/utils/formatDataAsArray";

test("transformRdfToTree", () => {
  const edgePredicate = ({ p }: RDFTripleType) =>
    [DATASET_URI, SERVICE_URI, CATALOG_URI].includes(p.value);

  const reverseEdgePredicate = ({ p }: RDFTripleType) =>
    [RESOURCE_URI].includes(p.value);

  const triples = ACLEDTriples.filter(
    findTripleBySchema({
      s: undefined,
      p: z.literal(RDF_TYPE_URI),
      o: DCATResourceSchema,
    })
  );

  expect(formatDataAsArray(triples)).toMatchInlineSnapshot(`
    [
      "s                                                 | p                                               | o",
      "http://telicent.io/catalog#acled_data_set_dataset | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Dataset",
    ]
  `);

  expect(
    transformRdfToTree({
      triples,
      edgePredicate,
      reverseEdgePredicate,
    })
  ).toMatchInlineSnapshot(`
    [
      {
        "children": [],
        "id": "http://telicent.io/catalog#acled_data_set_dataset",
        "label": "http://telicent.io/catalog#acled_data_set_dataset",
      },
    ]
  `);
});
