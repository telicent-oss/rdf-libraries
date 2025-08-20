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
} from "../../index";
import {
  ADDITIONAL_RESULT,
  COMPLETE_RESULT,
  COMPLETE_RESULT_EXPECTED_RETURN,
  INCOMPLETE_RESULT,
  INCOMPLETE_RESULT_EXPECTED_RETURN,
  SEARCH_TEMPLATE,
} from "./mock_data_from_responses";
import { searchFactory } from "./searchFactory";
import { LongURI } from "@telicent-oss/rdfservice";

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

const setupServiceData = async (
  bindings: DcatResourceQuerySolution[]
): Promise<MockCatalogService> =>
  new MockCatalogService(SEARCH_TEMPLATE(bindings));

test("Check processing of a complete result", async () => {
  const mockService = await setupServiceData([COMPLETE_RESULT]);
  const search = searchFactory(mockService as unknown as CatalogService);
  expect(await search({ dataResourceFilters: ["all"], searchText: "" }))
    .toMatchInlineSnapshot(`
    [
      {
        "contact": "file:///fuseki/data/basic@test.telicent",
        "creator": "http://telicent.io/catalog#test_data_dataset",
        "description": "Basic test data, all for test cases",
        "distributionAvailable": "[distribution__available]",
        "distributionIdentifier": "http://www.w3.org/ns/dcat#abc123_Distribution",
        "distributionMediaType": "[distribution__mediaType]",
        "distributionTitle": "[distribution__title]",
        "distributionURL": "http://www.access.com/url",
        "distributionUri": "http://www.w3.org/ns/dcat#Dataset",
        "identifier": "basic_data",
        "lastModifiedBy": "Tom @ Telicent",
        "modified": "[max_modified]",
        "owner": "[qualifiedAttribution__agent__title]",
        "publishDate": "[min_issued]",
        "rights": "[rights__description]",
        "title": "Basic",
        "type": "http://www.w3.org/ns/dcat#Dataset",
        "uri": "http://test.telicent/catalog#complete_result",
      },
    ]
  `);
});

test("Check processing of an incomplete result", async () => {
  const mockService = await setupServiceData([INCOMPLETE_RESULT]);
  const sf = searchFactory(mockService as unknown as CatalogService);
  const results = await sf({ dataResourceFilters: ["all"], searchText: "" });

  expect(results).toMatchInlineSnapshot(`
    [
      {
        "contact": undefined,
        "creator": undefined,
        "description": undefined,
        "distributionAvailable": undefined,
        "distributionIdentifier": undefined,
        "distributionMediaType": undefined,
        "distributionTitle": undefined,
        "distributionURL": undefined,
        "distributionUri": undefined,
        "identifier": undefined,
        "lastModifiedBy": undefined,
        "modified": undefined,
        "owner": undefined,
        "publishDate": undefined,
        "rights": undefined,
        "title": "This is test data",
        "type": "http://www.w3.org/ns/dcat#Catalog",
        "uri": "http://telicent.io/catalog#test_data_dataset",
      },
    ]
  `);
});

test("search 'basic'", async () => {
  const mockService = await setupServiceData([
    INCOMPLETE_RESULT,
    COMPLETE_RESULT,
  ]);
  const sf = searchFactory(mockService as unknown as CatalogService);
  const results = await sf({
    dataResourceFilters: ["all"],
    searchText: "basic",
  });

  expect(results).toMatchInlineSnapshot(`
    [
      {
        "contact": "file:///fuseki/data/basic@test.telicent",
        "creator": "http://telicent.io/catalog#test_data_dataset",
        "description": "Basic test data, all for test cases",
        "distributionAvailable": "[distribution__available]",
        "distributionIdentifier": "http://www.w3.org/ns/dcat#abc123_Distribution",
        "distributionMediaType": "[distribution__mediaType]",
        "distributionTitle": "[distribution__title]",
        "distributionURL": "http://www.access.com/url",
        "distributionUri": "http://www.w3.org/ns/dcat#Dataset",
        "identifier": "basic_data",
        "lastModifiedBy": "Tom @ Telicent",
        "modified": "[max_modified]",
        "owner": "[qualifiedAttribution__agent__title]",
        "publishDate": "[min_issued]",
        "rights": "[rights__description]",
        "title": "Basic",
        "type": "http://www.w3.org/ns/dcat#Dataset",
        "uri": "http://test.telicent/catalog#complete_result",
      },
    ]
  `);
});

test("Check basic filter", async () => {
  const mockService = await setupServiceData([
    INCOMPLETE_RESULT,
    COMPLETE_RESULT,
  ]);
  const sf = searchFactory(mockService as unknown as CatalogService);
  const results = await sf({
    dataResourceFilters: ["http://test.telicent/catalog#complete_result"],
    searchText: "",
  });

  expect(results).toMatchInlineSnapshot(`
    [
      {
        "contact": "file:///fuseki/data/basic@test.telicent",
        "creator": "http://telicent.io/catalog#test_data_dataset",
        "description": "Basic test data, all for test cases",
        "distributionAvailable": "[distribution__available]",
        "distributionIdentifier": "http://www.w3.org/ns/dcat#abc123_Distribution",
        "distributionMediaType": "[distribution__mediaType]",
        "distributionTitle": "[distribution__title]",
        "distributionURL": "http://www.access.com/url",
        "distributionUri": "http://www.w3.org/ns/dcat#Dataset",
        "identifier": "basic_data",
        "lastModifiedBy": "Tom @ Telicent",
        "modified": "[max_modified]",
        "owner": "[qualifiedAttribution__agent__title]",
        "publishDate": "[min_issued]",
        "rights": "[rights__description]",
        "title": "Basic",
        "type": "http://www.w3.org/ns/dcat#Dataset",
        "uri": "http://test.telicent/catalog#complete_result",
      },
    ]
  `);
});

