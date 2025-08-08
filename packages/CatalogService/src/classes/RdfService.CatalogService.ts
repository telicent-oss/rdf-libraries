import {
  RdfService,
  RDFServiceConfig,
  QueryResponse,
  ResourceFindSolution,
  RankWrapper,
  RDFSResourceDescendant,
  LongURI,
  RDFSResource,
} from "@telicent-oss/rdfservice";
import {
  DcatResourceQuerySolution,
  DCATRankWrapper,
  DcatResourceFindSolution,
  COMMON_PREFIXES,
  DCATCatalog,
  DCATDataService,
  DCATDataset,
  DCATResource,
  DEBUG,
} from "../index";

export class CatalogService extends RdfService {
  static DEFAULT_CONSTRUCTOR_ARGS = {
    triplestoreUri: "http://localhost:3030/",
    dataset: "catalog",
    defaultNamespace: "http://telicent.io/catalog/",
    defaultSecurityLabel: "",
  };

  dcat: string;
  dcatCatalog: string;
  dcatResource: string;
  dcatDataset: string;
  // TODO explain dcat_Dataset vs dcatDataset
  // WHY Cause Ash unawares and caused some confusing
  // NOTES Perhaps indicative of dataset bug?
  dcat_dataset: string;
  dcatDataService: string;
  dcat_service: string;
  dcat_catalog: string;
  vcard: string;
  loaded: boolean = false;
  dataResources: DCATResource[] = [];

  /**
   * An extension of RdfService for managing ontology elements (RDFS and OWL) and diagramatic / style information
   * @param {string="http://localhost:3030/"} triplestoreUri - The host address of the triplestore
   * @param {boolean} [writeEnabled] - set to true if you want to update the data, no default (read only)
   * @param {string="ontology"} dataset - the dataset name in the triplestore
   * @param {string="http://telicent.io/ontology/"} defaultNamespace - the default stub to use when building GUID URIs
   * @param {string=""} defaultSecurityLabel - the security label to apply to data being created in the triplestore (only works in Telicent CORE stack)
   */
  constructor(options: {
    writeEnabled: boolean;
    triplestoreUri?: string;
    dataset?: string;
    defaultNamespace?: string;
    defaultSecurityLabel?: string;
    config?: RDFServiceConfig;
  }) {
    const {
      writeEnabled,
      triplestoreUri,
      dataset,
      defaultNamespace,
      defaultSecurityLabel,
    } = {
      ...CatalogService.DEFAULT_CONSTRUCTOR_ARGS,
      ...options,
    };
    super(
      triplestoreUri,
      dataset,
      defaultNamespace,
      defaultSecurityLabel,
      writeEnabled,
      options.config
    );

    this.dcat = "http://www.w3.org/ns/dcat#";
    this.vcard = "http://www.w3.org/2006/vcard/ns#";

    this.dcatResource = `${this.dcat}Resource`;
    this.dcatCatalog = `${this.dcat}Catalog`;
    this.dcatDataset = `${this.dcat}Dataset`;
    this.dcat_dataset = `${this.dcat}dataset`; // TODO WARNING NOT Dataset
    this.dcatDataService = `${this.dcat}DataService`;
    this.dcat_service = `${this.dcat}service`;
    this.dcat_catalog = `${this.dcat}catalog`;

    this.classLookup[this.dcatResource] = DCATResource;
    this.classLookup[this.dcatDataset] = DCATDataset;
    this.classLookup[this.dcatDataService] = DCATDataService;
    this.classLookup[this.dcatCatalog] = DCATCatalog;
    this.addPrefix("dcat:", this.dcat);
    this.addPrefix("vcard:", this.vcard);
  }

  async rankedWrapForDCAT(
    queryReturn: QueryResponse<ResourceFindSolution>,
    matchingText: string
  ) {
    const items: RankWrapper[] = [];
    let Class: RDFSResourceDescendant = DCATResource;
    const re = matchingText
      ? new RegExp(matchingText.toLowerCase(), "g")
      : undefined;
    let concatLit: string = "";
    if (queryReturn?.results?.bindings) {
      if (queryReturn?.head?.vars) {
        for (const i in queryReturn.results.bindings) {
          const binding = queryReturn.results.bindings[i];
          if (binding._type) {
            // !CRITICAL Defensive coding; Increase stability
            // HOW
            //  - fix types
            // WHY
            //  - Had bug where `cls` was not being re-assigned,
            //    thus creating instances of wrong class
            //    and if this INCORRECT DESERIALIZING code was
            //    executed before CORRECT DESERIALIZING code, then
            //    incorrect instances where stored in cache.
            //    De-serialization into the helper classes
            //    at runtime is very important; and should be
            //    more secured to increase confidence
            // WHEN
            //  - A.S.A.P
            // MERGE QUESTION
            // const types = binding._type.value.split(" ");
            const classKey = binding._type.value;
            Class =
              (this.classLookup[classKey] as RDFSResourceDescendant) ||
              RDFSResource;
          }
          const instance = await Class.createAsync(
            this,
            undefined,
            undefined,
            undefined,
            binding
          );
          //The query concatenates all the matching literals in the result - we can then count the number of matches to provide a basic score for ranking search results.
          let score = 0;
          if (binding.concatLit) {
            concatLit = binding.concatLit.value;
            const match = re ? concatLit.match(re) : false;
            if (match) {
              score = match.length;
            } //Cosplay strong typing
          }

          items.push({ item: instance, score: score });
        }
      }
    }
    return items.sort(this.compareScores);
  }

