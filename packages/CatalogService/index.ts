/** 
  * @module CatalogService
  * @remarks
  * An extension of RdfService for managing DCAT data
  * @author Ian Bailey
  */

import { inherits } from "util";
import { RdfService, SPARQLQuerySolution, SPARQLResultBinding, QueryResponse, TypedNodeQuerySolution, RDFSResource, XsdDataType } from "@telicent-oss/rdfservice/index";

export { RDFSResource } from "@telicent-oss/rdfservice/index"
export * from "./setup"

export interface DcatResourceQuerySolution extends TypedNodeQuerySolution {
    title: SPARQLResultBinding,
    description?: SPARQLResultBinding,
    published?: SPARQLResultBinding,
}

export interface DcatResourceFindSolution extends DcatResourceQuerySolution {
    concatLit: SPARQLResultBinding,
}


export type RankWrapper = {
    score?: Number,
    item: DCATResource
}


export class DCATResource extends RDFSResource {
    /**
     * The DCAT base class from which all the other classes inherit - a Resource published or curated by a single agent.
     * @param {CatalogService} service - the CatalogService being used
     * @param {DcatResourceQuerySolution} statement - SPARQL return binding - use this to initiate a DCATResource from a query response
     * @param {string} uri - the uri of the object to create - NOT TO BE USED IN CONJUNCTION WITH binding parameter
     * @param {string} title - the title of the object to create - NOT TO BE USED IN CONJUNCTION WITH binding parameter
     * @param {string} published - ISO8601 string for the publication (defaults to now)
     * @param {string} type - the type (class URI) of the object to create - NOT TO BE USED IN CONJUNCTION WITH binding parameter
     * @param {DCATCatalog} catalog - optional catalog this resource belongs to
    */
    service: CatalogService
    // TODO remove
    public workAsync: Promise<unknown>[] = [];

    constructor(service: CatalogService, uri?: string, title?: string, published: string = new Date().toISOString(), type: string = "http://www.w3.org/ns/dcat#Resource", catalog?:DCATCatalog, statement?: DcatResourceQuerySolution) {
        let cached = false
        if (uri) {
            cached = service.inCache(uri)
        }
        super(service, uri, type, statement)
        this.service = service
        if (statement != undefined) {
            this.uri = statement.uri.value
            if (!statement.title) {
                console.warn(`No title set for ${this.uri} in query response`)
            }

            if (!statement.published) {
                console.warn(`No published date set for ${this.uri} in query response`)
            }


            if ((uri) || (title) || (published) || (type)) {
                console.warn("individual parameters such as uri, title, etc. should not be set if the statement parameter is set")
            }
        }
        else {
            if (cached) {
                return this
            }
            if (uri == undefined) {
                throw new Error("uri must be provided for a new resource")
            }
            if (title == undefined) {
                throw new Error("title must be provided for a new resource")
            }

            if ((title) && (title != "")) {
                this.setTitle(title)
            }

            this.setPublished(published)
            if ((catalog) && (type == "http://www.w3.org/ns/dcat#Resource")) {
                this.service.insertTriple(catalog.uri,`http://www.w3.org/ns/dcat#resource`,this.uri)
            }
        }
    }
}

export class DCATDataset extends DCATResource {
    constructor(service: CatalogService, uri?: string, title?: string, published?: string, type: string = "http://www.w3.org/ns/dcat#Dataset", catalog?:DCATCatalog, statement?: DcatResourceQuerySolution) {
        super(service, uri, title, published, type, catalog, statement)
        if (catalog) {
            this.service.insertTriple(catalog.uri,`http://www.w3.org/ns/dcat#dataset`,this.uri)
        }
    }

}
export class DCATDataService extends DCATResource {
    constructor(service: CatalogService, uri?: string, title?: string, published?: string, type: string = "http://www.w3.org/ns/dcat#DataService", catalog?:DCATCatalog, statement?: DcatResourceQuerySolution) {
        super(service, uri, title, published, type, catalog, statement)
        
        if (catalog) {
            this.workAsync.push(this.service.insertTriple(catalog.uri,`http://www.w3.org/ns/dcat#service`,this.uri))
        }
    }

}

export class DCATCatalog extends DCATDataset {
    constructor(
        service: CatalogService, 
        uri?: string, 
        title?: string, 
        published?: string, 

        type: string = "http://www.w3.org/ns/dcat#Catalog", 
        catalog?:DCATCatalog, 
        statement?: DcatResourceQuerySolution
    ) {
        super(service, uri, title, published, type, catalog, statement)
        // NOTE: catalog not called in test...perhaps service invokes with context of nodes?
        if (catalog) { 
            // TODO: Move async to load() fn 
            // (or in a pinch, create property await (new DCATCatalog()).async)
            this.addOwnedCatalog(catalog)
        }
    }

