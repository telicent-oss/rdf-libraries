import type { DispatchResult } from "@telicent-oss/rdf-write-lib";
import { createOperations } from "./createOperations";
import { maybeGetErrorForObjectIsUniqueForPredicate } from "./maybeGetErrorForObjectIsUniqueForPredicate";
import { storeTriplesForPhase2 } from "./storeTriplesForPhase2";
import type { FieldError } from "../../apiFactory/operations/utils/fieldError";
import type {
  CreateByPredicateFn,
  UpdateByPredicateFn,
} from "@telicent-oss/rdf-write-lib";

jest.mock("./createOperations");
jest.mock("./maybeGetErrorForObjectIsUniqueForPredicate");

const mockedCreateOperations = createOperations as jest.MockedFunction<
  typeof createOperations
>;
const mockedMaybeGetNotUniqueError =
  maybeGetErrorForObjectIsUniqueForPredicate as jest.MockedFunction<
    typeof maybeGetErrorForObjectIsUniqueForPredicate
  >;

const noop = jest.fn(async () => undefined);

const createProxy = () =>
  new Proxy({} as Record<string, jest.Mock>, {
    get: () => noop,
  });

const api = {
  createByPredicateFns: createProxy() as unknown as CreateByPredicateFn,
  updateByPredicateFns: createProxy() as unknown as UpdateByPredicateFn,
};

const catalogService = {
  runQuery: jest.fn(),
} as never;

const baseOperation = {
  triple: { s: "<s>", p: "dct:title", o: "New title" },
  dataset_uri: "http://example.com/dataset#1",
  property: "title",
} as const;

beforeEach(() => {
  jest.clearAllMocks();
});

const instanceFactory = (extra: Record<string, unknown> = {}) => ({
  uri: "http://example.com/dataset#1",
  ...extra,
}) as unknown as Record<string, unknown>;

