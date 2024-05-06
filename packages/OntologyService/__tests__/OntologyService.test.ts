import fetchMock, { enableFetchMocks } from "jest-fetch-mock"
import OntologyService from "../index"
import ClassDefinition from "../ClassDefinition";
import { QueryResponse, RelatingQuerySolution, SPOQuerySolution } from "packages/RdfService";
import { rdfType, rdfsSubClassOf } from "../testMocks";
import Style from "packages/OntologyService"
import { makeStyleObject } from "../helper";



enableFetchMocks()

const ontologyObjectStub = {
  "dataset": "ontology",
  "dc": "http://purl.org/dc/elements/1.1/",
  "defaultSecurityLabel": "",
  "nodes": {
    "allElements": {},
    "classes": {},
    "properties": {}
  },
  "owl": "http://www.w3.org/2002/07/owl#",
  "owlClass": "http://www.w3.org/2002/07/owl##Class",
  "owlDatatypeProperty": "http://www.w3.org/2002/07/owl#DatatypeProperty",
  "owlObjectProperty": "http://www.w3.org/2002/07/owl#ObjectProperty",
  "prefixDict": {
    ":": "http://telicent.io/ontology/",
    "dc:": "http://purl.org/dc/elements/1.1/",
    "owl:": "http://www.w3.org/2002/07/owl#",
    "rdf:": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    "rdfs:": "http://www.w3.org/2000/01/rdf-schema#",
    "telicent:": "http://telicent.io/ontology/",
    "xsd:": "http://www.w3.org/2001/XMLSchema#",
  },
  "queryEndpoint": "http://localhost:3030/ontology/query?query=",
  "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  "rdfProperty": "http://www.w3.org/1999/02/22-rdf-syntax-ns#Property",
  "rdfType": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
  "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
  "rdfsClass": "http://www.w3.org/2000/01/rdf-schema#Class",
  "rdfsComment": "http://www.w3.org/2000/01/rdf-schema#comment",
  "rdfsDomain": "http://www.w3.org/2000/01/rdf-schema#domain",
  "rdfsLabel": "http://www.w3.org/2000/01/rdf-schema#label",
  "rdfsRange": "http://www.w3.org/2000/01/rdf-schema#range",
  "rdfsSubClassOf": "http://www.w3.org/2000/01/rdf-schema#subClassOf",
  "rdfsSubPropertyOf": "http://www.w3.org/2000/01/rdf-schema#subPropertyOf",
  "telDiagram": "http://telicent.io/ontology/Diagram",
  "telDiagramElement": "http://telicent.io/ontology/DiagramElement",
  "telBaseType": "http://telicent.io/ontology/baseType",
  "telDiagramRelationship": "http://telicent.io/ontology/DiagramRelationship",
  "telElementStyle": "http://telicent.io/ontology/elementStyle",
  "telInDiagram": "http://telicent.io/ontology/inDiagram",
  "telRepresents": "http://telicent.io/ontology/represents",
  "telSourceElem": "http://telicent.io/ontology/sourceElem",
  "telTargetElem": "http://telicent.io/ontology/targetElem",
  "telTitle": "http://telicent.io/ontology/title",
  "telUUID": "http://telicent.io/ontology/uuid",
  "telicent": "http://telicent.io/ontology/",
  "telicentStyle": "http://telicent.io/ontology/style",
  "triplestoreUri": "http://localhost:3030/",
  "updateEndpoint": "http://localhost:3030/ontology/update",
  "xsd": "http://www.w3.org/2001/XMLSchema#",
}

const mockSPARQLResponse: QueryResponse<SPOQuerySolution> = {
  "head": {
    "vars": []
  },
  results: {
    bindings: [
      {
        s: {
          value: "testSubject1",
          type: ""
        },
        o: {
          type: "literal",
          value: "testObject1"
        },
        p: {
          type: "",
          value: rdfType
        }
      }
    ]
  }
}

const mockSubClassesResponse: QueryResponse<RelatingQuerySolution> = {
  "head": {
    "vars": []
  },
  results: {
    bindings: [
      {
        relating: {
          type: "",
          value: "relating1"
        },
        pred: {
          type: "literal",
          value: rdfsSubClassOf
        }
      }
    ]
  }
}

const mockDomainPropertiesResponse: QueryResponse<RelatingQuerySolution> = {
  "head": {
    "vars": []
  },
  results: {
    bindings: [
      {
        relating: {
          type: "",
          value: "relating2"
        },
        pred: {
          type: "literal",
          value: rdfType
        }
      }
    ]
  }
}

