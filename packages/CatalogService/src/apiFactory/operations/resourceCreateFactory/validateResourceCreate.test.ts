import { validateResourceCreate } from "./validateResourceCreate";
import { validateIfDistributionIdentifierIsUnattached } from "../utils/validate/validateIfDistributionIdentifierIsUnattached";

jest.mock("../utils/validate/validateIfDistributionIdentifierIsUnattached");

const mockedValidateDistribution =
  validateIfDistributionIdentifierIsUnattached as jest.MockedFunction<
    typeof validateIfDistributionIdentifierIsUnattached
  >;

describe("validateResourceCreate", () => {
  const baseParams = {
    catalogService: {} as never,
    operation: {
      type: "dataSet" as const,
      payload: {},
    },
  } as const;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not throw when downstream validation returns no errors", async () => {
    mockedValidateDistribution.mockResolvedValue({});

    await expect(validateResourceCreate(baseParams)).resolves.toBeUndefined();

    expect(mockedValidateDistribution.mock.calls).toMatchInlineSnapshot(`
      [
        [
          {},
          {
            "catalogService": {},
            "operation": {
              "payload": {},
              "type": "dataSet",
            },
          },
        ],
      ]
    `);
  });

  it("throws when downstream validation reports errors", async () => {
    mockedValidateDistribution.mockResolvedValue({
      distributionIdentifier: [
        {
          code: "distribution.identifier.locked",
          summary:
            "Distribution identifier cannot be changed once it has been set",
        },
      ],
    });

    await expect(validateResourceCreate(baseParams)).rejects
      .toMatchInlineSnapshot(`
      {
        "errors": {
          "distributionIdentifier": [
            {
              "code": "distribution.identifier.locked",
              "summary": "Distribution identifier cannot be changed once it has been set",
            },
          ],
        },
      }
    `);
  });
});
