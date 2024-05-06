/** 
  * @module CatalogService
  * @remarks
  * An extension of RdfService for managing DCAT data
  * @author Ian Bailey
  */

import RdfService, {  SPARQLQuerySolution, SPARQLResultBinding, QueryResponse, TypedNodeQuerySolution, RDFSResource, RDFProperty } from "@telicent-oss/rdfservice";

export interface DcatResourceQuerySolution extends TypedNodeQuerySolution {
    title: SPARQLResultBinding,
    description?: SPARQLResultBinding,
    published?:SPARQLResultBinding,
}

export interface DcatResourceFindSolution extends DcatResourceQuerySolution {
    concatLit: SPARQLResultBinding,
}


export type RankWrapper = {
    score:Number,
    item:DCATResource
}


export class DCATResource extends RDFSResource {
    /**
     * The DCAT base class from which all the other classes inherit - a Resource published or curated by a single agent.
     * @param {CatalogService} service - the CatalogService being used
     * @param {DcatResourceQuerySolution} statement - SPARQL return binding - use this to initiate a DCATResource from a query response
     * @param {string} uri - the uri of the object to create - NOT TO BE USED IN CONJUNCTION WITH binding parameter
     * @param {string} title - the title of the object to create - NOT TO BE USED IN CONJUNCTION WITH binding parameter
     * @param {string} type - the type (class URI) of the object to create - NOT TO BE USED IN CONJUNCTION WITH binding parameter
    */
    service: CatalogService
    description: string
    published:string
    title:string
    constructor(service:CatalogService, uri?:string, title?:string, published?:string, type:string="http://www.w3.org/ns/dcat#Resource", statement?:DcatResourceQuerySolution) {
        super(service, uri, type, statement)
        this.service = service
        this.description = ''
        this.published = ''
        this.title = ''
        if (statement != undefined) {
            this.uri = statement.uri.value
            if (statement.title){
                this.title = statement.title.value
            }
            else
            {
                console.warn(`No title set for ${this.uri} in query response`)
            }
            
            if (statement.description) {
                this.description = statement.description.value
            }

            if (statement.published) {
                this.published = statement.published.value
            }

            if ((uri) || (title) || (published) || (type)) {
                console.warn("individual parameters such as uri, title, etc. should not be set if the statement parameter is set")
            }
        }
        else
        {
            if (uri == undefined) {
                throw new Error("uri must be provided for a new resource")
            }
            if (title == undefined) {
                throw new Error("title must be provided for a new resource")
            }
            this.title = title
            this.service.instantiate(this._type.replace("dcat:","http://www.w3.org/ns/dcat#"),uri)
            if ((title) && (title != "")) {
                this.setTitle(title)
            }
            let date = new Date();
            //this.addLiteral(this.service.dcPublished,date.toISOString(),true)
        }
    }
}

export class DCATDataset extends DCATResource {

}
export class DCATDataService extends DCATResource {

}

export class DCATCatalog extends DCATDataset {

}


