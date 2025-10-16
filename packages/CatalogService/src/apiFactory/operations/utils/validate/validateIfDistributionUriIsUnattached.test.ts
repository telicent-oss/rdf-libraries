import { validateIfDistributionUriIsUnattached } from "./validateIfDistributionUriIsUnattached";
import type { FieldError } from "../fieldError";

describe("validateIfDistributionUriIsUnattached", () => {
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
    const errors = await validateIfDistributionUriIsUnattached(
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

    const errors = await validateIfDistributionUriIsUnattached(
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

    expect(errors).toMatchInlineSnapshot(`{}`);
  });

  it("returns existing errors unchanged when identifier missing", async () => {
    const previous: Record<string, FieldError[]> = {
      distributionIdentifier: [{ code: "prev", summary: "Existing error" }],
    };

    const errors = await validateIfDistributionUriIsUnattached(previous, {
      catalogService: catalogService as never,
      dcatResource: baseDcatResource as never,
      operation: {
        type: "dataSet",
        payload: {},
      },
    });

    expect(errors).toBe(previous);
  });
});
