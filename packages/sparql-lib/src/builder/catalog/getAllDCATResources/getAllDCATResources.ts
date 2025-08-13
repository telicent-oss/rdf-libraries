import { COMMON_PREFIXES, VOCAB } from "../constants";

export const getAllDCATResources = <V extends typeof VOCAB>({
  vocab,
  cls,
  catalog,
  catalogRelation,
}: {
  vocab: V;
  cls?: string;
  catalog?: string;
  catalogRelation?: string;
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
        ?identifier
        ?uri
        ?title
        ?description
        ?publisher__email               # contactEmail
        ?publisher__name                # creator
        ?rights__description             # rights
        ?accessRights
        ?owner
        ?_type
        ?qualifiedAttribution           # attribution
        ?qualifiedAttribution__agent    # attributionAgentStr
        ?qualifiedAttribution__hadRole  # attributionRole
        # Phase 2
        ## distribution
        ?distribution
        ?distribution__title
        ?distribution__downloadURL
        ?distribution__mediaType
        ?distribution__identifier
    WHERE {
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
        OPTIONAL { ?uri dct:title       ?title } .
        OPTIONAL { ?uri dct:identifier  ?identifier } .
        OPTIONAL { 
            ?uri        dct:publisher   ?publisher .
            ?publisher  sdo:name        ?publisher__name .
            ?publisher  sdo:email       ?publisher_email
        } .
        OPTIONAL { 
            ?uri        dct:description ?description } .
        OPTIONAL { 
            ?uri        dct:rights      ?rights .
            ?rights     dct:description ?rights__description
        } .
        OPTIONAL { 
            ?uri        dct:accessRights ?accessRights } .
        OPTIONAL { 
            ?owner  ${catalogRelationAllOrSpecific} ?uri .
            ${ifAllRelationsThenFilter}
        } .
        OPTIONAL {
            ?uri                    prov:QualifiedAttribution ?qualifiedAttribution .
            ?qualifiedAttribution   prov:agent                ?qualifiedAttribution__agent .
            OPTIONAL { 
            ?qualifiedAttribution   prov:hadRole              ?qualifiedAttribution__hadRole 
            } .
        } .
        # Phase 2
        OPTIONAL { 
            ?uri            dcat:distribution   ?distribution .
            ?distribution   dct:title           ?distribution__title .
            ?distribution   dcat:downloadURL    ?distribution__downloadURL .
            ?distribution   dcat:mediaType      ?distribution__mediaType .
            ?distribution   dct:identifier      ?distribution__identifier .
        } .
    }`;
};
