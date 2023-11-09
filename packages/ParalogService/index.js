import IesService from "@telicent-io/iesservice";

/**
  * @module ParalogService
  * @description Placeholder
  * @author Ian Bailey
  */

export default class ParalogService extends IesService {
    /**
    * @method constructor
    * @description placeholder
    * @param {string} [triplestoreUri="http://localhost:3030"] - The host address of the triplestore
    * @param {string} [dataset="knowledge"] - the dataset name in the triplestore
    * @param {string} [defaultUriStub="http://telicent.io/data/"] - the default stub to use when building GUID URIs
     * @param {string} [defaultSecurityLabel=""] - the security label to apply to data being created in the triplestore (only works in Telicent CORE stack)
    */
    constructor(triplestoreUri = "http://localhost:3030/",dataset="knowledge",defaultUriStub="http://telicent.io/data/", defaultSecurityLabel="") {
        super(triplestoreUri,dataset,defaultUriStub,defaultSecurityLabel)
    }
    async getAssessments() {
        query = `SELECT ?uri ?name (COUNT(?asset) AS ?numberOfAssessedItems)
        WHERE {
            ?uri a ies:CarverAssessment .
            ?uri ies:hasName ?cAssNameObj .
            ?cAssNameObj ies:representationValue ?name .
            OPTIONAL {
                ?uri ies:assessed ?asset
            }
        }
        GROUP BY ?uri ?name
    `
    
    }
}
