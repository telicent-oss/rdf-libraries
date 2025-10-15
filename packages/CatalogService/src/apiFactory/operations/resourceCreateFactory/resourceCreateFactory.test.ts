import { COMMON_PREFIXES_MAP } from "../../../constants";
import { resourceCreateFactory } from "./resourceCreateFactory";

jest.mock("@telicent-oss/rdf-write-lib", () => ({
  createByPredicateFnFactory: jest.fn(() => ({})),
  updateByPredicateFnFactory: jest.fn(() => ({})),
}));

jest.mock("../utils/createUriComponents", () => ({
  createUriComponents: jest.fn(),
}));

jest.mock("../../../classes/RDFSResource.DCATResource/storeTripleResultsToValueObject", () => ({
  storeTripleResultsToValueObject: jest.fn(),
}));

jest.mock("./validateResourceCreate", () => ({
  validateResourceCreate: jest.fn(),
}));

import { createUriComponents } from "../utils/createUriComponents";
import { storeTripleResultsToValueObject } from "../../../classes/RDFSResource.DCATResource/storeTripleResultsToValueObject";
import { validateResourceCreate } from "./validateResourceCreate";

const mockedCreateUriComponents =
  createUriComponents as jest.MockedFunction<typeof createUriComponents>;
const mockedStoreTripleResultsToValueObject =
  storeTripleResultsToValueObject as jest.MockedFunction<
    typeof storeTripleResultsToValueObject
  >;
const mockedValidateResourceCreate =
  validateResourceCreate as jest.MockedFunction<
    typeof validateResourceCreate
  >;

describe("resourceCreateFactory", () => {
  const createAsync = jest.fn(async (_service, uri: string) => ({
    uri,
    types: ["http://www.w3.org/ns/dcat#Dataset"],
  }));

  const catalogService = {
    nodes: {} as Record<string, unknown>,
    lookupClass: jest.fn(() => ({
      createAsync,
    })),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedCreateUriComponents.mockResolvedValue({
      uri: `${COMMON_PREFIXES_MAP["tcat-dataset"]}dataset-id`,
      localName: "dataset-id",
      postfix: "_Dataset",
    });
    mockedStoreTripleResultsToValueObject.mockResolvedValue({
      message: "store-result",
    } as never);
    mockedValidateResourceCreate.mockResolvedValue(undefined);
  });

  it("creates dataset URIs from trimmed identifiers and forwards local name", async () => {
    const factory = resourceCreateFactory({
      catalogService: catalogService as never,
      rdfWriteApiClient: {} as never,
    });

    const result = await factory({
      type: "dataSet",
      payload: {
        identifier: "  dataset-id  ",
        title: "Dataset title",
        description: "Lorem ipsum",
      },
    });

    expect(result).toMatchInlineSnapshot(`
{
  "message": "store-result",
}
`);

    expect(mockedCreateUriComponents.mock.calls).toMatchInlineSnapshot(`
[
  [
    {
      "base": "http://telicent.io/catalog/dataset#",
      "identifier": "dataset-id",
      "postfix": "_Dataset",
    },
  ],
]
`);

    const storeCall = mockedStoreTripleResultsToValueObject.mock.calls[0][0];

    expect(storeCall.uri).toBe(
      "http://telicent.io/catalog/dataset#dataset-id"
    );
    expect(storeCall.uiFields).toMatchInlineSnapshot(`
{
  "classType": "http://www.w3.org/ns/dcat#Dataset",
  "description": "Lorem ipsum",
  "identifier": "dataset-id",
  "title": "Dataset title",
}
`);
  });

  it("throws when identifier is blank", async () => {
    const factory = resourceCreateFactory({
      catalogService: catalogService as never,
      rdfWriteApiClient: {} as never,
    });

    await expect(
      factory({
        type: "dataSet",
        payload: {
          identifier: "   ",
          title: "Untitled dataset",
        },
      })
    ).rejects.toMatchInlineSnapshot(`
{
  "errors": {
    "uri": [
      {
        "code": "catalog.uri.invalid",
        "summary": "identifier is required",
      },
    ],
  },
}
`);

    expect(mockedCreateUriComponents).not.toHaveBeenCalled();
    expect(mockedStoreTripleResultsToValueObject).not.toHaveBeenCalled();
  });
});
