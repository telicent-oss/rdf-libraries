export const QUERY_STRING = `
      SELECT ?s  ?p ?o ?relationship ?partner ?resourceTitle WHERE {
        {
          SELECT ?s ?p ?o  WHERE {
            {
              SELECT ?s (<http://www.w3.org/1999/02/22-rdf-syntax-ns#type> AS ?p) (<http://www.w3.org/ns/dcat#Dataset> AS ?o) WHERE {
                ?s <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://www.w3.org/ns/dcat#Dataset> .
              }
            } UNION {
              SELECT ?s (<http://www.w3.org/1999/02/22-rdf-syntax-ns#type> AS ?p) (<http://www.w3.org/ns/dcat#DataService> AS ?o) WHERE {
                ?s <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://www.w3.org/ns/dcat#DataService>  .
              }
            } UNION {
              SELECT ?s (<http://www.w3.org/1999/02/22-rdf-syntax-ns#type> AS ?p) (<http://www.w3.org/ns/dcat#Catalog> AS ?o) WHERE {
                ?s <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://www.w3.org/ns/dcat#Catalog> .
              }
            }
          }
        }
        OPTIONAL {
          ?s ?relationship ?partner .
          FILTER(?relationship in (<http://www.w3.org/ns/dcat#dataset>, <http://www.w3.org/ns/dcat#service>, <http://www.w3.org/ns/dcat#catalog>))
        }
        OPTIONAL {
          ?s dct:title ?resourceTitle .
        }
      }
    `;

export const CATALOG_QUERY_TEMPLATE = (bindings) => ({
  head: {
    vars: ["s", "p", "o", "relationship", "partner", "resourceTitle"],
  },
  results: {
    bindings: bindings,
  },
});

export const BASIC_DATA_SET = {
  s: {
    type: "uri",
    value:
      "http://telicent.io/catalog#95fd46da-7a61-4707-898f-AAAAAAAAAAAA_Dataset",
  },
  p: { type: "uri", value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" },
  o: { type: "uri", value: "http://www.w3.org/ns/dcat#Dataset" },
  resourceTitle: {
    type: "literal",
    value: "Basic",
  },
};

export const TEMPLATE_RESULT = (...children) => ({
  id: "all",
  label: "All",
  children: [...children],
});
export const BASIC_RESULT = (...children) => ({
  id: "http://telicent.io/catalog#95fd46da-7a61-4707-898f-AAAAAAAAAAAA_Dataset",
  label: "Basic",
  children: [...children],
});

export const ADDITIONAL_DATA_SET = {
  s: {
    type: "uri",
    value: "http://telicent.io/catalog#additional_data_dataset",
  },
  p: { type: "uri", value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" },
  o: { type: "uri", value: "http://www.w3.org/ns/dcat#Dataset" },
  resourceTitle: { type: "literal", "xml:lang": "en", value: "Additional" },
};

export const ADDITIONAL_RESULT = (...children) => ({
  id: "http://telicent.io/catalog#additional_data_dataset",
  label: "Additional",
  children: [...children],
});

export const OWNER_CATALOG_ITEM = {
  s: {
    type: "uri",
    value: "http://telicent.io/catalog#test_data_dataset",
  },
  p: {
    type: "uri",
    value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
  },
  o: {
    type: "uri",
    value: "http://www.w3.org/ns/dcat#Catalog",
  },
  relationship: {
    type: "uri",
    value: "http://www.w3.org/ns/dcat#dataset",
  },
  partner: {
    type: "uri",
    value: "http://telicent.io/catalog#additional_data_dataset",
  },
};

export const OWNER_RESULT = (...children) => ({
  id: "http://telicent.io/catalog#test_data_dataset",
  label: "http://telicent.io/catalog#test_data_dataset",
  children: [...children],
});

export const OWNER2_CATALOG_ITEM = {
  s: {
    type: "uri",
    value: "http://telicent.io/catalog#owner_data_dataset",
  },
  p: {
    type: "uri",
    value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
  },
  o: {
    type: "uri",
    value: "http://www.w3.org/ns/dcat#Catalog",
  },
  relationship: {
    type: "uri",
    value: "http://www.w3.org/ns/dcat#dataset",
  },
  partner: {
    type: "uri",
    value:
      "http://telicent.io/catalog#95fd46da-7a61-4707-898f-AAAAAAAAAAAA_Dataset",
  },
  resourceTitle: {
    type: "literal",
    value: "Owner",
  },
};

export const OWNER2_RESULT = (...children) => ({
  id: "http://telicent.io/catalog#owner_data_dataset",
  label: "Owner",
  children: [...children],
});

export const OWNER_OF_ALL_CATALOG_ITEM = {
  s: {
    type: "uri",
    value: "http://telicent.io/catalog#top_level_data_dataset",
  },
  p: {
    type: "uri",
    value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
  },
  o: {
    type: "uri",
    value: "http://www.w3.org/ns/dcat#Catalog",
  },
  relationship: {
    type: "uri",
    value: "http://www.w3.org/ns/dcat#dataset",
  },
  partner: {
    type: "uri",
    value: "http://telicent.io/catalog#owner_data_dataset",
  },
  resourceTitle: {
    type: "literal",
    value: "Catalog",
  },
};

export const OWNER_OF_ALL_RESULT = (...children) => ({
  id: "http://telicent.io/catalog#top_level_data_dataset",
  label: "Catalog",
  children: [...children],
});