describe("storeTriplesForPhase2", () => {
  it("executes operations and returns normalized results", async () => {
    const onSuccess = jest.fn();
    mockedCreateOperations.mockReturnValue([
      {
        ...baseOperation,
        type: "create",
        onSuccess,
      },
    ] as never);

    const instance = instanceFactory({ title: "Old title" });

    const result = await storeTriplesForPhase2({
      instance: instance as never,
      property: "title",
      newValue: "New title",
      api,
      catalogService,
    });

    expect(onSuccess).toHaveBeenCalled();
    expect(result).toEqual([
      expect.objectContaining({
        type: "create",
        dataset_uri: "http://example.com/dataset#1",
        property: "title",
        triple: { s: "<s>", p: "dct:title", o: "New title" },
      }),
    ]);
  });

  it("returns field error when maybeGetErrorForObjectIsUniqueForPredicate reports conflict", async () => {
    const fieldError: FieldError = {
      code: "catalog.identifier.duplicate",
      summary: "Value \"New title\" already exists",
    };
    mockedCreateOperations.mockReturnValue([
      {
        ...baseOperation,
        type: "create",
        checkObjectIsUniqueForPredicate: true,
      },
    ] as never);
    mockedMaybeGetNotUniqueError.mockResolvedValue(fieldError);

    const result = await storeTriplesForPhase2({
      instance: instanceFactory() as never,
      property: "title",
      newValue: "New title",
      api,
      catalogService,
    });

    expect(result).toEqual([
      expect.objectContaining({
        code: "catalog.identifier.duplicate",
        summary: "Value \"New title\" already exists",
        context: expect.objectContaining({
          dataset: "http://example.com/dataset#1",
          predicate: "dct:title",
          property: "title",
        }),
      }),
    ]);
  });

  it("wraps failures from missing create handler", async () => {
    mockedCreateOperations.mockReturnValue([
      {
        ...baseOperation,
        type: "create",
      },
    ] as never);

    const apiWithoutHandler = {
      createByPredicateFns: {} as unknown as CreateByPredicateFn,
      updateByPredicateFns: {} as unknown as UpdateByPredicateFn,
    } as never;

    const result = await storeTriplesForPhase2({
      instance: instanceFactory() as never,
      property: "title",
      newValue: "New title",
      api: apiWithoutHandler,
      catalogService,
    });

    expect(result).toEqual([
      expect.objectContaining({
        code: "catalog.write.error",
        summary: expect.stringContaining("No createFn"),
        context: expect.objectContaining({
          dataset: "http://example.com/dataset#1",
          predicate: "dct:title",
          property: "title",
        }),
      }),
    ]);
  });

  it("returns no-op message when update does not change value", async () => {
    mockedCreateOperations.mockReturnValue([
      {
        ...baseOperation,
        type: "update",
        prev: "Same",
        triple: { ...baseOperation.triple, o: "Same" },
      },
    ] as never);

    const result = await storeTriplesForPhase2({
      instance: instanceFactory({ title: "Same" }) as never,
      property: "title",
      newValue: "Same",
      api,
      catalogService,
    });

    expect(result).toEqual([
      { message: "[title] No-op, unchanged" },
    ]);
  });

  it("executes update operations and calls onSuccess", async () => {
    const onSuccess = jest.fn();
    const updateFn = jest.fn(async () => undefined);
    const updateApi = {
      createByPredicateFns: api.createByPredicateFns,
      updateByPredicateFns: new Proxy({} as Record<string, jest.Mock>, {
        get: () => updateFn,
      }) as unknown as UpdateByPredicateFn,
    } as never;

    mockedCreateOperations.mockReturnValue([
      {
        ...baseOperation,
        type: "update",
        prev: "Old title",
        onSuccess,
      },
    ] as never);

    const result = await storeTriplesForPhase2({
      instance: instanceFactory({ title: "Old title" }) as never,
      property: "title",
      newValue: "New title",
      api: updateApi,
      catalogService,
    });

    expect(updateFn).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
    expect(result).toEqual([
      expect.objectContaining({
        type: "update",
        triple: { s: "<s>", p: "dct:title", o: "New title" },
      }),
    ]);
  });

  it("wraps dispatch errors from update handlers", async () => {
    const updateError = {
      error: "dispatch fail",
      response: {},
    } as unknown as DispatchResult;
    const updateFn = jest.fn(async () => Promise.reject(updateError));
    const updateApi = {
      createByPredicateFns: api.createByPredicateFns,
      updateByPredicateFns: new Proxy({} as Record<string, jest.Mock>, {
        get: () => updateFn,
      }) as unknown as UpdateByPredicateFn,
    } as never;

    mockedCreateOperations.mockReturnValue([
      {
        ...baseOperation,
        type: "update",
        prev: "Old title",
      },
    ] as never);

    const result = await storeTriplesForPhase2({
      instance: instanceFactory({ title: "Old title" }) as never,
      property: "title",
      newValue: "New title",
      api: updateApi,
      catalogService,
    });

    expect(result).toEqual([
      expect.objectContaining({
        code: "catalog.write.error",
        summary: "dispatch fail",
      }),
    ]);
  });

  it("propagates field errors thrown by update handlers", async () => {
    const fieldError: FieldError = {
      code: "catalog.update.failure",
      summary: "Custom field error",
    };
    const updateFn = jest.fn(async () => Promise.reject(fieldError));
    const updateApi = {
      createByPredicateFns: api.createByPredicateFns,
      updateByPredicateFns: new Proxy({} as Record<string, jest.Mock>, {
        get: () => updateFn,
      }) as unknown as UpdateByPredicateFn,
    } as never;

    mockedCreateOperations.mockReturnValue([
      {
        ...baseOperation,
        type: "update",
        prev: "Old title",
      },
    ] as never);

    const result = await storeTriplesForPhase2({
      instance: instanceFactory({ title: "Old title" }) as never,
      property: "title",
      newValue: "New title",
      api: updateApi,
      catalogService,
    });

    expect(result).toEqual([
      expect.objectContaining({
        code: "catalog.update.failure",
        summary: "Custom field error",
      }),
    ]);
  });

  it("adds noop message for operations after an upstream error", async () => {
    const fieldError: FieldError = {
      code: "catalog.identifier.duplicate",
      summary: "Duplicate",
    };
    mockedCreateOperations.mockReturnValue([
      {
        ...baseOperation,
        type: "create",
        checkObjectIsUniqueForPredicate: true,
      },
      {
        ...baseOperation,
        type: "create",
      },
    ] as never);
    mockedMaybeGetNotUniqueError.mockResolvedValueOnce(fieldError).mockResolvedValueOnce(undefined);

    const result = await storeTriplesForPhase2({
      instance: instanceFactory() as never,
      property: "title",
      newValue: "New title",
      api,
      catalogService,
    });

    expect(result).toEqual([
      expect.objectContaining({ summary: "Duplicate" }),
      { message: "[title] No-op, error isErrorUpstream " },
    ]);
  });
});