  /**
   * Returns all instances of the specified resourceType (e.g. dcat:Dataset, dcat:DataService)
   * @param {string} resourceType - OPTIONAL - if set, this will only return datasets belonging to the catalog
   * @param {string} catalog - OPTIONAL - a full URI for the parent catalog. If set, this will only return datasets belonging to the catalog
   * @param {string} catalogRelation - OPTIONAL - prefixed property identifier. If set, this will only return datasets belonging to the catalog via catalogRelation
   * @returns {Array} - An array of dataset objects with URIs, titles, and published dates
   */
  async getAllDCATResources(
    cls?: string,
    catalog?: string,
    catalogRelation?: string
  ): Promise<DCATResource[]> {
    let catalogSelect = "";
    let relFilter = "";
    if (!catalogRelation) {
      catalogRelation = "?catRel";
      relFilter = `FILTER (?catRel in (<${this.dcat_dataset}>, <${this.dcat_service}>, <${this.dcat_catalog}>, <${this.dcatResource}>))`;
    } else {
      catalogRelation = `<${catalogRelation}>`;
    }
    if (catalog) {
      catalogSelect = `<${catalog}> ${catalogRelation} ?uri .`;
    }
    let typeSelect = "";
    if (cls) {
      // REQUIREMENT 6.3 Search by dataResourceFilter: selected data-resources
      // Perfect. cls is optional.
      typeSelect = `BIND (<${cls}> as ?_type)`;
    } else {
      typeSelect =
        "FILTER (?_type IN (dcat:Resource, dcat:Dataset, dcat:DataService, dcat:Catalog, dcat:DatasetSeries))";
    }
    // !CRITICAL PREFIX below is hacked in.
    const query = `
            ${COMMON_PREFIXES}
            
            SELECT DISTINCT
              ?id
              ?uri
              ?title
              ?contactEmail
              ?description
              ?creator
              ?rights
              ?accessRights
              ?owner
              ?_type
              ?attributionAgentStr
              ?attributionRole
              ?attribution
              # Phase 2
              ## distribution
              ?distributionUri
              ?distributionTitle
              ?distributionDownloadURL
              ?distributionMediaType
              ?distributionIdentifier
            WHERE {
                ${catalogSelect}
                ${typeSelect}
                ?uri a ?_type .
                OPTIONAL { ?uri dct:title ?title } .
                OPTIONAL { ?uri dct:identifier ?id } .
                OPTIONAL { 
                  ?uri dct:publisher ?publisher .
                  ?publisher <https://schema.org/email> ?contactEmail 
                } .
                OPTIONAL { 
                  ?uri dct:publisher ?publisher .
                  ?publisher <https://schema.org/name> ?creator 
                } .
                OPTIONAL { ?uri dct:description ?description } .
                OPTIONAL { 
                  ?uri dct:rights ?dstRights .
                  ?dstRights dct:description ?rights
                } .
                OPTIONAL { ?uri dct:accessRights ?accessRights } .
                OPTIONAL { 
                  ?owner ?catRel ?uri .
                  ${relFilter}
                } .
                OPTIONAL {
                  ?uri prov:QualifiedAttribution ?attribution .
                  ?attribution prov:agent ?attributionAgentStr .
                  OPTIONAL { ?attribution prov:hadRole ?attributionRole } .
                } .
                # Phase 2
                OPTIONAL { 
                  ?uri dcat:distribution ?distributionUri .
                  ?distributionUri dct:title ?distributionTitle .
                  ?distributionUri dcat:downloadURL ?distributionDownloadURL .
                  ?distributionUri dcat:mediaType ?distributionMediaType .
                  ?distributionUri dct:identifier ?distributionIdentifier .
                } .
            }`;
    const results = await this.runQuery<DcatResourceQuerySolution>(query);
    const resources: DCATResource[] = results.results.bindings.map(
      (statement: DcatResourceQuerySolution) => {
        let Class = DCATResource;
        if (statement._type) {
          Class = this.lookupClass(
            statement._type.value,
            DCATResource
          ) as unknown as typeof DCATResource;
        }
        const dcatResource = new Class(
          this,
          undefined,
          undefined,
          undefined,
          undefined,
          statement
        );
        return dcatResource;
      }
    );
    // REQUIREMENT 6.4 Search by dataResourceFilter: selected data-resources
    // I don't see any sort clause, but I assume the returned sort order will be sensible; Or can be made sensible.
    return resources;
  }

