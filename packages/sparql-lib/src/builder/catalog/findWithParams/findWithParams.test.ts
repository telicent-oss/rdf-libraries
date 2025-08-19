import { findWithParams } from "./findWithParams";
import { diff } from "@telicent-oss/dev-dependencies-lib";

test("findWithParams", () => {
  const baseline = findWithParams({
    dcatTypes: ["http://example.com#dcatType"],
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
        ?accessRights
        ?issued
        ?_type 
        (GROUP_CONCAT(DISTINCT ?literal; SEPARATOR=", ") AS ?concatLit)
        (GROUP_CONCAT(DISTINCT ?attributionAgentStr; SEPARATOR=", ") AS ?attributionAgents)
        (GROUP_CONCAT(DISTINCT ?attributionRole; SEPARATOR=", ") AS ?attributionRoles)
    WHERE {
        
            
            ?uri a ?_type .
            
        
        
        
        FILTER (?_type IN (<http://example.com#dcatType>)) .
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
    "
  `);

  expect(
    diff(
      baseline,
      findWithParams({
        dcatTypes: ["http://example.com#dcatType"],
        accessRights: "http://example.com#accessRights",
      })
    )
  ).toMatchInlineSnapshot(`
    "===================================================================
    --- a	
    +++ b	
    @@ -29,0 +30,1 @@
    +    ?uri dct:accessRights "http://example.com#accessRights" .
    @@ -31,1 +31,0 @@
    -    
    "
  `);
  expect(
    diff(
      baseline,
      findWithParams({
        dcatTypes: ["http://example.com#dcatType"],
        searchText: "needle in haystack",
      })
    )
  ).toMatchInlineSnapshot(`
    "===================================================================
    --- a	
    +++ b	
    @@ -28,1 +28,1 @@
    -        
    +        ?uri ?pred ?literal .
    @@ -31,1 +31,1 @@
    -    
    +    FILTER(CONTAINS(LCASE(?literal), "needle in haystack")) .
    "
  `);
  expect(
    diff(
      baseline,
      findWithParams({
        dcatTypes: ["http://example.com#dcatType"],
        ownerUri: "http://example.com#abc123_ownerUri",
      })
    )
  ).toMatchInlineSnapshot(`
    "===================================================================
    --- a	
    +++ b	
    @@ -26,3 +26,15 @@
    -        
    -        ?uri a ?_type .
    -        
    +        {
    +            
    +            ?uri a ?_type .
    +            ?uri ?pred ?literal .
    +            FILTER(?uri = <http://example.com#abc123_ownerUri>) .
    +            
    +        }
    +        UNION
    +        {
    +            
    +            ?uri a ?_type .
    +            ?uri ?pred ?literal .
    +            <http://example.com#abc123_ownerUri> ?catRel ?uri .
    +            
    +        }
    "
  `);
  expect(
    diff(
      baseline,
      findWithParams({
        dcatTypes: ["http://example.com#dcatType"],
        searchText: "needle in haystack",
        ownerUri: "http://example.com#abc123_ownerUri",
      })
    )
  ).toMatchInlineSnapshot(`
    "===================================================================
    --- a	
    +++ b	
    @@ -26,3 +26,15 @@
    -        
    -        ?uri a ?_type .
    -        
    +        {
    +            
    +            ?uri a ?_type .
    +            ?uri ?pred ?literal .
    +            FILTER(?uri = <http://example.com#abc123_ownerUri>) .
    +            ?uri ?pred ?literal .
    +        }
    +        UNION
    +        {
    +            
    +            ?uri a ?_type .
    +            ?uri ?pred ?literal .
    +            <http://example.com#abc123_ownerUri> ?catRel ?uri .
    +            ?uri ?pred ?literal .
    +        }
    @@ -31,1 +43,1 @@
    -    
    +    FILTER(CONTAINS(LCASE(?literal), "needle in haystack")) .
    "
  `);
});
