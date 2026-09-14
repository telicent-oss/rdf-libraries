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

  describe("when payload.distributionUri triggers a lookup", () => {
    it("returns the input errors unchanged when the distribution is not attached anywhere", async () => {
      catalogService.runQuery.mockResolvedValue({
        head: { vars: [] },
        results: { bindings: [{}] },
      });

      const errors = await validateIfDistributionUriIsUnattached(
        {},
        {
          catalogService: catalogService as never,
          dcatResource: baseDcatResource as never,
          operation: {
            type: "dataSet",
            payload: { distributionUri: "my-dist" },
          },
        }
      );

      expect(catalogService.runQuery).toHaveBeenCalled();
      expect(errors).toEqual({});
    });

    it("returns the input errors unchanged when the distribution is attached to the same resource", async () => {
      catalogService.runQuery.mockResolvedValue({
        head: { vars: [] },
        results: {
          bindings: [{ dataset: { value: baseDcatResource.uri } }],
        },
      });

      const errors = await validateIfDistributionUriIsUnattached(
        {},
        {
          catalogService: catalogService as never,
          dcatResource: baseDcatResource as never,
          operation: {
            type: "dataSet",
            payload: { distributionUri: "my-dist" },
          },
        }
      );

      expect(errors).toEqual({});
    });

    it("appends a distributionUri error when the distribution is attached to another dataset", async () => {
      catalogService.runQuery.mockResolvedValue({
        head: { vars: [] },
        results: {
          bindings: [
            { dataset: { value: "http://example.com/other-dataset" } },
          ],
        },
      });

      const errors = await validateIfDistributionUriIsUnattached(
        { form: [] } as Record<string, FieldError[]>,
        {
          catalogService: catalogService as never,
          dcatResource: baseDcatResource as never,
          operation: {
            type: "dataSet",
            payload: { distributionUri: "my-dist" },
          },
        }
      );

      expect(errors.distributionUri).toHaveLength(1);
      expect(errors.distributionUri?.[0].code).toBe(
        "distribution.askIfDistributionUriIsUnattached"
      );
      expect(errors.distributionUri?.[0].context?.identifier).toBe("my-dist");
      expect(errors.form).toEqual([]);
    });
  });
});
