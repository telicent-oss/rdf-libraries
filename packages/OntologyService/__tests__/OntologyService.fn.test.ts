import { OntologyService, RDFSClass } from ".."
import {QueryResponse} from "@telicent-oss/rdfservice"

// create a successful sparql result object - as expected to return
// can check this by generating this data and sending queries to a database offline 
// but we know the good response for this query would look like this
const SUCCESSFULL_RESPONSE = {
    head: { vars: ["uri", "_type"] },
   results: {   
    bindings:[{
        "uri": {"type":"uri", "value":"http://telicent.io/fake_data#9999-abcdefgh-ijkl9999"},
        "_type": {"type": "uri", "value": "http://www.w3.org/1999/02/22-rdf-syntax-ns#Class"}
    }]
   }
} as unknown as Promise<QueryResponse<any>>

const MOCK_URL = "http://localhost:3030/"
describe("testing functions within the ontology service", ()=>{
    beforeEach(() => {
        jest.resetAllMocks()
    })
    it("getAllClasses - check correct query is created and sent to runQuery", async () => {
        const os = new OntologyService(MOCK_URL)


        // runQuery should be tested as part of the RDFService tests - return SUCCESSFULL_RESPONSE
        const runQueryMock = jest.spyOn(os, "runQuery").mockImplementation(()=> Promise.resolve(SUCCESSFULL_RESPONSE))
        // this is the correct query - no filter and not including owl
        const CORRECT_QUERY = "SELECT ?uri ?_type WHERE {BIND (rdfs:Class as ?_type . ?uri a ?_type ) . }"
        // run function
        const res = await os.getAllClasses(false)
        // check correct query is passed based on function call to runQuery
        expect(runQueryMock).toHaveBeenCalledWith(CORRECT_QUERY)
        // results check - return is an array of length 1 
        expect(res.length).toBe(1)
        // get keys of the object
        const keys = Object.keys(res[0])
        // check there is 3 
        expect(keys.length).toBe(3)
        expect(keys[0]).toBe("uri")
        expect(keys[1]).toBe("types")
        expect(keys[2]).toBe("service")
        // check value of the first
        expect(res[0].uri).toBe('http://telicent.io/fake_data#9999-abcdefgh-ijkl9999')
        // check value of the types
        expect(res[0].types[0]).toBe('http://www.w3.org/1999/02/22-rdf-syntax-ns#Class')
    })

    it("getAllClasses - check can handle error from runQuery", async () => {
        const os = new OntologyService(MOCK_URL)
        try{
            // runQuery should be tested as part of the RDFService tests - mock that an error occurs (maybe in jena)
            const runQueryMock = jest.spyOn(os, "runQuery").mockImplementation(()=> {throw new Error("Does this handle?")})
            // run function
            await os.getAllClasses(false)
        }catch(error){
            const err = error as Error
            expect(err.message).toBe("Does this handle?")
        }
        
        
    })

})
