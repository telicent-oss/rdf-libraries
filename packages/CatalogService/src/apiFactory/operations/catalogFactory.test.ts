import { QueryResponse } from "@telicent-oss/rdfservice";

import { catalogFactory } from "./catalogFactory";
import {
  ADDITIONAL_DATA_SET,
  ADDITIONAL_RESULT,
  BASIC_DATA_SET,
  BASIC_RESULT,
  CATALOG_QUERY_TEMPLATE,
  OWNER2_CATALOG_ITEM,
  OWNER2_RESULT,
  OWNER_CATALOG_ITEM,
  OWNER_OF_ALL_CATALOG_ITEM,
  OWNER_OF_ALL_RESULT,
  OWNER_RESULT,
  QUERY_STRING,
  TEMPLATE_RESULT,
} from "./mock_catalog_query_data";
import { CatalogService } from "../../classes/RdfService.CatalogService";
import { DcatResourceQuerySolution } from "../..";

const spies = {
  console: {
    warn: jest.spyOn(console, "warn").mockImplementation(() => undefined),
  },
};

class MockCatalogService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  runQuery(query: string) {
    return {};
  }
}
const runQuerySpy = jest.spyOn(MockCatalogService.prototype, "runQuery");

beforeEach(() => {
  runQuerySpy.mockClear();
});

afterAll(() => {
  expect(spies.console.warn.mock.calls).toMatchInlineSnapshot(`[]`);
});

const setupServiceData = async (
  data: DcatResourceQuerySolution[]
): Promise<MockCatalogService> => {
  runQuerySpy.mockImplementation(async () => CATALOG_QUERY_TEMPLATE(data));
  const service = new MockCatalogService();
  return service;
};

test.only("Check empty result for catalog", async () => {
  const mockService = await setupServiceData([]);
  const sf = catalogFactory(mockService as unknown as CatalogService);
  const EXPECTED_RESULT = [TEMPLATE_RESULT()];
  const results = await sf({ dataResourceFilters: ["all"], searchText: "" });
  expect(results).toStrictEqual(EXPECTED_RESULT);
});

test("Check one result in catalog", async () => {
  const mockService = await setupServiceData([BASIC_DATA_SET]);
  const sf = catalogFactory(mockService as unknown as CatalogService);
  const EXPECTED_RESULT = [TEMPLATE_RESULT(BASIC_RESULT())];
  const results = await sf({ dataResourceFilters: ["all"], searchText: "" });
  expect(results).toStrictEqual(EXPECTED_RESULT);
});

test("Check two result at the same level", async () => {
  const mockService = await setupServiceData([
    BASIC_DATA_SET,
    ADDITIONAL_DATA_SET,
  ]);
  const sf = catalogFactory(mockService as unknown as CatalogService);
  const EXPECTED_RESULT = [
    TEMPLATE_RESULT(BASIC_RESULT(), ADDITIONAL_RESULT()),
  ];
  const results = await sf({ dataResourceFilters: ["all"], searchText: "" });
  expect(results).toStrictEqual(EXPECTED_RESULT);
});

test("Check two result at the same level", async () => {
  const mockService = await setupServiceData([
    BASIC_DATA_SET,
    ADDITIONAL_DATA_SET,
  ]);
  const sf = catalogFactory(mockService as unknown as CatalogService);
  const EXPECTED_RESULT = [BASIC_RESULT(), ADDITIONAL_RESULT()];
  const results = await sf({ dataResourceFilters: ["all"], searchText: "" });
  expect(results).toStrictEqual(EXPECTED_RESULT);
});

test("Check owner result with no name", async () => {
  const mockService = await setupServiceData([
    BASIC_DATA_SET,
    ADDITIONAL_DATA_SET,
    OWNER_CATALOG_ITEM,
  ]);
  const sf = catalogFactory(mockService as unknown as CatalogService);
  const EXPECTED_RESULT = [
    TEMPLATE_RESULT(BASIC_RESULT(), OWNER_RESULT(ADDITIONAL_RESULT())),
  ];
  const results = await sf({ dataResourceFilters: ["all"], searchText: "" });

  expect(results).toStrictEqual(EXPECTED_RESULT);
});

test("Check 2 owners result one with a name and one without", async () => {
  const mockService = await setupServiceData([
    BASIC_DATA_SET,
    ADDITIONAL_DATA_SET,
    OWNER_CATALOG_ITEM,
    OWNER2_CATALOG_ITEM,
  ]);
  const sf = catalogFactory(mockService as unknown as CatalogService);
  const EXPECTED_RESULT = [
    TEMPLATE_RESULT(
      OWNER_RESULT(ADDITIONAL_RESULT()),
      OWNER2_RESULT(BASIC_RESULT())
    ),
  ];
  const results = await sf({ dataResourceFilters: ["all"], searchText: "" });

  expect(results).toStrictEqual(EXPECTED_RESULT);
});

test("Check 3 owner hierarchy", async () => {
  const mockService = await setupServiceData([
    OWNER_OF_ALL_CATALOG_ITEM,
    BASIC_DATA_SET,
    OWNER2_CATALOG_ITEM,
  ]);
  const sf = catalogFactory(mockService as unknown as CatalogService);
  const EXPECTED_RESULT = [
    TEMPLATE_RESULT(OWNER_OF_ALL_RESULT(OWNER2_RESULT(BASIC_RESULT()))),
  ];
  const results = await sf({ dataResourceFilters: ["all"], searchText: "" });

  expect(results).toStrictEqual(EXPECTED_RESULT);
});

test("Check query being sent", async () => {
  const mockService = await setupServiceData([]);
  const sf = catalogFactory(mockService as unknown as CatalogService);

  await sf({ dataResourceFilters: ["all"], searchText: "" });
  expect(runQuerySpy).toHaveBeenCalled();
  expect(runQuerySpy).toHaveBeenCalledWith(QUERY_STRING);
});