// DISABLED FEATURE
test.skip("Check owner filter", async () => {
  const mockService = await setupServiceData([
    INCOMPLETE_RESULT,
    COMPLETE_RESULT,
  ]);
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

test("search 'testing' with data resource filtering with []", async () => {
  const mockService = await setupServiceData([
    COMPLETE_RESULT,
    ADDITIONAL_RESULT,
  ]);
  const sf = searchFactory(mockService as unknown as CatalogService);
  const results = await sf({
    dataResourceFilters: [],
    searchText: "testing",
  });

  expect(results).toMatchInlineSnapshot(`
    [
      {
        "contact": "testing@test.telicent",
        "creator": "Tom @ Telicent",
        "description": "All Testing dataset for testing all things",
        "distributionAvailable": undefined,
        "distributionIdentifier": undefined,
        "distributionMediaType": undefined,
        "distributionTitle": undefined,
        "distributionURL": undefined,
        "distributionUri": undefined,
        "identifier": "95fd46da-7a61-4707-898f-AAAAAAAAAAAA",
        "lastModifiedBy": undefined,
        "modified": undefined,
        "owner": "Testing dataset rights",
        "publishDate": undefined,
        "rights": undefined,
        "title": "Testing Result",
        "type": "http://www.w3.org/ns/dcat#Dataset",
        "uri": "http://test.telicent/catalog#95fd46da-7a61-4707-898f-AAAAAAAAAAAA_Dataset",
      },
    ]
  `);
});

test("Check more in depth search and sort", async () => {
  const mockService = await setupServiceData([
    INCOMPLETE_RESULT,
    COMPLETE_RESULT,
    ADDITIONAL_RESULT,
  ]);
  const search = searchFactory(mockService as unknown as CatalogService);
  const results = await search({
    dataResourceFilters: [],
    searchText: "all",
  });

  expect(results).toMatchInlineSnapshot(`
    [
      {
        "contact": "testing@test.telicent",
        "creator": "Tom @ Telicent",
        "description": "All Testing dataset for testing all things",
        "distributionAvailable": undefined,
        "distributionIdentifier": undefined,
        "distributionMediaType": undefined,
        "distributionTitle": undefined,
        "distributionURL": undefined,
        "distributionUri": undefined,
        "identifier": "95fd46da-7a61-4707-898f-AAAAAAAAAAAA",
        "lastModifiedBy": undefined,
        "modified": undefined,
        "owner": "Testing dataset rights",
        "publishDate": undefined,
        "rights": undefined,
        "title": "Testing Result",
        "type": "http://www.w3.org/ns/dcat#Dataset",
        "uri": "http://test.telicent/catalog#95fd46da-7a61-4707-898f-AAAAAAAAAAAA_Dataset",
      },
      {
        "contact": "file:///fuseki/data/basic@test.telicent",
        "creator": "http://telicent.io/catalog#test_data_dataset",
        "description": "Basic test data, all for test cases",
        "distributionAvailable": "[distribution__available]",
        "distributionIdentifier": "http://www.w3.org/ns/dcat#abc123_Distribution",
        "distributionMediaType": "[distribution__mediaType]",
        "distributionTitle": "[distribution__title]",
        "distributionURL": "http://www.access.com/url",
        "distributionUri": "http://www.w3.org/ns/dcat#Dataset",
        "identifier": "basic_data",
        "lastModifiedBy": "Tom @ Telicent",
        "modified": "[max_modified]",
        "owner": "[qualifiedAttribution__agent__title]",
        "publishDate": "[min_issued]",
        "rights": "[rights__description]",
        "title": "Basic",
        "type": "http://www.w3.org/ns/dcat#Dataset",
        "uri": "http://test.telicent/catalog#complete_result",
      },
    ]
  `);
});

test("Check service only called once, cache take over", async () => {
  const MockCatalogServiceSpy = jest.spyOn(
    MockCatalogService.prototype,
    "getAllDCATResources"
  );

  MockCatalogServiceSpy.mockImplementation(async () => {
    return await [];
  });
  const mockService = await setupServiceData([COMPLETE_RESULT]);
  const search = searchFactory(mockService as unknown as CatalogService);

  await search({ dataResourceFilters: ["all"], searchText: "" });

  expect(MockCatalogServiceSpy).toHaveBeenCalled();

  await search({ dataResourceFilters: ["all"], searchText: "" });

  expect(MockCatalogServiceSpy).not.toHaveBeenCalledTimes(2);
  expect(MockCatalogServiceSpy).toHaveBeenCalledTimes(1);

  await search({ dataResourceFilters: ["all"], searchText: "" });

  expect(MockCatalogServiceSpy).not.toHaveBeenCalledTimes(2);

  expect(MockCatalogServiceSpy).not.toHaveBeenCalledTimes(3);

  expect(MockCatalogServiceSpy).toHaveBeenCalledTimes(1);
});
