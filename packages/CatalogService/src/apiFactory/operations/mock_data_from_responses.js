export const SEARCH_TEMPLATE = (bindings) => ({
  head: {
    vars: [
      "id",
      "uri",
      "title",
      "publisher__email",
      "description",
      "creator",
      "rights",
      "accessRights",
      "owner",
      "_type",
    ],
  },
  results: {
    bindings: bindings,
  },
});

export const COMPLETE_RESULT = {
  id: {
    type: "literal",
    value: "basic_data",
  },
  uri: {
    type: "uri",
    value: "http://test.telicent/catalog#basic_data_dataset",
  },
  title: {
    type: "literal",
    "xml:lang": "en",
    value: "Basic",
  },
  publisher__email: {
    type: "uri",
    value: "file:///fuseki/data/basic@test.telicent",
  },
  description: {
    type: "literal",
    value: "Basic test data, all for test cases",
  },
  creator: {
    type: "literal",
    "xml:lang": "en",
    value: "Tom @ Telicent",
  },
  rights: {
    type: "literal",
    value: "For testing as part of development",
  },
  owner: {
    type: "uri",
    value: "http://telicent.io/catalog#test_data_dataset",
  },
  _type: {
    type: "uri",
    value: "http://www.w3.org/ns/dcat#Dataset",
  },
};

export const COMPLETE_RESULT_EXPECTED_RETURN = {
  id: "basic_data",
  uri: "http://test.telicent/catalog#basic_data_dataset",
  title: "Basic",
  publisher__email: "basic@test.telicent",
  description: "Basic test data, all for test cases",
  modified: "-",
  publishDate: "-",
  accessRights: "-",
  attributionAgentStr: "-",

  attributionRole: "-",
  owner: "http://telicent.io/catalog#test_data_dataset",
  creator: "Tom @ Telicent",
  type: "http://www.w3.org/ns/dcat#Dataset",
  rights: "For testing as part of development",
  distributionId: "-",
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
};

export const INCOMPLETE_RESULT_EXPECTED_RETURN = {
  id: "http://telicent.io/catalog#test_data_dataset",
  uri: "http://telicent.io/catalog#test_data_dataset",
  title: "-",
  publisher__email: "-",
  description: "-",
  modified: "-",
  publishDate: "-",
  accessRights: "-",
  attributionAgentStr: "-",

  attributionRole: "-",
  owner: "-",
  creator: "-",
  type: "http://www.w3.org/ns/dcat#Catalog",
  rights: "-",

  distributionId: "-",
};

export const ADDITIONAL_RESULT = {
  id: {
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
  publisher__email: {
    type: "literal",
    value: "testing@test.telicent",
  },
  description: {
    type: "literal",
    value: "All Testing dataset for testing all things",
  },
  creator: {
    type: "literal",
    value: "Tom @ Telicent",
  },
  rights: {
    type: "literal",
    value: "Testing dataset rights",
  },
  _type: {
    type: "uri",
    value: "http://www.w3.org/ns/dcat#Dataset",
  },
};

export const ADDITIONAL_RESULT_EXPECTED_RETURN = {
  id: "95fd46da-7a61-4707-898f-AAAAAAAAAAAA",
  uri: "http://test.telicent/catalog#95fd46da-7a61-4707-898f-AAAAAAAAAAAA_Dataset",
  title: "Testing Result",
  publisher__email: "testing@test.telicent",
  description: "All Testing dataset for testing all things",
  modified: "-",
  publishDate: "-",
  accessRights: "-",
  attributionAgentStr: "-",

  attributionRole: "-",
  owner: "-",
  creator: "Tom @ Telicent",
  type: "http://www.w3.org/ns/dcat#Dataset",
  rights: "Testing dataset rights",

  distributionId: '-'
};