    addOwnedCatalog(catalog:DCATCatalog) {
        if (catalog) {
            // TODO return
            this.workAsync.push(this.service.insertTriple(this.uri,`http://www.w3.org/ns/dcat#catalog`,catalog.uri))
        }
    }
    addOwnedDataset(dataset:DCATDataset) {
        if (dataset) {
            this.workAsync.push(this.service.insertTriple(this.uri,`http://www.w3.org/ns/dcat#dataset`,dataset.uri))
        }
    }
    addOwnedService(service:DCATDataService) {
        if (service) {
            this.workAsync.push(this.service.insertTriple(this.uri,`http://www.w3.org/ns/dcat#service`,service.uri))
        }
    }

    addOwnedResource(resource:DCATResource) {
        switch(resource.constructor.name) {
            case "DCATCatalog":
                this.addOwnedCatalog(resource as DCATCatalog)
                break;
            case "DCATDataset":
                this.addOwnedDataset(resource as DCATDataset)
                break;
            case "DCATDataService":
                this.addOwnedService(resource as DCATDataService)
                break;
            default:
                this.workAsync.push(this.service.insertTriple(resource.uri,`http://www.w3.org/ns/dcat#resource`,this.uri))
        }
    }

    async getOwnedResources(typeOfResource?:string) {
        // REQUIREMENT 6.2 Search by dataResourceFilter: selected data-resources
        // Hm. I don't _think_ I need to differentiate owned resources by type.
        return this.service.getAllDCATResources(typeOfResource,this.uri)
    }

    async getOwnedCatalogs() {
        return await this.getOwnedResources(`${this.service.dcatCatalog}`)
    }
    async getOwnedDatasets() {
        return await this.getOwnedResources(`${this.service.dcatDataset}`)
    }
    async getOwnedServices() {
        return await this.getOwnedResources(`${this.service.dcatDataService}`)
    }

}


export class CatalogService extends RdfService {
    dcat: string;
    dcatCatalog: string;
    dcatResource: string;
    dcatDataset: string;
    dcat_dataset: string;
    dcatDataService: string;
    dcat_service: string;
    /**
     * An extension of RdfService for managing ontology elements (RDFS and OWL) and diagramatic / style information
     * @param {string="http://localhost:3030/"} triplestoreUri - The host address of the triplestore
     * @param {string="ontology"} dataset - the dataset name in the triplestore
     * @param {string="http://telicent.io/ontology/"} defaultNamespace - the default stub to use when building GUID URIs
     * @param {string=""} defaultSecurityLabel - the security label to apply to data being created in the triplestore (only works in Telicent CORE stack)
    */
    constructor(triplestoreUri = "http://localhost:3030/", dataset = "knowledge", defaultNamespace = "http://telicent.io/catalog/", defaultSecurityLabel = "", write = false) {

        super(triplestoreUri, dataset, defaultNamespace, defaultSecurityLabel, write)

        this.dcat = "http://www.w3.org/ns/dcat#"

        this.dcatResource = `${this.dcat}Resource`
        this.dcatCatalog = `${this.dcat}Catalog`
        this.dcatDataset = `${this.dcat}Dataset`
        this.dcat_dataset = `${this.dcat}dataset`
        this.dcatDataService = `${this.dcat}DataService`
        this.dcat_service = `${this.dcat}service`

        this.classLookup[this.dcatResource] = DCATResource
        this.classLookup[this.dcatDataset] = DCATDataset
        this.classLookup[this.dcatDataService] = DCATDataService
        this.classLookup[this.dcatCatalog] = DCATCatalog
        this.addPrefix("dcat:", this.dcat)

    }



    compareScores(a: RankWrapper, b: RankWrapper) {
        if ((!a.score) || (!b.score)) {
            return 0
        }
        if (a.score < b.score) {
            return 1
        }
        if (a.score > b.score) {
            return -1
        }
        return 0
    }


    rankedWrap(queryReturn: QueryResponse<DcatResourceFindSolution>, matchingText: string) {
        let items = []
        let cls = DCATResource
        let re = new RegExp(matchingText.toLowerCase(), "g")
        let concatLit: string = ''
        if ((matchingText) && (matchingText != "") && (queryReturn.results) && (queryReturn.results.bindings)) {
            if ((queryReturn.head) && (queryReturn.head.vars)) {
                for (let i in queryReturn.results.bindings) {
                    let binding = queryReturn.results.bindings[i]
                    if (binding._type) {
                        let cls = this.classLookup[binding._type.value]
                    }
                    let item = new cls(this, undefined, undefined, undefined, undefined, undefined, binding)
                    //The query concatenates all the matching literals in the result - we can then count the number of matches to provide a basic score for ranking search results.
                    let score = 0
                    if (binding.concatLit) {
                        concatLit = binding.concatLit.value
                        let match = concatLit.match(re)
                        if (match) {
                            score = match.length
                        } //Cosplay strong typing 
                    }

                    var wrapper: RankWrapper = { item: item, score: score }
                    items.push(wrapper)
                }
            }
        }
        return items.sort(this.compareScores)
    }


