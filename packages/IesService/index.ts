import RdfService from "@telicent-io/rdfservice"

/**
  * @module IesService
  * @description An extension of RdfService for managing IES data
  * @author Ian Bailey
  */

export default class IesService extends RdfService {
  ies: string;
  iesAssessment: string;
  iesEvent: string;
  iesState: string;
  ies_isPartOf: string;
  ies_isStateOf: string;
    /**
     * @method constructor
     * @remarks
     * An extension of RdfService for managing IES data
     * @param string  - The host address of the triplestore
     * @param string  - the dataset name in the triplestore
     * @param string  - the default stub to use when building GUID URIs
     * @param string  - the security label to apply to data being created in the triplestore (only works in Telicent CORE stack)
    */
    constructor(triplestoreUri = "http://localhost:3030/",dataset="knowledge",defaultUriStub="http://telicent.io/data/", defaultSecurityLabel="") {
        super(triplestoreUri,dataset,defaultUriStub,defaultSecurityLabel)
        this.ies = "http://ies.data.gov.uk/ontology/ies4#"
        this.iesAssessment = this.ies+"Assessment"
        this.iesEvent = this.ies+"Event"
        this.iesState = this.ies+"State"
        this.ies_isPartOf = this.ies+"isPartOf"
        this.ies_isStateOf = this.ies+"isStateOf"
    }

    async addPart(element: string, part:string, partRelType=this.ies_isPartOf){
        await this.insertTriple(part,partRelType,element,"URI")
    }

    async inPeriod(element: string,iso8601Period: string, securityLabel: string) {

    }

    createState(element:string, securityLabel: string, stateType=this.iesState, stateRelType=this.ies_isStateOf, start = Nothing,  end = Nothing ){
        const state = this.instantiate(stateType,stateUri,securityLabel)
        this.insertTriple(state,stateRelType,element,"URI","",securityLabel)
        return state
    }

    async createEvent(uri: string,event_start:string, event_end:string, securityLabel: string, cls = this.iesEvent, telicent_primary_name="",) {
        const event = await this.instantiate(cls,uri,securityLabel)
        return event
    }
}
