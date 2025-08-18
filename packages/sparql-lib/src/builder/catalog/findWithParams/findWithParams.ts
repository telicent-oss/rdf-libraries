import { COMMON_PREFIXES } from "../constants";

export const findWithParams = ({
  accessRights,
  dcatTypes,
  searchText,
  ownerUri,
}: {
  dcatTypes: string[];
  accessRights?: string;
  searchText?: string;
  ownerUri?: string;
}) => `
${COMMON_PREFIXES}

SELECT DISTINCT 
    ?uri
    ?title
    ?published
    ?description
    ?creator
    ?rights
    ?accessRights
    ?issued
    ?_type 
    (GROUP_CONCAT(DISTINCT ?literal; SEPARATOR=", ") AS ?concatLit)
    (GROUP_CONCAT(DISTINCT ?attributionAgentStr; SEPARATOR=", ") AS ?attributionAgents)
    (GROUP_CONCAT(DISTINCT ?attributionRole; SEPARATOR=", ") AS ?attributionRoles)
WHERE {
    ${
      ownerUri
        ? `
        {
            ${/* Include the parent */ ""}
            ?uri a ?_type .
            ?uri ?pred ?literal .
            FILTER(?uri = <${ownerUri}>) .
            ${searchText ? "?uri ?pred ?literal ." : ""}
        }
        UNION
        {
            ${/* Include children datasets and services */ ""}
            ?uri a ?_type .
            ?uri ?pred ?literal .
            ${ownerUri ? `<${ownerUri}> ?catRel ?uri .` : ""}
            ${searchText ? "?uri ?pred ?literal ." : ""}
        }
    `
        : `
        ${/* When no owner is specified, include all relevant resources */ ""}
        ?uri a ?_type .
        ${searchText ? "?uri ?pred ?literal ." : ""}
    `
    }
    ${accessRights ? `?uri dct:accessRights "${accessRights}" .` : ""}
    ${
      searchText
        ? `FILTER(CONTAINS(LCASE(?literal), "${searchText.toLowerCase()}")) .`
        : ""
    }
    FILTER (?_type IN (${dcatTypes.map((type) => `<${type}>`).join(", ")})) .
    OPTIONAL { ?uri dct:title ?title } .
    OPTIONAL { ?uri dct:issued ?issued } .
    OPTIONAL { ?uri dct:published ?published } .
    OPTIONAL { ?uri dct:description ?description } .
    OPTIONAL { ?uri dct:creator ?creator } .
    OPTIONAL { ?uri dct:rights ?rights } .
    OPTIONAL { ?uri dct:accessRights ?accessRights } .
    OPTIONAL {
        ?uri prov:QualifiedAttribution ?attribution .
        ?attribution prov:agent ?attributionAgentStr .
        OPTIONAL { ?attribution prov:hadRole ?attributionRole } .
    }
}
GROUP BY
    ?uri
    ?title
    ?published
    ?description 
    ?creator
    ?accessRights
    ?rights
    ?_type
`;
