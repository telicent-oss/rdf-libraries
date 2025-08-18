import { COMMON_PREFIXES } from "../constants";

export const findWithOwner = ({
  dcatTypes,
  matchingText,
  ownerUri,
}: {
  dcatTypes: string[];
  matchingText: string;
  ownerUri?: string;
}) => {
  return `
    ${COMMON_PREFIXES}

    SELECT DISTINCT 
        ?uri 
        ?title 
        ?published 
        ?description 
        ?creator 
        ?rights 
        ?modified 
        ?accessRights 
        ?_type 
        (group_concat(DISTINCT ?literal) as ?concatLit)
        (group_concat(DISTINCT ?attributionAgentStr) as ?attributionAgents)
        (group_concat(DISTINCT ?attributionRole) as ?attributionRoles)
        WHERE {
            {
                # Include the parent
                ?uri a ?_type .
                ?uri ?pred ?literal .
                ${ownerUri ? `FILTER(?uri = <${ownerUri}>)` : ``}
            }
            UNION
            {
                ?uri a ?_type .
                ?uri ?pred ?literal .
                ${ownerUri ? `<${ownerUri}> ?catRel ?uri .` : ""}
            }
            BIND (STR(?_type) AS ?typestr) .
            FILTER (?typestr in ("${dcatTypes.join('", "')}") ) .
            FILTER CONTAINS(LCASE(?literal), "${matchingText.toLowerCase()}")
            OPTIONAL {?uri dct:title ?title} 
            OPTIONAL {?uri dct:published ?published} 
            OPTIONAL {?uri dct:modified ?modified} 
            OPTIONAL {?uri dct:description ?description} 
            OPTIONAL {?uri dct:creator ?creator} 
            OPTIONAL {?uri dct:rights ?rights} 
            OPTIONAL {?uri dct:accessRights ?accessRights}
            OPTIONAL {
            ?uri prov:QualifiedAttribution ?attribution .
            ?attribution prov:agent ?attributionAgentStr .
            OPTIONAL { ?attribution prov:hadRole ?attributionRole } .
            }
    } GROUP BY 
        ?uri 
        ?title 
        ?published 
        ?modified 
        ?description 
        ?creator 
        ?accessRights 
        ?rights 
        ?_type
    `;
};
