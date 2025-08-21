import { VOCAB } from "../constants";
import { getAllDCATResources } from "./getAllDCATResources";
import { diff } from "@telicent-oss/dev-dependencies-lib";

test("findWithParams", () => {
  const baseline = getAllDCATResources({
    vocab: VOCAB,
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
            ?_type                              # type
            ?uri                                #
            ?identifier                         #
            ?title                              #
            ?description                        #
            ?contactPoint                       #   uris.contactPoint
            ?contactPoint__fn                   # contact
            ?publisher                          # uris.publisher
            ?publisher__title                   # creator
            ?rights                             #   uris.rights
            ?rights__description                # rights
            ?accessRights                       # accessRights
            ?qualifiedAttribution               #   uris.qualifiedAttribution
            ?qualifiedAttribution__agent        #   uris.qualifiedAttribution__agent
            ?qualifiedAttribution__agent__title # owner
            # Phase 2
            ?distribution                       # distributionUri, uris.distributionUri
            ?distribution__identifier           # distributionIdentifier
            ?distribution__title                # distributionTitle
            ?distribution__accessURL            #
            ?distribution__mediaType            #
            ?distribution__available            #
            ?contributor                        #   uris.contributor
            ?contributor__title                 # lastModifiedBy
            ?min_issued                         # publishDate
            ?max_modified                       # modified
        WHERE {
            
            
            FILTER (
                    ?_type IN (
                        dcat:Resource,
                        dcat:Dataset,
                        dcat:DataService,
                        dcat:Catalog,
                        dcat:DatasetSeries
                    )
                )
            ?uri a ?_type .
            OPTIONAL { 
                ?uri            dct:title       ?title } .
            OPTIONAL {
                ?uri            dct:identifier  ?identifier } .
            OPTIONAL { 
                ?uri            dct:publisher   ?publisher .
                ?publisher      dct:title       ?publisher__title } .
            OPTIONAL { 
                ?uri            dcat:contactPoint   ?contactPoint .
                ?contactPoint   vcard:fn            ?contactPoint__fn } .
            OPTIONAL { 
                ?uri            dct:description     ?description } .
            OPTIONAL { 
                ?uri            dct:rights          ?rights .
                ?rights         dct:description     ?rights__description } .
            OPTIONAL { 
                ?uri            dct:accessRights    ?accessRights } .
            OPTIONAL { 
                ?parent  ?catRel ?uri .
                FILTER (?catRel in (
            <http://www.w3.org/ns/dcat#dataset>,
             <http://www.w3.org/ns/dcat#service>, 
             <http://www.w3.org/ns/dcat#catalog>, 
             <http://www.w3.org/ns/dcat#Resource>))
            } .
            OPTIONAL {
                ?uri                            prov:qualifiedAttribution   ?qualifiedAttribution .
                ?qualifiedAttribution           prov:agent                  ?qualifiedAttribution__agent .
                ?qualifiedAttribution__agent    dct:title                   ?qualifiedAttribution__agent__title .
                # qualifiedAttribution__agent__title could be encorced by a connection, but after discussions
                # with AG 250814
                # ?qualifiedAttribution           dcat:hadRole                ?qualifiedAttribution__hadRole 
            } .
            OPTIONAL {
            ?uri dcat:distribution ?distribution .
            ?distribution a dcat:Distribution .
            OPTIONAL { ?distribution dct:identifier ?distribution__identifier . }
            OPTIONAL { ?distribution dct:title       ?distribution__title . }
            OPTIONAL { ?distribution dcat:accessURL  ?distribution__accessURL . }
            OPTIONAL { ?distribution dcat:mediaType  ?distribution__mediaType . }
            OPTIONAL { ?distribution dct:available   ?distribution__available . }
            }

            # aggregated modified
            OPTIONAL {
                SELECT ?uri (MAX(?modified) AS ?max_modified) WHERE {
                ?uri dct:modified ?modified .
                FILTER(isLiteral(?modified))
                } GROUP BY ?uri
            }
            # aggregated issued
            OPTIONAL {
                SELECT ?uri (MIN(?issued) AS ?min_issued) WHERE {
                ?uri dct:issued ?issued .
                FILTER(isLiteral(?issued))
                } GROUP BY ?uri
            }
        }"
  `);

  expect(
    diff(
      baseline,
      getAllDCATResources({
        vocab: VOCAB,
        catalog: "http://dcat.com/catalog#123",
      })
    )
  ).toMatchInlineSnapshot(`
    "===================================================================
    --- a	
    +++ b	
    @@ -39,1 +39,1 @@
    -        
    +        <http://dcat.com/catalog#123> ?catRel ?uri .
    "
  `);
  expect(
    diff(
      baseline,
      getAllDCATResources({
        vocab: VOCAB,
        catalogRelation: "http://dcat.com/#hasCatalog",
      })
    )
  ).toMatchInlineSnapshot(`
    "===================================================================
    --- a	
    +++ b	
    @@ -68,6 +68,2 @@
    -            ?parent  ?catRel ?uri .
    -            FILTER (?catRel in (
    -        <http://www.w3.org/ns/dcat#dataset>,
    -         <http://www.w3.org/ns/dcat#service>, 
    -         <http://www.w3.org/ns/dcat#catalog>, 
    -         <http://www.w3.org/ns/dcat#Resource>))
    +            ?parent  <http://dcat.com/#hasCatalog> ?uri .
    +            
    "
  `);
  expect(
    diff(
      baseline,
      getAllDCATResources({
        vocab: VOCAB,
        cls: "http://dcat.com#DataSet",
      })
    )
  ).toMatchInlineSnapshot(`
    "===================================================================
    --- a	
    +++ b	
    @@ -40,9 +40,1 @@
    -        FILTER (
    -                ?_type IN (
    -                    dcat:Resource,
    -                    dcat:Dataset,
    -                    dcat:DataService,
    -                    dcat:Catalog,
    -                    dcat:DatasetSeries
    -                )
    -            )
    +        BIND (<http://dcat.com#DataSet> as ?_type)
    "
  `);
  expect(
    diff(
      baseline,
      getAllDCATResources({
        vocab: VOCAB,
        catalogRelation: "http://dcat.com/#hasCatalog",
        resourceUri: "http://dcat.com/#123_Dataset",
      })
    )
  ).toMatchInlineSnapshot(`
    "===================================================================
    --- a	
    +++ b	
    @@ -37,0 +38,1 @@
    +        VALUES ?uri { <http://dcat.com/#123_Dataset> }
    @@ -39,1 +39,0 @@
    -        
    @@ -68,6 +68,2 @@
    -            ?parent  ?catRel ?uri .
    -            FILTER (?catRel in (
    -        <http://www.w3.org/ns/dcat#dataset>,
    -         <http://www.w3.org/ns/dcat#service>, 
    -         <http://www.w3.org/ns/dcat#catalog>, 
    -         <http://www.w3.org/ns/dcat#Resource>))
    +            ?parent  <http://dcat.com/#hasCatalog> ?uri .
    +            
    "
  `);
});
