import { formatDataAsArray } from "../../../src/__tests__/utils/formatDataAsArray";
import { ACLEDTriples } from "./argsForACLEDCatalog";
test("ACLEDTriples", () => {
  expect(formatDataAsArray(ACLEDTriples).join("\n")).toMatchInlineSnapshot(`
    "s                                                      | p                                               | o
    b0                                                     | http://purl.org/dc/terms/description            | All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restri…
    b0                                                     | http://purl.org/dc/terms/title                  | ACLED Terms of Use & Attribution Policy - 17 October 2023
    b1                                                     | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/prov#Attribution
    b1                                                     | http://www.w3.org/ns/dcat#hadRole               | http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner
    b1                                                     | http://www.w3.org/ns/prov#agent                 | acled
    b2                                                     | http://purl.org/dc/terms/description            | All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restri…
    b2                                                     | http://purl.org/dc/terms/title                  | ACLED Terms of Use & Attribution Policy - 17 October 2023
    b3                                                     | http://purl.org/dc/terms/description            | All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restri…
    b3                                                     | http://purl.org/dc/terms/title                  | ACLED Terms of Use & Attribution Policy - 17 October 2023
    b4                                                     | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/prov#Attribution
    b4                                                     | http://www.w3.org/ns/dcat#hadRole               | http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner
    b4                                                     | http://www.w3.org/ns/prov#agent                 | acled
    b5                                                     | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/prov#Attribution
    b5                                                     | http://www.w3.org/ns/dcat#hadRole               | http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner
    b5                                                     | http://www.w3.org/ns/prov#agent                 | acled
    http://telicent.io/catalog#acled_data_set_dataset      | http://purl.org/dc/terms/description            | All political violence events, demonstration events,and strategic developments recorded in Africa …
    http://telicent.io/catalog#acled_data_set_dataset      | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Dataset
    http://telicent.io/catalog#acled_data_set_dataset      | http://www.w3.org/ns/dcat#distribution          | http://telicent.io/catalog#acled_data_set_distribution
    http://telicent.io/catalog#acled_data_set_dataset      | http://purl.org/dc/terms/title                  | acled
    http://telicent.io/catalog#acled_data_set_dataset      | http://purl.org/dc/terms/title                  | acled
    http://telicent.io/catalog#acled_data_set_dataset      | http://purl.org/dc/terms/rights                 | b0
    http://telicent.io/catalog#acled_data_set_dataset      | http://purl.org/dc/terms/rights                 | b2
    http://telicent.io/catalog#acled_data_set_dataset      | http://purl.org/dc/terms/rights                 | b3
    http://telicent.io/catalog#acled_data_set_dataset      | http://purl.org/dc/terms/rights                 | b6
    http://telicent.io/catalog#acled_data_set_dataset      | http://purl.org/dc/terms/rights                 | b7
    http://telicent.io/catalog#acled_data_set_dataset      | http://purl.org/dc/terms/rights                 | b8
    http://telicent.io/catalog#acled_data_set_dataset      | http://purl.org/dc/terms/rights                 | b9
    http://telicent.io/catalog#acled_data_set_dataset      | http://purl.org/dc/terms/rights                 | b10
    http://telicent.io/catalog#acled_data_set_dataset      | http://purl.org/dc/terms/rights                 | b11
    http://telicent.io/catalog#acled_data_set_dataset      | http://purl.org/dc/terms/rights                 | b12
    http://telicent.io/catalog#acled_data_set_dataset      | http://purl.org/dc/terms/rights                 | b13
    http://telicent.io/catalog#acled_data_set_dataset      | http://purl.org/dc/terms/rights                 | b14
    http://telicent.io/catalog#acled_data_set_dataset      | http://purl.org/dc/terms/rights                 | b15
    http://telicent.io/catalog#acled_data_set_dataset      | http://purl.org/dc/terms/rights                 | b16
    http://telicent.io/catalog#acled_data_set_dataset      | http://purl.org/dc/terms/rights                 | b17
    http://telicent.io/catalog#acled_data_set_dataset      | http://purl.org/dc/terms/rights                 | b18
    http://telicent.io/catalog#acled_data_set_dataset      | http://purl.org/dc/terms/rights                 | b19
    http://telicent.io/catalog#acled_data_set_dataset      | http://purl.org/dc/terms/rights                 | b20
    http://telicent.io/catalog#acled_data_set_dataset      | http://purl.org/dc/terms/rights                 | b21
    http://telicent.io/catalog#acled_data_set_dataset      | http://purl.org/dc/terms/rights                 | b22
    http://telicent.io/catalog#acled_data_set_dataset      | http://purl.org/dc/terms/rights                 | b23
    http://telicent.io/catalog#acled_data_set_dataset      | http://purl.org/dc/terms/rights                 | b24
    http://telicent.io/catalog#acled_data_set_dataset      | http://www.w3.org/ns/prov#qualifiedAttribution  | b1
    http://telicent.io/catalog#acled_data_set_dataset      | http://www.w3.org/ns/prov#qualifiedAttribution  | b4
    http://telicent.io/catalog#acled_data_set_dataset      | http://www.w3.org/ns/prov#qualifiedAttribution  | b5
    http://telicent.io/catalog#acled_data_set_dataset      | http://www.w3.org/ns/prov#qualifiedAttribution  | b25
    http://telicent.io/catalog#acled_data_set_dataset      | http://www.w3.org/ns/prov#qualifiedAttribution  | b26
    http://telicent.io/catalog#acled_data_set_dataset      | http://www.w3.org/ns/prov#qualifiedAttribution  | b27
    http://telicent.io/catalog#acled_data_set_dataset      | http://www.w3.org/ns/prov#qualifiedAttribution  | b28
    http://telicent.io/catalog#acled_data_set_dataset      | http://www.w3.org/ns/prov#qualifiedAttribution  | b29
    http://telicent.io/catalog#acled_data_set_dataset      | http://www.w3.org/ns/prov#qualifiedAttribution  | b30
    http://telicent.io/catalog#acled_data_set_dataset      | http://www.w3.org/ns/prov#qualifiedAttribution  | b31
    http://telicent.io/catalog#acled_data_set_dataset      | http://www.w3.org/ns/prov#qualifiedAttribution  | b32
    http://telicent.io/catalog#acled_data_set_dataset      | http://www.w3.org/ns/prov#qualifiedAttribution  | b33
    http://telicent.io/catalog#acled_data_set_dataset      | http://www.w3.org/ns/prov#qualifiedAttribution  | b34
    http://telicent.io/catalog#acled_data_set_dataset      | http://www.w3.org/ns/prov#qualifiedAttribution  | b35
    http://telicent.io/catalog#acled_data_set_dataset      | http://www.w3.org/ns/prov#qualifiedAttribution  | b36
    http://telicent.io/catalog#acled_data_set_dataset      | http://www.w3.org/ns/prov#qualifiedAttribution  | b37
    http://telicent.io/catalog#acled_data_set_dataset      | http://www.w3.org/ns/prov#qualifiedAttribution  | b38
    http://telicent.io/catalog#acled_data_set_dataset      | http://www.w3.org/ns/prov#qualifiedAttribution  | b39
    http://telicent.io/catalog#acled_data_set_dataset      | http://www.w3.org/ns/prov#qualifiedAttribution  | b40
    http://telicent.io/catalog#acled_data_set_dataset      | http://www.w3.org/ns/prov#qualifiedAttribution  | b41
    http://telicent.io/catalog#acled_data_set_dataset      | http://www.w3.org/ns/prov#qualifiedAttribution  | b42
    http://telicent.io/catalog#acled_data_set_dataset      | http://www.w3.org/ns/prov#qualifiedAttribution  | b43
    http://telicent.io/catalog#acled_data_set_dataset      | http://purl.org/dc/terms/issued                 | 2024-09-13T07:00:00+00:00
    http://telicent.io/catalog#acled_data_set_dataset      | http://purl.org/dc/terms/publisher              | http://telicent.io/catalog#acled
    http://telicent.io/catalog#acled_data_set_dataset      | http://purl.org/dc/terms/identifier             | acled_data_set
    http://telicent.io/catalog#acled_data_set_dataset      | http://purl.org/dc/terms/published              | 2024-09-20T13:00:25.191Z
    b6                                                     | http://purl.org/dc/terms/description            | All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restri…
    b6                                                     | http://purl.org/dc/terms/title                  | ACLED Terms of Use & Attribution Policy - 17 October 2023
    b7                                                     | http://purl.org/dc/terms/description            | All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restri…
    b7                                                     | http://purl.org/dc/terms/title                  | ACLED Terms of Use & Attribution Policy - 17 October 2023
    b25                                                    | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/prov#Attribution
    b25                                                    | http://www.w3.org/ns/dcat#hadRole               | http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner
    b25                                                    | http://www.w3.org/ns/prov#agent                 | acled
    b26                                                    | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/prov#Attribution
    b26                                                    | http://www.w3.org/ns/dcat#hadRole               | http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner
    b26                                                    | http://www.w3.org/ns/prov#agent                 | acled
    b27                                                    | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/prov#Attribution
    b27                                                    | http://www.w3.org/ns/dcat#hadRole               | http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner
    b27                                                    | http://www.w3.org/ns/prov#agent                 | acled
    b8                                                     | http://purl.org/dc/terms/description            | All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restri…
    b8                                                     | http://purl.org/dc/terms/title                  | ACLED Terms of Use & Attribution Policy - 17 October 2023
    b9                                                     | http://purl.org/dc/terms/description            | All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restri…
    b9                                                     | http://purl.org/dc/terms/title                  | ACLED Terms of Use & Attribution Policy - 17 October 2023
    b10                                                    | http://purl.org/dc/terms/description            | All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restri…
    b10                                                    | http://purl.org/dc/terms/title                  | ACLED Terms of Use & Attribution Policy - 17 October 2023
    b28                                                    | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/prov#Attribution
    b28                                                    | http://www.w3.org/ns/dcat#hadRole               | http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner
    b28                                                    | http://www.w3.org/ns/prov#agent                 | acled
    http://telicent.io/catalog#acled_data_set_distribution | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Distribution
    http://telicent.io/catalog#acled_data_set_distribution | http://www.w3.org/ns/dcat#mediaType             | http://www.iana.org/assignments/media-types/text/csv
    http://telicent.io/catalog#acled_data_set_distribution | http://purl.org/dc/terms/title                  | ACLED CSV Distribution
    http://telicent.io/catalog#acled_data_set_distribution | http://purl.org/dc/terms/identifier             | acled_csv
    b29                                                    | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/prov#Attribution
    b29                                                    | http://www.w3.org/ns/dcat#hadRole               | http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner
    b29                                                    | http://www.w3.org/ns/prov#agent                 | acled
    b11                                                    | http://purl.org/dc/terms/description            | All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restri…
    b11                                                    | http://purl.org/dc/terms/title                  | ACLED Terms of Use & Attribution Policy - 17 October 2023
    b30                                                    | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/prov#Attribution
    b30                                                    | http://www.w3.org/ns/dcat#hadRole               | http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner
    b30                                                    | http://www.w3.org/ns/prov#agent                 | acled
    b12                                                    | http://purl.org/dc/terms/description            | All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restri…
    b12                                                    | http://purl.org/dc/terms/title                  | ACLED Terms of Use & Attribution Policy - 17 October 2023
    b13                                                    | http://purl.org/dc/terms/description            | All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restri…
    b13                                                    | http://purl.org/dc/terms/title                  | ACLED Terms of Use & Attribution Policy - 17 October 2023
    b31                                                    | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/prov#Attribution
    b31                                                    | http://www.w3.org/ns/dcat#hadRole               | http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner
    b31                                                    | http://www.w3.org/ns/prov#agent                 | acled
    b14                                                    | http://purl.org/dc/terms/description            | All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restri…
    b14                                                    | http://purl.org/dc/terms/title                  | ACLED Terms of Use & Attribution Policy - 17 October 2023
    b15                                                    | http://purl.org/dc/terms/description            | All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restri…
    b15                                                    | http://purl.org/dc/terms/title                  | ACLED Terms of Use & Attribution Policy - 17 October 2023
    b32                                                    | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/prov#Attribution
    b32                                                    | http://www.w3.org/ns/dcat#hadRole               | http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner
    b32                                                    | http://www.w3.org/ns/prov#agent                 | acled
    b33                                                    | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/prov#Attribution
    b33                                                    | http://www.w3.org/ns/dcat#hadRole               | http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner
    b33                                                    | http://www.w3.org/ns/prov#agent                 | acled
    b16                                                    | http://purl.org/dc/terms/description            | All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restri…
    b16                                                    | http://purl.org/dc/terms/title                  | ACLED Terms of Use & Attribution Policy - 17 October 2023
    b34                                                    | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/prov#Attribution
    b34                                                    | http://www.w3.org/ns/dcat#hadRole               | http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner
    b34                                                    | http://www.w3.org/ns/prov#agent                 | acled
    b35                                                    | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/prov#Attribution
    b35                                                    | http://www.w3.org/ns/dcat#hadRole               | http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner
    b35                                                    | http://www.w3.org/ns/prov#agent                 | acled
    b36                                                    | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/prov#Attribution
    b36                                                    | http://www.w3.org/ns/dcat#hadRole               | http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner
    b36                                                    | http://www.w3.org/ns/prov#agent                 | acled
    b17                                                    | http://purl.org/dc/terms/description            | All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restri…
    b17                                                    | http://purl.org/dc/terms/title                  | ACLED Terms of Use & Attribution Policy - 17 October 2023
    b37                                                    | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/prov#Attribution
    b37                                                    | http://www.w3.org/ns/dcat#hadRole               | http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner
    b37                                                    | http://www.w3.org/ns/prov#agent                 | acled
    b18                                                    | http://purl.org/dc/terms/description            | All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restri…
    b18                                                    | http://purl.org/dc/terms/title                  | ACLED Terms of Use & Attribution Policy - 17 October 2023
    b19                                                    | http://purl.org/dc/terms/description            | All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restri…
    b19                                                    | http://purl.org/dc/terms/title                  | ACLED Terms of Use & Attribution Policy - 17 October 2023
    b38                                                    | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/prov#Attribution
    b38                                                    | http://www.w3.org/ns/dcat#hadRole               | http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner
    b38                                                    | http://www.w3.org/ns/prov#agent                 | acled
    b20                                                    | http://purl.org/dc/terms/description            | All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restri…
    b20                                                    | http://purl.org/dc/terms/title                  | ACLED Terms of Use & Attribution Policy - 17 October 2023
    b21                                                    | http://purl.org/dc/terms/description            | All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restri…
    b21                                                    | http://purl.org/dc/terms/title                  | ACLED Terms of Use & Attribution Policy - 17 October 2023
    b22                                                    | http://purl.org/dc/terms/description            | All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restri…
    b22                                                    | http://purl.org/dc/terms/title                  | ACLED Terms of Use & Attribution Policy - 17 October 2023
    b23                                                    | http://purl.org/dc/terms/description            | All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restri…
    b23                                                    | http://purl.org/dc/terms/title                  | ACLED Terms of Use & Attribution Policy - 17 October 2023
    b39                                                    | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/prov#Attribution
    b39                                                    | http://www.w3.org/ns/dcat#hadRole               | http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner
    b39                                                    | http://www.w3.org/ns/prov#agent                 | acled
    b40                                                    | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/prov#Attribution
    b40                                                    | http://www.w3.org/ns/dcat#hadRole               | http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner
    b40                                                    | http://www.w3.org/ns/prov#agent                 | acled
    http://telicent.io/catalog#acled                       | https://schema.org/name                         | Armed Conflict Location & Event Data Project (ACLED)
    http://telicent.io/catalog#acled                       | https://schema.org/email                        | http://server/unset-base/admin@acleddata.com
    b41                                                    | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/prov#Attribution
    b41                                                    | http://www.w3.org/ns/dcat#hadRole               | http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner
    b41                                                    | http://www.w3.org/ns/prov#agent                 | acled
    b42                                                    | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/prov#Attribution
    b42                                                    | http://www.w3.org/ns/dcat#hadRole               | http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner
    b42                                                    | http://www.w3.org/ns/prov#agent                 | acled
    b43                                                    | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/prov#Attribution
    b43                                                    | http://www.w3.org/ns/dcat#hadRole               | http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner
    b43                                                    | http://www.w3.org/ns/prov#agent                 | acled
    b24                                                    | http://purl.org/dc/terms/description            | All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restri…
    b24                                                    | http://purl.org/dc/terms/title                  | ACLED Terms of Use & Attribution Policy - 17 October 2023"
  `);
});
