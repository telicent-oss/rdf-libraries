import type { CatalogService } from "../../index";
import { StoreTripleOperation } from "./createOperations";
import { maybeGetNotUniqueError } from "./maybeGetNotUniqueError";

const mockOperation = ({
  object = "<o>",
}: {
  object?: string;
} = {}): StoreTripleOperation =>
  ({
    triple: {
      s: "<s>",
      p: "<p>",
      o: object,
    },
    dataset_uri: "http://example.com/dataset#1",
  } as unknown as StoreTripleOperation);

const mockCatalogService = (result: boolean) =>
  ({
    runQuery: jest.fn().mockResolvedValue({ boolean: result }),
  } as unknown as CatalogService);

describe("maybeGetNotUniqueError", () => {
  it("returns undefined when no conflict", async () => {
    const catalogService = mockCatalogService(true);
    const operation = mockOperation();

    const error = await maybeGetNotUniqueError(catalogService, operation);

    expect(error).toBeUndefined();
    expect(catalogService.runQuery).toMatchInlineSnapshot(`
      [MockFunction] {
        "calls": [
          [
            "
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX dct: <http://purl.org/dc/terms/>
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

      ASK {
        VALUES (?s ?id) { ( <<s>>  "<o>"^^xsd:string ) }
        OPTIONAL { ?s rdf:type ?t }

        FILTER NOT EXISTS {
          {  # typed S: any OTHER with same type + id
            FILTER(BOUND(?t))
            ?other a ?t ; dct:identifier ?id .
            FILTER(?other != ?s)
          }
          UNION
          {  # untyped S: any OTHER untyped with same id
            FILTER(!BOUND(?t))
            ?other dct:identifier ?id .
            FILTER(?other != ?s)
            FILTER NOT EXISTS { ?other rdf:type ?any }
          }
        }
      }
        # Is Unique Identifier of type
        ",
          ],
        ],
        "results": [
          {
            "type": "return",
            "value": Promise {},
          },
        ],
      }
    `);
  });

  it("returns field error when conflict detected", async () => {
    const catalogService = mockCatalogService(false);
    const operation = mockOperation({ object: "dist-123" });

    const error = await maybeGetNotUniqueError(catalogService, operation);

    expect(error).toMatchInlineSnapshot(`
      {
        "code": "catalog.identifier.duplicate",
        "context": {
          "value": "dist-123",
        },
        "details": "NOT UNIQUE \"dist-123\" already exists",
        "summary": "Value \"dist-123\" is already used",
      }
    `);
  });
});
