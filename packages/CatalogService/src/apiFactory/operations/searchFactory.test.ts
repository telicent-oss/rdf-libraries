import {
  QueryResponse,
  RDFSResource,
  RDFSResourceDescendant,
} from "@telicent-oss/rdfservice";
import {
  CatalogService,
  DCATCatalog,
  DCATDataService,
  DCATDataset,
  DCATResource,
  DcatResourceQuerySolution,
} from "../../../index";
import {
  ADDITIONAL_RESULT,
  ADDITIONAL_RESULT_EXPECTED_RETURN,
  COMPLETE_RESULT,
  COMPLETE_RESULT_EXPECTED_RETURN,
  INCOMPLETE_RESULT,
  INCOMPLETE_RESULT_EXPECTED_RETURN,
  SEARCH_TEMPLATE,
} from "./mock_data_from_responses";
import { searchFactory } from "./searchFactory";
import { LongURI } from "@telicent-oss/rdfservice";
const getDcModifiedSpy = jest.spyOn(DCATResource.prototype, "getDcModified");

const getDcIssuedSpy = jest.spyOn(DCATResource.prototype, "getDcIssued");

class MockCatalogService {
  nodes: {
    [key: LongURI]: RDFSResource;
  };
  classLookup: {
    [key: LongURI]: RDFSResourceDescendant;
  };
  data: QueryResponse<DcatResourceQuerySolution>;
  dcat = "http://www.w3.org/ns/dcat#";
  constructor(data: QueryResponse<DcatResourceQuerySolution>) {
    this.classLookup = {
      [this.dcat + "Resource"]: DCATResource,
      [this.dcat + "Catalog"]: DCATCatalog,
      [this.dcat + "Dataset"]: DCATDataset,
      [this.dcat + "DataService"]: DCATDataService,
    };
    this.nodes = {};
    this.data = data;
  }
  lookupClass<T extends RDFSResourceDescendant>(
    clsUri: LongURI,
    defaultCls: T
  ) {
    if (this.classLookup[clsUri]) return this.classLookup[clsUri];
    else {
      return defaultCls;
    }
  }
  async getAllDCATResources() {
    return this.data.results.bindings.map((statement) => {
      let Class = DCATResource;
      if (statement._type) {
        Class = this.lookupClass(
          statement._type.value,
          DCATResource
        ) as unknown as typeof DCATResource;
      }
      const dcatResource = new Class(
        this as unknown as CatalogService,
        undefined,
        undefined,
        undefined,
        undefined,
        statement
      );
      return dcatResource;
    });
  }
}

beforeEach(() => {
  getDcModifiedSpy.mockClear();
  getDcIssuedSpy.mockClear();
});
const setupServiceData = async (
  data: QueryResponse<DcatResourceQuerySolution>,
  modifiedDates: string[] = [],
  issuedDates: string[] = []
): Promise<MockCatalogService> => {
  getDcIssuedSpy.mockImplementation(async () => {
    return await issuedDates;
  });
  getDcModifiedSpy.mockImplementation(async () => {
    return await modifiedDates;
  });
  const service = new MockCatalogService(data);
  return service;
};

test("Check processing of a complete result", async () => {
  const mockService = await setupServiceData(
    SEARCH_TEMPLATE([COMPLETE_RESULT])
  );
  const sf = searchFactory(mockService as unknown as CatalogService);
  const EXPECTED_RESULT = [COMPLETE_RESULT_EXPECTED_RETURN];
  const results = await sf({ dataResourceFilters: ["all"], searchText: "" });

  expect(results).toStrictEqual(EXPECTED_RESULT);
});

test("Check processing of an incomplete result", async () => {
  const mockService = await setupServiceData(
    SEARCH_TEMPLATE([INCOMPLETE_RESULT])
  );
  const sf = searchFactory(mockService as unknown as CatalogService);
  const EXPECTED_RESULT = [INCOMPLETE_RESULT_EXPECTED_RETURN];
  const results = await sf({ dataResourceFilters: ["all"], searchText: "" });

  expect(results).toStrictEqual(EXPECTED_RESULT);
});

test("Check basic search", async () => {
  const mockService = await setupServiceData(
    SEARCH_TEMPLATE([INCOMPLETE_RESULT, COMPLETE_RESULT])
  );
  const sf = searchFactory(mockService as unknown as CatalogService);
  const EXPECTED_RESULT = [COMPLETE_RESULT_EXPECTED_RETURN];
  const results = await sf({
    dataResourceFilters: ["all"],
    searchText: "basic",
  });

  expect(results).toStrictEqual(EXPECTED_RESULT);
});

test("Check basic filter", async () => {
  const mockService = await setupServiceData(
    SEARCH_TEMPLATE([INCOMPLETE_RESULT, COMPLETE_RESULT])
  );
  const sf = searchFactory(mockService as unknown as CatalogService);
  const EXPECTED_RESULT = [COMPLETE_RESULT_EXPECTED_RETURN];
  const results = await sf({
    dataResourceFilters: ["http://test.telicent/catalog#basic_data_dataset"],
    searchText: "",
  });

  expect(results).toStrictEqual(EXPECTED_RESULT);
});

