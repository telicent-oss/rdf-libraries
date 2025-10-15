import { DcatResourceQuerySolution, UIDataResourceType } from "../..";

export const SEARCH_TEMPLATE = (bindings: DcatResourceQuerySolution[]) => ({
  head: {
    vars: [
      "id",
      "uri",
      "title",
      "contactPoint__fn",
      "description",
      "creator",
      "rights",
      "accessRights",
      "owner",
      "_type",
    ],
  },
  results: {
    bindings,
  },
});

export const COMPLETE_RESULT: DcatResourceQuerySolution = {
  identifier: {
    type: "literal",
    value: "basic_data",
  },
  uri: {
    type: "uri",
    value: "http://test.telicent/catalog#complete_result",
  },
  title: {
    type: "literal",
    value: "Basic",
  },
  contactPoint__fn: {
    type: "uri",
    value: "file:///fuseki/data/basic@test.telicent",
  },
  description: {
    type: "literal",
    value: "Basic test data, all for test cases",
  },

  contributor__title: {
    type: "literal",
    value: "Tom @ Telicent",
  },

  accessRights: {
    type: "literal",
    value: "For testing as part of development",
  },
  publisher__title: {
    type: "uri",
    value: "http://telicent.io/catalog#test_data_dataset",
  },
  _type: {
    type: "uri",
    value: "http://www.w3.org/ns/dcat#Dataset",
  },
  distribution: {
    type: "uri",
    value: "http://www.w3.org/ns/dcat#Dataset",
  },
  distribution__identifier: {
    type: "uri",
    value: "http://telicent.io/catalog/distribution#abc123",
  },
  distribution__accessURL: {
    type: "literal",
    value: "http://www.access.com/url",
  },
  distribution__available: {
    type: "literal",
    value: "[distribution__available]",
  },
  distribution__mediaType: {
    type: "literal",
    value: "[distribution__mediaType]",
  },
  distribution__title: {
    type: "literal",
    value: "[distribution__title]",
  },
  max_modified: {
    type: "literal",
    value: "[max_modified]",
  },
  min_issued: {
    type: "literal",
    value: "[min_issued]",
  },
  qualifiedAttribution: {
    type: "literal",
    value: "[qualifiedAttribution]",
  },
  qualifiedAttribution__agent__title: {
    type: "literal",
    value: "[qualifiedAttribution__agent__title]",
  },
  rights__description: {
    type: "literal",
    value: "[rights__description]",
  },
};

export const COMPLETE_RESULT_EXPECTED_RETURN: UIDataResourceType = {
  type: "[type]",
  uri: "[uri]",
  identifier: "-",
  title: "-",
  description: "-",
  contact: "-",
  creator: "-",
  rights: "-",
  owner: "-",
  // Phase 2
  distributionUri: "-",
  distributionIdentifier: "-",
  distributionTitle: "-",
  distributionURL: "-",
  distributionMediaType: "-",
  distributionAvailable: "-",
  lastModifiedBy: "-",
  publishDate: "-",
  modified: "-",
  // accessRights: "-",
  // qualifiedAttribution: "-",
};

export const INCOMPLETE_RESULT = {
  uri: {
    type: "uri",
    value: "http://telicent.io/catalog#test_data_dataset",
  },
  _type: {
    type: "uri",
    value: "http://www.w3.org/ns/dcat#Catalog",
  },
  title: {
    type: "uri",
    value: "This is test data",
  },
} as unknown as DcatResourceQuerySolution;

export const INCOMPLETE_RESULT_EXPECTED_RETURN: UIDataResourceType = {
  identifier: "http://telicent.io/catalog#test_data_dataset",
  uri: "http://telicent.io/catalog#test_data_dataset",
  title: "-",
  contact: "-",
  description: "-",
  modified: "-",
  publishDate: "-",
  // accessRights: "-",
  // qualifiedAttribution: "-",

  distributionUri: "-",
  distributionIdentifier: "-",
  distributionTitle: "-",
  distributionMediaType: "-",
  distributionURL: "-",
  distributionAvailable: "-",
  lastModifiedBy: "-",
  owner: "-",
  creator: "-",
  type: "http://www.w3.org/ns/dcat#Catalog",
  rights: "-",
};

export const ADDITIONAL_RESULT: DcatResourceQuerySolution = {
  identifier: {
    type: "literal",
    value: "95fd46da-7a61-4707-898f-AAAAAAAAAAAA",
  },
  uri: {
    type: "uri",
    value:
      "http://test.telicent/catalog#95fd46da-7a61-4707-898f-AAAAAAAAAAAA_Dataset",
  },
  title: {
    type: "literal",
    value: "Testing Result",
  },
  contactPoint__fn: {
    type: "literal",
    value: "testing@test.telicent",
  },
  description: {
    type: "literal",
    value: "All Testing dataset for testing all things",
  },
  publisher__title: {
    type: "literal",
    value: "Tom @ Telicent",
  },
  qualifiedAttribution__agent__title: {
    type: "literal",
    value: "Testing dataset rights",
  },
  _type: {
    type: "uri",
    value: "http://www.w3.org/ns/dcat#Dataset",
  },
};

export const ADDITIONAL_RESULT_EXPECTED_RETURN: UIDataResourceType = {
  identifier: "95fd46da-7a61-4707-898f-AAAAAAAAAAAA",
  uri: "http://test.telicent/catalog#95fd46da-7a61-4707-898f-AAAAAAAAAAAA_Dataset",
  title: "Testing Result",
  contact: "testing@test.telicent",
  description: "All Testing dataset for testing all things",
  modified: "-",
  publishDate: "-",
  // accessRights: "-",
  // qualifiedAttribution: "-",
  owner: "-",
  creator: "Tom @ Telicent",
  type: "http://www.w3.org/ns/dcat#Dataset",
  rights: "Testing dataset rights",

  distributionUri: "-",
  distributionIdentifier: "-",
  distributionTitle: "-",
  distributionMediaType: "-",
  distributionURL: "-",
  distributionAvailable: "-",
  lastModifiedBy: "-",
};
