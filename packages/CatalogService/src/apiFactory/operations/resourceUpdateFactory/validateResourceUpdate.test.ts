import { validateResourceUpdate } from "./validateResourceUpdate";
import { validateIfDistributionIdentifierIsUnattached } from "../utils/validate/validateIfDistributionIdentifierIsUnattached";

jest.mock("../utils/validate/validateIfDistributionIdentifierIsUnattached");

const mockedValidateDistribution =
  validateIfDistributionIdentifierIsUnattached as jest.MockedFunction<
    typeof validateIfDistributionIdentifierIsUnattached
  >;

const baseParams = {
  catalogService: {} as never,
  operation: {
    type: "dataSet" as const,
    payload: {},
  },
  errors: {},
} as const;

describe("validateResourceUpdate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("passes through when downstream validation returns no errors", async () => {
    mockedValidateDistribution.mockResolvedValue({});

    await expect(validateResourceUpdate(baseParams)).resolves.toBeUndefined();

    expect(mockedValidateDistribution.mock.calls).toMatchInlineSnapshot(`
      [
        [
          {},
          {
            "catalogService": {},
            "errors": {},
            "operation": {
              "payload": {},
              "type": "dataSet",
            },
          },
        ],
      ]
    `);
  });

  it("throws when downstream validation returns field errors", async () => {
    mockedValidateDistribution.mockResolvedValue({
      distributionIdentifier: [
        {
          code: "distribution.identifier.duplicate",
          summary:
            'Distribution identifier "dist-123" is already attached to another dataset',
        },
      ],
    });

    await expect(validateResourceUpdate(baseParams)).rejects
      .toMatchInlineSnapshot(`
      {
        "errors": {
          "distributionIdentifier": [
            {
              "code": "distribution.identifier.duplicate",
              "summary": "Distribution identifier \"dist-123\" is already attached to another dataset",
            },
          ],
        },
      }
    `);
  });
});