    /**
     * Returns all instances of the specified resourceType (e.g. dcat:Dataset, dcat:DataService)
     * @param {string} resourceType - OPTIONAL - if set, this will only return datasets belonging to the catalog
     * @param {string} catalog - OPTIONAL - a full URI for the parent catalog. If set, this will only return datasets belonging to the catalog
     * @param {string} catalogRelation - OPTIONAL - prefixed property identifier. If set, this will only return datasets belonging to the catalog via catalogRelation
     * @returns {Array} - An array of dataset objects with URIs, titles, and published dates
    */
    async getAllDCATResources(cls?: string, catalog?: string, catalogRelation?: string): Promise<DCATResource[]> {
        let resources: DCATResource[] = []
        let catalogSelect = ''
        let relFilter = ''
        if (!catalogRelation) {
            catalogRelation = '?catRel'
            relFilter = 'FILTER (?catRel in (dcat:resource, dcat:dataset, dcat:service, dcat:catalog))'
        }
        else {
            catalogRelation = `<${catalogRelation}>`
        }
        if (catalog)  {
            catalogSelect = `<${catalog}> ${catalogRelation} ?uri .`
        } 
        let typeSelect = ''
        if (cls) {
            // REQUIREMENT 6.3 Search by dataResourceFilter: selected data-resources
            // Perfect. cls is optional.
            typeSelect = `BIND (<${cls}> as ?_type)`
        } else {
            typeSelect = 'FILTER (?_type IN (dcat:Resource, dcat:Dataset, dcat:DataService, dcat:Catalog, dcat:DatasetSeries))'
        }
        let query = `
            SELECT ?uri ?_type ?title ?published ?description
            WHERE {
                ${catalogSelect}
                ${typeSelect}
                ${relFilter}
                ?uri a ?_type.
                OPTIONAL {?uri dct:title ?title} 
                OPTIONAL {?uri dct:published ?published} 
                OPTIONAL {?uri dct:description ?description} 
            }`
        console.info(`getAllDCATResources`, query);
        let results = await this.runQuery<DcatResourceQuerySolution>(query)
        results.results.bindings.forEach((statement: DcatResourceQuerySolution) => {
            var cls = DCATResource
            if (statement._type) {
                cls = (this.lookupClass(statement._type.value, DCATResource) as unknown) as typeof DCATResource
            }
            var dcr = new cls(this, undefined, undefined, undefined, undefined, undefined, statement)
            resources.push(dcr)
        })
        // REQUIREMENT 6.4 Search by dataResourceFilter: selected data-resources
        // I don't see any sort clause, but I assume the returned sort order will be sensible; Or can be made sensible.
        return resources

    }

    /**
     * Returns all instances of dcat:Dataset
     * @returns {Array} - An array of dataset objects with URIs, titles, and published dates
    */
    async getAllDatasets(): Promise<DCATDataset[]> {
        return await this.getAllDCATResources("dcat:Dataset")
    }

    /**
     * Returns all instances of dcat:DataService
     * @returns {Array} - An array of DataService objects with URIs, titles, and published dates
    */
    async getDataServices(): Promise<DCATDataService[]> {
        return await this.getAllDCATResources("dcat:DataService")
    }

    /**
 * Returns all instances of dcat:DataService
 * @returns {Array} - An array of DataService objects with URIs, titles, and published dates
*/
    async getAllCatalogs(): Promise<DCATCatalog[]> {
        return await this.getAllDCATResources("dcat:Catalog") as DCATCatalog[]
    }

    /**
     * Performs a very basic string-matching search - this should be used if no search index is available. The method will return a very basic match count that can be used to rank results. 
     * @param {string} matchingText - The text string to find in the data
     * @param {Array} dcatTypes - OPTIONAL - the types of dcat items to search for - defaults to [dcat:Catalog, dcat:Dataset, dcat:DataService]
     * @returns {Array} - An array of DataService objects with URIs, titles, and published dates
    */
   // REQUIREMENT 7.1 Search by input text
   // Code. Hm. This looks like it won't take search and dataresource owner....
    async find(matchingText: string, dcatTypes: string[] = [this.dcatCatalog, this.dcatDataService, this.dcatDataset], inCatalog: DCATCatalog): Promise<RankWrapper[]> {
        let typelist = '"' + dcatTypes.join('", "') + '"'
        let re = new RegExp(matchingText.toLowerCase(), "g")
        let catalogMatch = ''
        if (inCatalog) {
            catalogMatch = `<${inCatalog.uri}> ?catRel ?uri .`
        }
        let query = `
            SELECT ?uri ?title ?published ?description ?_type (group_concat(DISTINCT ?literal) as ?concatLit)
            WHERE {
                ?uri a ?_type .
                ?uri ?pred ?literal .
                ${catalogMatch}
                BIND (STR(?_type) AS ?typestr) .
                FILTER (?typestr in (${typelist}) ) .
                FILTER CONTAINS(LCASE(?literal), "${matchingText.toLowerCase()}")
                OPTIONAL {?uri dct:title ?title} 
                OPTIONAL {?uri dct:published ?published} 
                OPTIONAL {?uri dct:description ?description} 
            } GROUP BY ?uri ?title ?published ?description ?_type
            `
        let results = await this.runQuery<DcatResourceFindSolution>(query)
        return this.rankedWrap(results, matchingText)
    }



}
