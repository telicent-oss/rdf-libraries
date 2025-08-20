import { COMMON_PREFIXES, VOCAB } from "../constants";

export const getAllDCATResources = <V extends typeof VOCAB>({
  vocab,
  cls,
  catalog,
  catalogRelation,
  resourceUri,
}: {
  vocab: V;
  cls?: string;
  catalog?: string;
  catalogRelation?: string;
  resourceUri?:string;
}) => {
  const ifAllRelationsThenFilter = catalogRelation
    ? ""
    : `FILTER (?catRel in (
        <${vocab.dcat.dcat_dataset}>,
         <${vocab.dcat.dcat_service}>, 
         <${vocab.dcat.dcat_catalog}>, 
         <${vocab.dcat.dcatResource}>))`;

  const catalogRelationAllOrSpecific = catalogRelation
    ? `<${catalogRelation}>`
    : "?catRel";

  return `
    ${COMMON_PREFIXES}
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
        ${resourceUri ? `VALUES ?uri { <${resourceUri}> }`: ''}
        ${catalog ? `<${catalog}> ${catalogRelationAllOrSpecific} ?uri .` : ""}
        ${
          cls
            ? `BIND (<${cls}> as ?_type)`
            : `FILTER (
                ?_type IN (
                    dcat:Resource,
                    dcat:Dataset,
                    dcat:DataService,
                    dcat:Catalog,
                    dcat:DatasetSeries
                )
            )`
        }
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
            ?parent  ${catalogRelationAllOrSpecific} ?uri .
            ${ifAllRelationsThenFilter}
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
            ?uri            dcat:distribution   ?distribution .
            ?distribution   dct:identifier      ?distribution__identifier .
            ?distribution   dct:title           ?distribution__title .
            ?distribution   dcat:accessURL      ?distribution__accessURL .
            ?distribution   dcat:mediaType      ?distribution__mediaType .
            ?distribution   dct:available       ?distribution__available .
        } .

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
    }`;
};