export default class CatalogService extends RdfService {
    dcat : string;
    dcatCatalog : string;
    dcatResource : string;
    dcatDataset : string;
    dcat_dataset : string;
    dcatDataService : string;
    dcat_service : string;
    /**
     * An extension of RdfService for managing ontology elements (RDFS and OWL) and diagramatic / style information
     * @param {string="http://localhost:3030/"} triplestoreUri - The host address of the triplestore
     * @param {string="ontology"} dataset - the dataset name in the triplestore
     * @param {string="http://telicent.io/ontology/"} defaultUriStub - the default stub to use when building GUID URIs
     * @param {string=""} defaultSecurityLabel - the security label to apply to data being created in the triplestore (only works in Telicent CORE stack)
    */
    constructor(triplestoreUri = "http://localhost:3030/",dataset="knowledge",defaultUriStub="http://telicent.io/catalog/", defaultSecurityLabel="") {

        super(triplestoreUri,dataset,defaultUriStub, defaultSecurityLabel)

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



    compareScores(a:RankWrapper, b:RankWrapper) {
        if (a.score < b.score){
            return 1
        }
        if (a.score > b.score){
            return -1
        }
        return 0
    }


    rankedWrap(queryReturn:QueryResponse<DcatResourceFindSolution>,matchingText:string) {
        let items = []
        let re = new RegExp(matchingText.toLowerCase(),"g")
        if ((matchingText) && (matchingText != "") && (queryReturn.results) && (queryReturn.results.bindings)) {
            if ((queryReturn.head) && (queryReturn.head.vars))
            {
                for (let i in queryReturn.results.bindings ) {
                    let binding = queryReturn.results.bindings[i]
                    let cls = this.classLookup[binding._type.value]
                    let item = new cls(this,binding)
                    //The query concatenates all the matching literals in the result - we can then count the number of matches to provide a basic score for ranking search results.
                    var concatLit:string = binding.concatLit.value
                    var wrapper:RankWrapper = {item:item,score:concatLit.match(re).length}
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
    async getAllDCATResources(cls:string,catalog?:string,catalogRelation?:string):Promise<DCATResource[]> {
        let resources:DCATResource[] = []
        let catalogSelect = ''
        if ((catalog) && (catalogRelation)) {
            catalogSelect = `<${catalog}> ${catalogRelation} ?uri .`
        }
        let typeSelect = ''
        if (cls) {
            typeSelect = `BIND (${cls} as ?_type)`
        }
        let query = `
            SELECT ?uri ?_type ?title ?published ?description
            WHERE {
                ${catalogSelect}
                ${typeSelect}
                ?uri a  ?_type.
                OPTIONAL {?uri dct:title ?title} 
                OPTIONAL {?uri dct:published ?published} 
                OPTIONAL {?uri dct:description ?description} 
            }`
        let results = await this.runQuery<DcatResourceQuerySolution>(query)
        results.results.bindings.forEach((statement:DcatResourceQuerySolution) => {
            var cls = this.lookupClass(statement._type.value,DCATResource)
            var dcr = new cls(this,undefined,undefined,undefined,undefined,statement)
            resources.push(dcr)
          })
        return resources

    }

    /**
     * Returns all instances of dcat:Dataset
     * @returns {Array} - An array of dataset objects with URIs, titles, and published dates
    */    
    async getAllDatasets():Promise<DCATDataset[]> {
        return await this.getAllDCATResources("dcat:Dataset")
    }

    /**
     * Returns all instances of dcat:DataService
     * @returns {Array} - An array of DataService objects with URIs, titles, and published dates
    */    
    async getDataServices():Promise<DCATDataService[]> {
        return await this.getAllDCATResources("dcat:DataService")
    }

        /**
     * Returns all instances of dcat:DataService
     * @returns {Array} - An array of DataService objects with URIs, titles, and published dates
    */    
        async getAllCatalogs():Promise<DCATCatalog[]> {
            return await this.getAllDCATResources("dcat:Catalog")
        }

    /**
     * Performs a very basic string-matching search - this should be used if no search index is available. The method will return a very basic match count that can be used to rank results. 
     * @param {string} matchingText - The text string to find in the data
     * @param {Array} dcatTypes - OPTIONAL - the types of dcat items to search for - defaults to [dcat:Catalog, dcat:Dataset, dcat:DataService]
     * @returns {Array} - An array of DataService objects with URIs, titles, and published dates
    */  
    async find(matchingText:string, dcatTypes:string[] = [this.dcatCatalog,this.dcatDataService,this.dcatDataset],inCatalog:DCATCatalog):Promise<RankWrapper[]> {
        let typelist = '"'+dcatTypes.join('", "')+'"'
        let re = new RegExp(matchingText.toLowerCase(),"g")
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
        return this.rankedWrap(results,matchingText)
    }



}