  /**
   * Returns all instances of dcat:Dataset
   * @returns {Array} - An array of dataset objects with URIs, titles, and published dates
   */
  async getAllDatasets(): Promise<DCATDataset[]> {
    return this.getAllDCATResources("dcat:Dataset");
  }

  /**
   * Returns all instances of dcat:DataService
   * @returns {Array} - An array of DataService objects with URIs, titles, and published dates
   */
  async getDataServices(): Promise<DCATDataService[]> {
    return this.getAllDCATResources("dcat:DataService") as unknown as Promise<
      DCATDataService[]
    >; // !CRITICAL validate
  }

  /**
   * Returns all instances of dcat:DataService
   * @returns {Array} - An array of DataService objects with URIs, titles, and published dates
   */
  async getAllCatalogs(): Promise<DCATCatalog[]> {
    return this.getAllDCATResources("dcat:Catalog") as Promise<DCATCatalog[]>;
  }

  /**
   * Performs a very basic string-matching search - this should be used if no search index is available. The method will return a very basic match count that can be used to rank results.
   * @param {string} matchingText - The text string to find in the data
   * @param {Array} dcatTypes - OPTIONAL - the types of dcat items to search for - defaults to [dcat:Catalog, dcat:Dataset, dcat:DataService]
   * @returns {Array} - An array of DataService objects with URIs, titles, and published dates
   */
  // REQUIREMENT 7.1 Search by input text
  // Code. Hm. This looks like it won't take search and dataresource owner....
  async findWithOwner(
    matchingText: string,
    dcatTypes: LongURI[] = [
      this.dcatCatalog,
      this.dcatDataService,
      this.dcatDataset,
    ],
    owner: DCATCatalog | DCATDataService | DCATDataset
  ): Promise<RankWrapper[]> {
    const query = `
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
                      ${owner ? `FILTER(?uri = <${owner.uri}>)` : ``}
                  }
                  UNION
                  {
                      ?uri a ?_type .
                      ?uri ?pred ?literal .
                      ${owner ? `<${owner.uri}> ?catRel ?uri .` : ""}
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
    const results = await this.runQuery<ResourceFindSolution>(query);
    return this.rankedWrap(results, matchingText);
  }

  /**
   * Finds DCAT resources based on provided parameters.
   *
   * @param params - An object containing dcatTypes and optional search parameters.
   * @returns A promise that resolves to an array of RankWrapper objects.
   */
  async findWithParams({
    searchText,
    owner,
    accessRights,
    dcatTypes = [
      "http://www.w3.org/ns/dcat#Catalog",
      "http://www.w3.org/ns/dcat#DataService",
      "http://www.w3.org/ns/dcat#Dataset",
    ],
  }: {
    searchText?: string;
    owner?: DCATCatalog | DCATDataService | DCATDataset;
    accessRights?: string;
    dcatTypes?: string[];
  }): Promise<DCATRankWrapper[]> {
    // Construct the SPARQL query with inline conditions
    const query = `
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
              owner
                ? `
                {
                    ${/* Include the parent */ ""}
                    ?uri a ?_type .
                    ?uri ?pred ?literal .
                    FILTER(?uri = <${owner.uri}>) .
                    ${searchText ? "?uri ?pred ?literal ." : ""}
                }
                UNION
                {
                    ${/* Include children datasets and services */ ""}
                    ?uri a ?_type .
                    ?uri ?pred ?literal .
                    ${owner ? `<${owner.uri}> ?catRel ?uri .` : ""}
                    ${searchText ? "?uri ?pred ?literal ." : ""}
                }
            `
                : `
              ${
                /* When no owner is specified, include all relevant resources */ ""
              }
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
            FILTER (?_type IN (${dcatTypes
              .map((type) => `<${type}>`)
              .join(", ")})) .
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

    // Optionally, log the query for debugging purposes
    DEBUG && console.log("Constructed SPARQL Query:", query);

    try {
      // Execute the query using the runQuery method
      const response = await this.runQuery<DcatResourceFindSolution>(query);
      DEBUG && console.log("respones", response.results.bindings);
      // Wrap and return the results using the rankedWrap method
      return this.rankedWrapForDCAT(
        response,
        searchText || ""
      ) as unknown as DCATRankWrapper[];
    } catch (error) {
      DEBUG && console.error("Error executing SPARQL query:", error);
      throw error;
    }
  }
}