describe("Ontology Service", () => {
  describe("newClass", () => {
    beforeEach(() => {
      fetchMock.resetMocks();
    })

    it("should create a new class", async () => {
      const obj = new OntologyService()
      //expect(obj).toEqual(ontologyObjectStub)
    })

    
  })


  describe("getStyles", () => {
    beforeEach(() => {
      fetchMock.resetMocks();
    })
    it("should send a request for each style", () => {
      fetchMock.mockResponseOnce(JSON.stringify({
        head: {
          "vars": [
            "cls",
            "style"
          ]
        },
        results: {
          bindings: [
            {
              "cls": {
                "type": "uri",
                "value": "http://ies.data.gov.uk/ontology/ies4#Provider"
              },
              "style": {
                "type": "literal",
                "value": "{\"defaultStyles\": {\"dark\": {\"backgroundColor\": \"#0F0024\", \"color\": \"#BA85FF\"}, \"light\": {\"backgroundColor\": \"#BA85FF\", \"color\": \"#0F0024\"}, \"shape\": \"circle\", \"borderRadius\": \"9999px\", \"borderWidth\": \"2px\", \"selectedBorderWidth\": \"3px\"}, \"defaultIcons\": {\"riIcon\": \"ri-exchange-box-fill\", \"faIcon\": \"fa-sharp fa-solid fa-arrow-right-arrow-left\", \"faUnicode\": \"\\uf0ec\", \"faClass\": \"fa-sharp fa-solid\"}}"
              }
            }
          ]
        }
      }))
      new OntologyService()
        .getStyles(["style1", "style2"])
      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3030/ontology/query?query=PREFIX%20%3A%20%3Chttp%3A%2F%2Ftelicent.io%2Fontology%2F%3E%20PREFIX%20xsd%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2001%2FXMLSchema%23%3E%20PREFIX%20dc%3A%20%3Chttp%3A%2F%2Fpurl.org%2Fdc%2Felements%2F1.1%2F%3E%20PREFIX%20rdf%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%20PREFIX%20rdfs%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23%3E%20PREFIX%20owl%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23%3E%20PREFIX%20telicent%3A%20%3Chttp%3A%2F%2Ftelicent.io%2Fontology%2F%3E%20SELECT%20%3Fcls%20%3Fstyle%20WHERE%20%7B%3Fcls%20%3Chttp%3A%2F%2Ftelicent.io%2Fontology%2Fstyle%3E%20%3Fstyle%20.%20FILTER%20(str(%3Fcls)%20IN%20(%22style1%22%2C%20%22style2%22)%20)%20%7D")
    })
  })

  describe("setStyles", () => {
    beforeEach(() => {
      fetchMock.resetMocks();
    })
    it("should send a request for each style", () => {
      fetchMock.mockResponseOnce(JSON.stringify({}))
      const styleObj = makeStyleObject
      new OntologyService()
        .setStyle("style1", styleObj)
      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(fetchMock).toHaveBeenNthCalledWith(1, "http://localhost:3030/ontology/update", {
        "body": "PREFIX : <http://telicent.io/ontology/> PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> PREFIX dc: <http://purl.org/dc/elements/1.1/> PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> PREFIX owl: <http://www.w3.org/2002/07/owl#> PREFIX telicent: <http://telicent.io/ontology/> DELETE WHERE {<style1> <http://telicent.io/ontology/style> ?o . }",
        "headers": { "Accept": "*/*", "Content-Type": "application/sparql-update" },
        "method": "POST"
      })
      expect(fetchMock).toHaveBeenNthCalledWith(2, "http://localhost:3030/ontology/update", {
        "body": "PREFIX : <http://telicent.io/ontology/> PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> PREFIX dc: <http://purl.org/dc/elements/1.1/> PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> PREFIX owl: <http://www.w3.org/2002/07/owl#> PREFIX telicent: <http://telicent.io/ontology/> INSERT DATA {<style1> <http://telicent.io/ontology/style> \"%7B%22bgColour%22%3A%22%23888%22%2C%22colour%22%3A%22%23000%22%2C%22icon%22%3A%22fa-solid%20fa-question%22%2C%22height%22%3A0%2C%22width%22%3A0%2C%22x%22%3A0%2C%22y%22%3A0%2C%22shape%22%3A%22diamond%22%7D\" . }",
        "headers": {
          "Accept": "*/*",
          "Content-Type": "application/sparql-update",
        },
        "method": "POST"
      })
    })
  })

  
})