test.skip("Check owner filter", async () => {
  const mockService = await setupServiceData(
    SEARCH_TEMPLATE([INCOMPLETE_RESULT, COMPLETE_RESULT])
  );
  const sf = searchFactory(mockService as unknown as CatalogService);
  const EXPECTED_RESULT = [
    INCOMPLETE_RESULT_EXPECTED_RETURN,
    COMPLETE_RESULT_EXPECTED_RETURN,
  ];
  const results = await sf({
    dataResourceFilters: ["http://telicent.io/catalog#test_data_dataset"],
    searchText: "",
  });

  expect(results).toStrictEqual(EXPECTED_RESULT);
});

test("Check basic search", async () => {
  const mockService = await setupServiceData(
    SEARCH_TEMPLATE([COMPLETE_RESULT, ADDITIONAL_RESULT])
  );
  const sf = searchFactory(mockService as unknown as CatalogService);
  const EXPECTED_RESULT = [ADDITIONAL_RESULT_EXPECTED_RETURN];
  const results = await sf({
    dataResourceFilters: [],
    searchText: "testing",
  });

  expect(results).toStrictEqual(EXPECTED_RESULT);
});

test("Check more in depth search and sort", async () => {
  const mockService = await setupServiceData(
    SEARCH_TEMPLATE([INCOMPLETE_RESULT, COMPLETE_RESULT, ADDITIONAL_RESULT])
  );
  const sf = searchFactory(mockService as unknown as CatalogService);
  const EXPECTED_RESULT = [
    ADDITIONAL_RESULT_EXPECTED_RETURN,
    COMPLETE_RESULT_EXPECTED_RETURN,
  ];
  const results = await sf({
    dataResourceFilters: [],
    searchText: "all",
  });

  expect(results).toStrictEqual(EXPECTED_RESULT);
});

test("Check result with dates", async () => {
  const modifiedDates = ["2024-09-13T07:00:00+00:00"];
  const issuedDates = ["2024-12-13T09:44:48.725028113"];
  const mockService = await setupServiceData(
    SEARCH_TEMPLATE([COMPLETE_RESULT]),
    modifiedDates,
    issuedDates
  );
  const sf = searchFactory(mockService as unknown as CatalogService);
  const ADD_DATES_TO_EXPECTED_RETURN = Object.assign(
    {},
    COMPLETE_RESULT_EXPECTED_RETURN
  );
  ADD_DATES_TO_EXPECTED_RETURN.modified = modifiedDates[0];
  ADD_DATES_TO_EXPECTED_RETURN.publishDate = issuedDates[0];
  const EXPECTED_RESULT = [ADD_DATES_TO_EXPECTED_RETURN];
  const results = await sf({ dataResourceFilters: ["all"], searchText: "" });

  expect(results).toStrictEqual(EXPECTED_RESULT);
});

test("Check result with modified", async () => {
  const modifiedDates = ["2024-09-13T07:00:00+00:00"];
  const mockService = await setupServiceData(
    SEARCH_TEMPLATE([COMPLETE_RESULT]),
    modifiedDates
  );
  const sf = searchFactory(mockService as unknown as CatalogService);
  const ADD_DATES_TO_EXPECTED_RETURN = Object.assign(
    {},
    COMPLETE_RESULT_EXPECTED_RETURN
  );
  ADD_DATES_TO_EXPECTED_RETURN.modified = modifiedDates[0];
  const EXPECTED_RESULT = [ADD_DATES_TO_EXPECTED_RETURN];
  const results = await sf({ dataResourceFilters: ["all"], searchText: "" });

  expect(results).toStrictEqual(EXPECTED_RESULT);
});

test("Check service only called once, cache take over", async () => {
  const MockCatalogServiceSpy = jest.spyOn(
    MockCatalogService.prototype,
    "getAllDCATResources"
  );

  MockCatalogServiceSpy.mockImplementation(async () => {
    return await [];
  });
  const mockService = await setupServiceData(
    SEARCH_TEMPLATE([COMPLETE_RESULT])
  );
  const sf = searchFactory(mockService as unknown as CatalogService);

  await sf({ dataResourceFilters: ["all"], searchText: "" });

  expect(MockCatalogServiceSpy).toHaveBeenCalled();

  await sf({ dataResourceFilters: ["all"], searchText: "" });

  expect(MockCatalogServiceSpy).not.toHaveBeenCalledTimes(2);
  expect(MockCatalogServiceSpy).toHaveBeenCalledTimes(1);

  await sf({ dataResourceFilters: ["all"], searchText: "" });

  expect(MockCatalogServiceSpy).not.toHaveBeenCalledTimes(2);

  expect(MockCatalogServiceSpy).not.toHaveBeenCalledTimes(3);

  expect(MockCatalogServiceSpy).toHaveBeenCalledTimes(1);
});
