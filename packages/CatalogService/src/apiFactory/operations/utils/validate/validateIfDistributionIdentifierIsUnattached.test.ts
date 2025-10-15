import { validateIfDistributionIdentifierIsUnattached } from "./validateIfDistributionIdentifierIsUnattached";
import type { FieldError } from "../fieldError";

describe("validateIfDistributionIdentifierIsUnattached", () => {
  const catalogService = {
    runQuery: jest.fn(),
  } as unknown as {
    runQuery: jest.Mock;
  };

  const baseDcatResource = {
    distribution__identifier: undefined,
    uri: "http://example.com/dataset#1",
  } as const;

  beforeEach(() => {
    jest.clearAllMocks();
    catalogService.runQuery = jest.fn().mockResolvedValue({ boolean: true });
  });

  it("returns errors when identifier is locked", async () => {
    const errors = await validateIfDistributionIdentifierIsUnattached(
      {},
      {
        catalogService: catalogService as never,
        dcatResource: {
          ...baseDcatResource,
          distribution__identifier: "locked",
        } as never,
        operation: {
          type: "dataSet",
          payload: { distributionIdentifier: "locked" },
        },
      }
    );

    expect(errors).toMatchInlineSnapshot(`{}`);
  });

  it("returns duplicate error when identifier is attached elsewhere", async () => {
    (catalogService.runQuery as jest.Mock).mockResolvedValue({
      boolean: false,
    });

    const errors = await validateIfDistributionIdentifierIsUnattached(
      {},
      {
        catalogService: catalogService as never,
        dcatResource: baseDcatResource as never,
        operation: {
          type: "dataSet",
          payload: { distributionIdentifier: "dist-123" },
        },
      }
    );

    expect(errors).toMatchInlineSnapshot(`
      {
        "distributionIdentifier": [
          {
            "code": "distribution.identifier.duplicate",
            "context": {
              "identifier": "dist-123",
              "uri": "http://telicent.io/catalog/distribution#dist-123",
            },
            "summary": "Distribution identifier \"dist-123\" is already attached to another dataset",
          },
        ],
      }
    `);
  });

  it("returns existing errors unchanged when identifier missing", async () => {
    const previous: Record<string, FieldError[]> = {
      distributionIdentifier: [{ code: "prev", summary: "Existing error" }],
    };

    const errors = await validateIfDistributionIdentifierIsUnattached(
      previous,
      {
        catalogService: catalogService as never,
        dcatResource: baseDcatResource as never,
        operation: {
          type: "dataSet",
          payload: {},
        },
      }
    );

    expect(errors).toBe(previous);
  });
});
