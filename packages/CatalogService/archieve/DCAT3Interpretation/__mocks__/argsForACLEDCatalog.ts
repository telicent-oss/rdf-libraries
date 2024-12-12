import { z } from "zod";

import { RDFTripleSchema } from "@telicent-oss/rdfservice";
import { DCATResourceSchema } from "../../../src/apiFactory/operations/utils/common";

export const ACLEDTriples = z.array(RDFTripleSchema).parse([
  {
    o: {
      type: "literal",
      value:
        "All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restri…",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/description",
    },
    s: {
      type: "bnode",
      value: "b0",
    },
  },
  {
    o: {
      type: "literal",
      value: "ACLED Terms of Use & Attribution Policy - 17 October 2023",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/title",
    },
    s: {
      type: "bnode",
      value: "b0",
    },
  },
  {
    o: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#Attribution",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
    },
    s: {
      type: "bnode",
      value: "b1",
    },
  },
  {
    o: {
      type: "uri",
      value:
        "http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/dcat#hadRole",
    },
    s: {
      type: "bnode",
      value: "b1",
    },
  },
  {
    o: {
      type: "literal",
      value: "acled",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#agent",
    },
    s: {
      type: "bnode",
      value: "b1",
    },
  },
  {
    o: {
      type: "literal",
      value:
        "All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restri…",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/description",
    },
    s: {
      type: "bnode",
      value: "b2",
    },
  },
  {
    o: {
      type: "literal",
      value: "ACLED Terms of Use & Attribution Policy - 17 October 2023",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/title",
    },
    s: {
      type: "bnode",
      value: "b2",
    },
  },
  {
    o: {
      type: "literal",
      value:
        "All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restri…",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/description",
    },
    s: {
      type: "bnode",
      value: "b3",
    },
  },
  {
    o: {
      type: "literal",
      value: "ACLED Terms of Use & Attribution Policy - 17 October 2023",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/title",
    },
    s: {
      type: "bnode",
      value: "b3",
    },
  },
  {
    o: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#Attribution",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
    },
    s: {
      type: "bnode",
      value: "b4",
    },
  },
  {
    o: {
      type: "uri",
      value:
        "http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/dcat#hadRole",
    },
    s: {
      type: "bnode",
      value: "b4",
    },
  },
  {
    o: {
      type: "literal",
      value: "acled",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#agent",
    },
    s: {
      type: "bnode",
      value: "b4",
    },
  },
  {
    o: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#Attribution",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
    },
    s: {
      type: "bnode",
      value: "b5",
    },
  },
  {
    o: {
      type: "uri",
      value:
        "http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/dcat#hadRole",
    },
    s: {
      type: "bnode",
      value: "b5",
    },
  },
  {
    o: {
      type: "literal",
      value: "acled",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#agent",
    },
    s: {
      type: "bnode",
      value: "b5",
    },
  },
  {
    o: {
      type: "literal",
      value:
        "All political violence events, demonstration events,and strategic developments recorded in Africa …",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/description",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "uri",
      value: "http://www.w3.org/ns/dcat#Dataset",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_distribution",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/dcat#distribution",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "literal",
      value: "acled",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/title",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "literal",
      value: "acled",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/title",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "bnode",
      value: "b0",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/rights",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "bnode",
      value: "b2",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/rights",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "bnode",
      value: "b3",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/rights",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "bnode",
      value: "b6",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/rights",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "bnode",
      value: "b7",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/rights",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "bnode",
      value: "b8",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/rights",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "bnode",
      value: "b9",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/rights",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "bnode",
      value: "b10",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/rights",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "bnode",
      value: "b11",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/rights",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "bnode",
      value: "b12",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/rights",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "bnode",
      value: "b13",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/rights",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "bnode",
      value: "b14",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/rights",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "bnode",
      value: "b15",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/rights",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "bnode",
      value: "b16",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/rights",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "bnode",
      value: "b17",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/rights",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "bnode",
      value: "b18",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/rights",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "bnode",
      value: "b19",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/rights",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "bnode",
      value: "b20",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/rights",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "bnode",
      value: "b21",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/rights",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "bnode",
      value: "b22",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/rights",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "bnode",
      value: "b23",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/rights",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "bnode",
      value: "b24",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/rights",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "bnode",
      value: "b1",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#qualifiedAttribution",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "bnode",
      value: "b4",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#qualifiedAttribution",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "bnode",
      value: "b5",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#qualifiedAttribution",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "bnode",
      value: "b25",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#qualifiedAttribution",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "bnode",
      value: "b26",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#qualifiedAttribution",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "bnode",
      value: "b27",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#qualifiedAttribution",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "bnode",
      value: "b28",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#qualifiedAttribution",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "bnode",
      value: "b29",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#qualifiedAttribution",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "bnode",
      value: "b30",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#qualifiedAttribution",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "bnode",
      value: "b31",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#qualifiedAttribution",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "bnode",
      value: "b32",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#qualifiedAttribution",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "bnode",
      value: "b33",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#qualifiedAttribution",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "bnode",
      value: "b34",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#qualifiedAttribution",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "bnode",
      value: "b35",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#qualifiedAttribution",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "bnode",
      value: "b36",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#qualifiedAttribution",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "bnode",
      value: "b37",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#qualifiedAttribution",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "bnode",
      value: "b38",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#qualifiedAttribution",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "bnode",
      value: "b39",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#qualifiedAttribution",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "bnode",
      value: "b40",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#qualifiedAttribution",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "bnode",
      value: "b41",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#qualifiedAttribution",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "bnode",
      value: "b42",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#qualifiedAttribution",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "bnode",
      value: "b43",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#qualifiedAttribution",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "literal",
      value: "2024-09-13T07:00:00+00:00",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/issued",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "uri",
      value: "http://telicent.io/catalog#acled",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/publisher",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "literal",
      value: "acled_data_set",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/identifier",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "literal",
      value: "2024-09-20T13:00:25.191Z",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/published",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_dataset",
    },
  },
  {
    o: {
      type: "literal",
      value:
        "All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restri…",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/description",
    },
    s: {
      type: "bnode",
      value: "b6",
    },
  },
  {
    o: {
      type: "literal",
      value: "ACLED Terms of Use & Attribution Policy - 17 October 2023",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/title",
    },
    s: {
      type: "bnode",
      value: "b6",
    },
  },
  {
    o: {
      type: "literal",
      value:
        "All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restri…",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/description",
    },
    s: {
      type: "bnode",
      value: "b7",
    },
  },
  {
    o: {
      type: "literal",
      value: "ACLED Terms of Use & Attribution Policy - 17 October 2023",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/title",
    },
    s: {
      type: "bnode",
      value: "b7",
    },
  },
  {
    o: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#Attribution",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
    },
    s: {
      type: "bnode",
      value: "b25",
    },
  },
  {
    o: {
      type: "uri",
      value:
        "http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/dcat#hadRole",
    },
    s: {
      type: "bnode",
      value: "b25",
    },
  },
  {
    o: {
      type: "literal",
      value: "acled",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#agent",
    },
    s: {
      type: "bnode",
      value: "b25",
    },
  },
  {
    o: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#Attribution",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
    },
    s: {
      type: "bnode",
      value: "b26",
    },
  },
  {
    o: {
      type: "uri",
      value:
        "http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/dcat#hadRole",
    },
    s: {
      type: "bnode",
      value: "b26",
    },
  },
  {
    o: {
      type: "literal",
      value: "acled",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#agent",
    },
    s: {
      type: "bnode",
      value: "b26",
    },
  },
  {
    o: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#Attribution",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
    },
    s: {
      type: "bnode",
      value: "b27",
    },
  },
  {
    o: {
      type: "uri",
      value:
        "http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/dcat#hadRole",
    },
    s: {
      type: "bnode",
      value: "b27",
    },
  },
  {
    o: {
      type: "literal",
      value: "acled",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#agent",
    },
    s: {
      type: "bnode",
      value: "b27",
    },
  },
  {
    o: {
      type: "literal",
      value:
        "All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restri…",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/description",
    },
    s: {
      type: "bnode",
      value: "b8",
    },
  },
  {
    o: {
      type: "literal",
      value: "ACLED Terms of Use & Attribution Policy - 17 October 2023",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/title",
    },
    s: {
      type: "bnode",
      value: "b8",
    },
  },
  {
    o: {
      type: "literal",
      value:
        "All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restri…",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/description",
    },
    s: {
      type: "bnode",
      value: "b9",
    },
  },
  {
    o: {
      type: "literal",
      value: "ACLED Terms of Use & Attribution Policy - 17 October 2023",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/title",
    },
    s: {
      type: "bnode",
      value: "b9",
    },
  },
  {
    o: {
      type: "literal",
      value:
        "All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restri…",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/description",
    },
    s: {
      type: "bnode",
      value: "b10",
    },
  },
  {
    o: {
      type: "literal",
      value: "ACLED Terms of Use & Attribution Policy - 17 October 2023",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/title",
    },
    s: {
      type: "bnode",
      value: "b10",
    },
  },
  {
    o: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#Attribution",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
    },
    s: {
      type: "bnode",
      value: "b28",
    },
  },
  {
    o: {
      type: "uri",
      value:
        "http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/dcat#hadRole",
    },
    s: {
      type: "bnode",
      value: "b28",
    },
  },
  {
    o: {
      type: "literal",
      value: "acled",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#agent",
    },
    s: {
      type: "bnode",
      value: "b28",
    },
  },
  {
    o: {
      type: "uri",
      value: "http://www.w3.org/ns/dcat#Distribution",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_distribution",
    },
  },
  {
    o: {
      type: "uri",
      value: "http://www.iana.org/assignments/media-types/text/csv",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/dcat#mediaType",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_distribution",
    },
  },
  {
    o: {
      type: "literal",
      value: "ACLED CSV Distribution",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/title",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_distribution",
    },
  },
  {
    o: {
      type: "literal",
      value: "acled_csv",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/identifier",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled_data_set_distribution",
    },
  },
  {
    o: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#Attribution",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
    },
    s: {
      type: "bnode",
      value: "b29",
    },
  },
  {
    o: {
      type: "uri",
      value:
        "http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/dcat#hadRole",
    },
    s: {
      type: "bnode",
      value: "b29",
    },
  },
  {
    o: {
      type: "literal",
      value: "acled",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#agent",
    },
    s: {
      type: "bnode",
      value: "b29",
    },
  },
  {
    o: {
      type: "literal",
      value:
        "All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restri…",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/description",
    },
    s: {
      type: "bnode",
      value: "b11",
    },
  },
  {
    o: {
      type: "literal",
      value: "ACLED Terms of Use & Attribution Policy - 17 October 2023",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/title",
    },
    s: {
      type: "bnode",
      value: "b11",
    },
  },
  {
    o: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#Attribution",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
    },
    s: {
      type: "bnode",
      value: "b30",
    },
  },
  {
    o: {
      type: "uri",
      value:
        "http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/dcat#hadRole",
    },
    s: {
      type: "bnode",
      value: "b30",
    },
  },
  {
    o: {
      type: "literal",
      value: "acled",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#agent",
    },
    s: {
      type: "bnode",
      value: "b30",
    },
  },
  {
    o: {
      type: "literal",
      value:
        "All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restri…",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/description",
    },
    s: {
      type: "bnode",
      value: "b12",
    },
  },
  {
    o: {
      type: "literal",
      value: "ACLED Terms of Use & Attribution Policy - 17 October 2023",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/title",
    },
    s: {
      type: "bnode",
      value: "b12",
    },
  },
  {
    o: {
      type: "literal",
      value:
        "All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restri…",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/description",
    },
    s: {
      type: "bnode",
      value: "b13",
    },
  },
  {
    o: {
      type: "literal",
      value: "ACLED Terms of Use & Attribution Policy - 17 October 2023",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/title",
    },
    s: {
      type: "bnode",
      value: "b13",
    },
  },
  {
    o: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#Attribution",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
    },
    s: {
      type: "bnode",
      value: "b31",
    },
  },
  {
    o: {
      type: "uri",
      value:
        "http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/dcat#hadRole",
    },
    s: {
      type: "bnode",
      value: "b31",
    },
  },
  {
    o: {
      type: "literal",
      value: "acled",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#agent",
    },
    s: {
      type: "bnode",
      value: "b31",
    },
  },
  {
    o: {
      type: "literal",
      value:
        "All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restri…",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/description",
    },
    s: {
      type: "bnode",
      value: "b14",
    },
  },
  {
    o: {
      type: "literal",
      value: "ACLED Terms of Use & Attribution Policy - 17 October 2023",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/title",
    },
    s: {
      type: "bnode",
      value: "b14",
    },
  },
  {
    o: {
      type: "literal",
      value:
        "All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restri…",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/description",
    },
    s: {
      type: "bnode",
      value: "b15",
    },
  },
  {
    o: {
      type: "literal",
      value: "ACLED Terms of Use & Attribution Policy - 17 October 2023",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/title",
    },
    s: {
      type: "bnode",
      value: "b15",
    },
  },
  {
    o: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#Attribution",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
    },
    s: {
      type: "bnode",
      value: "b32",
    },
  },
  {
    o: {
      type: "uri",
      value:
        "http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/dcat#hadRole",
    },
    s: {
      type: "bnode",
      value: "b32",
    },
  },
  {
    o: {
      type: "literal",
      value: "acled",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#agent",
    },
    s: {
      type: "bnode",
      value: "b32",
    },
  },
  {
    o: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#Attribution",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
    },
    s: {
      type: "bnode",
      value: "b33",
    },
  },
  {
    o: {
      type: "uri",
      value:
        "http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/dcat#hadRole",
    },
    s: {
      type: "bnode",
      value: "b33",
    },
  },
  {
    o: {
      type: "literal",
      value: "acled",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#agent",
    },
    s: {
      type: "bnode",
      value: "b33",
    },
  },
  {
    o: {
      type: "literal",
      value:
        "All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restri…",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/description",
    },
    s: {
      type: "bnode",
      value: "b16",
    },
  },
  {
    o: {
      type: "literal",
      value: "ACLED Terms of Use & Attribution Policy - 17 October 2023",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/title",
    },
    s: {
      type: "bnode",
      value: "b16",
    },
  },
  {
    o: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#Attribution",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
    },
    s: {
      type: "bnode",
      value: "b34",
    },
  },
  {
    o: {
      type: "uri",
      value:
        "http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/dcat#hadRole",
    },
    s: {
      type: "bnode",
      value: "b34",
    },
  },
  {
    o: {
      type: "literal",
      value: "acled",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#agent",
    },
    s: {
      type: "bnode",
      value: "b34",
    },
  },
  {
    o: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#Attribution",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
    },
    s: {
      type: "bnode",
      value: "b35",
    },
  },
  {
    o: {
      type: "uri",
      value:
        "http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/dcat#hadRole",
    },
    s: {
      type: "bnode",
      value: "b35",
    },
  },
  {
    o: {
      type: "literal",
      value: "acled",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#agent",
    },
    s: {
      type: "bnode",
      value: "b35",
    },
  },
  {
    o: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#Attribution",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
    },
    s: {
      type: "bnode",
      value: "b36",
    },
  },
  {
    o: {
      type: "uri",
      value:
        "http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/dcat#hadRole",
    },
    s: {
      type: "bnode",
      value: "b36",
    },
  },
  {
    o: {
      type: "literal",
      value: "acled",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#agent",
    },
    s: {
      type: "bnode",
      value: "b36",
    },
  },
  {
    o: {
      type: "literal",
      value:
        "All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restri…",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/description",
    },
    s: {
      type: "bnode",
      value: "b17",
    },
  },
  {
    o: {
      type: "literal",
      value: "ACLED Terms of Use & Attribution Policy - 17 October 2023",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/title",
    },
    s: {
      type: "bnode",
      value: "b17",
    },
  },
  {
    o: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#Attribution",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
    },
    s: {
      type: "bnode",
      value: "b37",
    },
  },
  {
    o: {
      type: "uri",
      value:
        "http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/dcat#hadRole",
    },
    s: {
      type: "bnode",
      value: "b37",
    },
  },
  {
    o: {
      type: "literal",
      value: "acled",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#agent",
    },
    s: {
      type: "bnode",
      value: "b37",
    },
  },
  {
    o: {
      type: "literal",
      value:
        "All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restri…",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/description",
    },
    s: {
      type: "bnode",
      value: "b18",
    },
  },
  {
    o: {
      type: "literal",
      value: "ACLED Terms of Use & Attribution Policy - 17 October 2023",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/title",
    },
    s: {
      type: "bnode",
      value: "b18",
    },
  },
  {
    o: {
      type: "literal",
      value:
        "All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restri…",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/description",
    },
    s: {
      type: "bnode",
      value: "b19",
    },
  },
  {
    o: {
      type: "literal",
      value: "ACLED Terms of Use & Attribution Policy - 17 October 2023",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/title",
    },
    s: {
      type: "bnode",
      value: "b19",
    },
  },
  {
    o: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#Attribution",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
    },
    s: {
      type: "bnode",
      value: "b38",
    },
  },
  {
    o: {
      type: "uri",
      value:
        "http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/dcat#hadRole",
    },
    s: {
      type: "bnode",
      value: "b38",
    },
  },
  {
    o: {
      type: "literal",
      value: "acled",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#agent",
    },
    s: {
      type: "bnode",
      value: "b38",
    },
  },
  {
    o: {
      type: "literal",
      value:
        "All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restri…",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/description",
    },
    s: {
      type: "bnode",
      value: "b20",
    },
  },
  {
    o: {
      type: "literal",
      value: "ACLED Terms of Use & Attribution Policy - 17 October 2023",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/title",
    },
    s: {
      type: "bnode",
      value: "b20",
    },
  },
  {
    o: {
      type: "literal",
      value:
        "All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restri…",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/description",
    },
    s: {
      type: "bnode",
      value: "b21",
    },
  },
  {
    o: {
      type: "literal",
      value: "ACLED Terms of Use & Attribution Policy - 17 October 2023",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/title",
    },
    s: {
      type: "bnode",
      value: "b21",
    },
  },
  {
    o: {
      type: "literal",
      value:
        "All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restri…",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/description",
    },
    s: {
      type: "bnode",
      value: "b22",
    },
  },
  {
    o: {
      type: "literal",
      value: "ACLED Terms of Use & Attribution Policy - 17 October 2023",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/title",
    },
    s: {
      type: "bnode",
      value: "b22",
    },
  },
  {
    o: {
      type: "literal",
      value:
        "All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restri…",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/description",
    },
    s: {
      type: "bnode",
      value: "b23",
    },
  },
  {
    o: {
      type: "literal",
      value: "ACLED Terms of Use & Attribution Policy - 17 October 2023",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/title",
    },
    s: {
      type: "bnode",
      value: "b23",
    },
  },
  {
    o: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#Attribution",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
    },
    s: {
      type: "bnode",
      value: "b39",
    },
  },
  {
    o: {
      type: "uri",
      value:
        "http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/dcat#hadRole",
    },
    s: {
      type: "bnode",
      value: "b39",
    },
  },
  {
    o: {
      type: "literal",
      value: "acled",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#agent",
    },
    s: {
      type: "bnode",
      value: "b39",
    },
  },
  {
    o: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#Attribution",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
    },
    s: {
      type: "bnode",
      value: "b40",
    },
  },
  {
    o: {
      type: "uri",
      value:
        "http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/dcat#hadRole",
    },
    s: {
      type: "bnode",
      value: "b40",
    },
  },
  {
    o: {
      type: "literal",
      value: "acled",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#agent",
    },
    s: {
      type: "bnode",
      value: "b40",
    },
  },
  {
    o: {
      type: "literal",
      value: "Armed Conflict Location & Event Data Project (ACLED)",
    },
    p: {
      type: "uri",
      value: "https://schema.org/name",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled",
    },
  },
  {
    o: {
      type: "uri",
      value: "http://server/unset-base/admin@acleddata.com",
    },
    p: {
      type: "uri",
      value: "https://schema.org/email",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/catalog#acled",
    },
  },
  {
    o: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#Attribution",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
    },
    s: {
      type: "bnode",
      value: "b41",
    },
  },
  {
    o: {
      type: "uri",
      value:
        "http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/dcat#hadRole",
    },
    s: {
      type: "bnode",
      value: "b41",
    },
  },
  {
    o: {
      type: "literal",
      value: "acled",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#agent",
    },
    s: {
      type: "bnode",
      value: "b41",
    },
  },
  {
    o: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#Attribution",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
    },
    s: {
      type: "bnode",
      value: "b42",
    },
  },
  {
    o: {
      type: "uri",
      value:
        "http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/dcat#hadRole",
    },
    s: {
      type: "bnode",
      value: "b42",
    },
  },
  {
    o: {
      type: "literal",
      value: "acled",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#agent",
    },
    s: {
      type: "bnode",
      value: "b42",
    },
  },
  {
    o: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#Attribution",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
    },
    s: {
      type: "bnode",
      value: "b43",
    },
  },
  {
    o: {
      type: "uri",
      value:
        "http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/dcat#hadRole",
    },
    s: {
      type: "bnode",
      value: "b43",
    },
  },
  {
    o: {
      type: "literal",
      value: "acled",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/prov#agent",
    },
    s: {
      type: "bnode",
      value: "b43",
    },
  },
  {
    o: {
      type: "literal",
      value:
        "All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restri…",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/description",
    },
    s: {
      type: "bnode",
      value: "b24",
    },
  },
  {
    o: {
      type: "literal",
      value: "ACLED Terms of Use & Attribution Policy - 17 October 2023",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/title",
    },
    s: {
      type: "bnode",
      value: "b24",
    },
  },
]);

export const argsForACLEDCatalog = {
  type: DCATResourceSchema.parse("http://www.w3.org/ns/dcat#Dataset"),
  id: "b0",
  triples: ACLEDTriples,
};
