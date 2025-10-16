import type { CatalogService } from "../../index";
import { StoreTripleOperation } from "./createOperations";
import { maybeGetErrorForObjectIsUniqueForPredicate } from "./maybeGetErrorForObjectIsUniqueForPredicate";

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

describe("maybeGetErrorForObjectIsUniqueForPredicate", () => {
  it("returns undefined when no conflict", async () => {
    const catalogService = mockCatalogService(true);
    const operation = mockOperation();

    const error = await maybeGetErrorForObjectIsUniqueForPredicate(
      catalogService,
      operation
    );

    expect(error).toBeUndefined();
    expect(catalogService.runQuery).toMatchInlineSnapshot(`
      [MockFunction] {
        "calls": [
          [
            "# For the given (s, p), there is no object different from "o"
      ASK {
        FILTER NOT EXISTS {
          <<s>> <p> ?other .
          FILTER (?other != "<o>")
        }
      }",
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

    const error = await maybeGetErrorForObjectIsUniqueForPredicate(
      catalogService,
      operation
    );

    expect(error).toMatchInlineSnapshot(`
      {
        "code": "catalog.askIfUniqueDistributionUri.duplicate",
        "context": {
          "value": "dist-123",
        },
        "details": "NOT UNIQUE "<p>" ->"dist-123"  already exists",
        "summary": "Value "dist-123" is already used",
      }
    `);
  });
});
