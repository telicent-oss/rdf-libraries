import { storeTripleResultsToValueObject } from "./storeTripleResultsToValueObject";
import { storeTriplesForPhase2 } from "./storeTriplesForPhase2";
import type { FieldError } from "../../apiFactory/operations/utils/fieldError";

jest.mock("./storeTriplesForPhase2");

const mockedStoreTriplesForPhase2 = storeTriplesForPhase2 as jest.MockedFunction<
  typeof storeTriplesForPhase2
>;

const catalogService = {
  runQuery: jest.fn(),
} as never;

const api = {
  createByPredicateFns: {} as never,
  updateByPredicateFns: {} as never,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("storeTripleResultsToValueObject", () => {
  it("collects results and values when writes succeed", async () => {
    mockedStoreTriplesForPhase2.mockImplementation(async ({ instance, property, newValue }) => {
      ((instance as unknown) as Record<string, unknown>)[property] = newValue;
      return [
        {
          type: "create",
          triple: { s: "<s>", p: "dct:title", o: newValue },
          dataset_uri: instance.uri,
          property,
          prev: null,
        },
      ] as never;
    });

    const instance = {
      uri: "http://example.com/dataset#1",
      title: "Old title",
    } as Record<string, unknown>;

    const result = await storeTripleResultsToValueObject({
      uri: "http://example.com/dataset#1",
      uiFields: { title: "New title" },
      instance: instance as never,
      api,
      catalogService,
      storeTriplesForOntology: storeTriplesForPhase2,
    });

    expect(result.values).toEqual({ uri: "http://example.com/dataset#1", title: "New title" });
    expect(result.errors.title).toEqual([]);
    expect(result.results.title).toEqual([
      expect.objectContaining({
        type: "create",
        property: "title",
        triple: { s: "<s>", p: "dct:title", o: "New title" },
      }),
    ]);
  });

  it("throws with field errors when writes fail", async () => {
    const fieldError: FieldError = {
      code: "catalog.identifier.duplicate",
      summary: "Value \"dist-123\" is already used",
    };
    mockedStoreTriplesForPhase2.mockResolvedValue([fieldError] as never);

    const instance = {
      uri: "http://example.com/dataset#1",
    } as Record<string, unknown>;

    await expect(
      storeTripleResultsToValueObject({
        uri: "http://example.com/dataset#1",
        uiFields: { distributionUri: "dist-123" },
        instance: instance as never,
        api,
        catalogService,
        storeTriplesForOntology: storeTriplesForPhase2,
      })
    ).rejects.toEqual(
      expect.objectContaining({
        errors: {
          distributionUri: [fieldError],
        },
        values: expect.objectContaining({
          uri: "http://example.com/dataset#1",
        }),
      })
    );
  });
});
