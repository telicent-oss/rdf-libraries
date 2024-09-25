import { data } from "./mockData/fromFusekiAfterKafka";
import { RDFTripleSchema } from "@telicent-oss/rdfservice";

test("RDFSchema", () => {
  expect(
    data
      .map((datum, index) => {
        try {
          RDFTripleSchema.parse(datum);
        } catch (err) {
          return `${err} ${JSON.stringify(datum)}`;
        }
        return null;
      })
      .filter(Boolean)
  ).toMatchInlineSnapshot(`
    [
      "[
      {
        "code": "custom",
        "message": "The value must be a valid URI when type is 'uri'",
        "path": [
          "o"
        ]
      }
    ] {"s":{"type":"uri","value":"http://telicent.io/catalog#03c60193-9470-4ca5-8621-c8a9072638ea_Distribution"},"p":{"type":"uri","value":"http://www.w3.org/ns/dcat#downloadURL"},"o":{"type":"uri","value":"file:///adapter/test_data/faux_africa.csv"}}",
    ]
  `);
});
