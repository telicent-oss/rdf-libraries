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
  ).toMatchInlineSnapshot(`[]`);
});
