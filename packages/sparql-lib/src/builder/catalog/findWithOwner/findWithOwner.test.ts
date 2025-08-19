import { findWithOwner } from "./findWithOwner";
import { diff } from "@telicent-oss/dev-dependencies-lib";

test("findWithOwner", () => {
  const baseline = findWithOwner({
    dcatTypes: ["http://example.com#dcatType"],
    matchingText: "match",
  });
  expect(baseline).toMatchInlineSnapshot(`
    "
        
    PREFIX dcat: <http://www.w3.org/ns/dcat#>
    PREFIX dct: <http://purl.org/dc/terms/>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX prov: <http://www.w3.org/ns/prov#>
    PREFIX tcat: <http://telicent.io/catalog#>
    PREFIX sdo: <https://schema.org/>


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
                    
                }
                UNION
                {
                    ?uri a ?_type .
                    ?uri ?pred ?literal .
                    
                }
                BIND (STR(?_type) AS ?typestr) .
                FILTER (?typestr in ("http://example.com#dcatType") ) .
                FILTER CONTAINS(LCASE(?literal), "match")
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
        "
  `);

  expect(
    diff(
      baseline,
      findWithOwner({
        dcatTypes: ["http://example.com#dcatType"],
        matchingText: "match",
        ownerUri: "http://example.com#abc123_ownerUri",
      })
    )
  ).toMatchInlineSnapshot(`
    "===================================================================
    --- a	
    +++ b	
    @@ -29,1 +29,1 @@
    -                
    +                FILTER(?uri = <http://example.com#abc123_ownerUri>)
    @@ -35,1 +35,1 @@
    -                
    +                <http://example.com#abc123_ownerUri> ?catRel ?uri .
    "
  `);
});
