import fetchMock, { enableFetchMocks } from "jest-fetch-mock"
import OntologyService from "../index"
import ClassDefinition from "../ClassDefinition";
import { QueryResponse, RelatingQuery, SPARQL } from "packages/RdfService";
import { rdfType, rdfsSubClassOf } from "../testMocks";
import { makeStyleObject } from "../helper";

enableFetchMocks()

const ontologyObjectStub = {
  "dataset": "ontology",
  "dc": "http://purl.org/dc/elements/1.1/",
  "defaultSecurityLabel": "",
  "defaultUriStub": "http://telicent.io/ontology/",
  "nodes": {
    "allElements": {},
    "classes": {},
    "properties": {}
  },
  "owl": "http://www.w3.org/2002/07/owl#",
  "owlClass": "http://www.w3.org/2002/07/owl##Class",
  "owlDatatypeProperty": "http://www.w3.org/2002/07/owl#DatatypeProperty",
  "owlObjectProperty": "http://www.w3.org/2002/07/owl#ObjectProperty",
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
  "prefixDict": {
    "dc:": "http://purl.org/dc/elements/1.1/",
    "owl:": "http://www.w3.org/2002/07/owl#",
    "rdf:": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    "rdfs:": "http://www.w3.org/2000/01/rdf-schema#",
    "telicent:": "http://telicent.io/ontology/",
    "xsd:": "http://www.w3.org/2001/XMLSchema#",
  },
  "telDiagram": "http://telicent.io/ontology/Diagram",
  "telDiagramElement": "http://telicent.io/ontology/DiagramElement",
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

const mockSPARQLResponse: QueryResponse<SPARQL[]> = {
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

const mockSubClassesResponse: QueryResponse<RelatingQuery[]> = {
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

const mockDomainPropertiesResponse: QueryResponse<RelatingQuery[]> = {
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
      expect(obj).toEqual(ontologyObjectStub)
    })

    it("should perform a query to get the class and populate a class object with all params set to true", async () => {
      // Performs three API requests as by default getClass has getAllPredicates, getSubClasses, getDomainProperties to true
      fetchMock.mockResponses([JSON.stringify(mockSPARQLResponse), { status: 200 }], [JSON.stringify(mockSubClassesResponse), { status: 200 }], [JSON.stringify(mockDomainPropertiesResponse), { status: 200 }])

      // build up how the mockClass Schema should look
      const mockClass = new ClassDefinition()
      mockClass.uri = "testSubject1"
      mockClass.addOwnedProperties("relating2")
        .addPredicate(rdfType, "testObject1")
        .addSubClass("relating1")
        .addRdfType("testObject1")

      const cls = await new OntologyService().getClass("testUri")

      expect(fetchMock).toHaveBeenCalledTimes(3)
      expect(cls).toEqual(mockClass)
    })

    it("should not need to perform a query to get the class as all params set to false so will just return default class", async () => {
      fetchMock.mockResponses([JSON.stringify(mockSPARQLResponse), { status: 200 }])

      const cls = await new OntologyService().getClass("testUri", false, false, false)
      const mockClass = new ClassDefinition()
      expect(fetchMock).toHaveBeenCalledTimes(0)
      expect(cls).toEqual(mockClass)
    })
  })

  describe("getDomainProperties", () => {
    beforeEach(() => {
      fetchMock.resetMocks();
    })

    it("should perform getRelating query with rdfsDomain value", () => {
      fetchMock.mockResponseOnce(JSON.stringify({}))
      new OntologyService()
        .getDomainProperties("testUri")

      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3030/ontology/query?query=PREFIX%20xsd%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2001%2FXMLSchema%23%3E%20PREFIX%20dc%3A%20%3Chttp%3A%2F%2Fpurl.org%2Fdc%2Felements%2F1.1%2F%3E%20PREFIX%20rdf%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%20PREFIX%20rdfs%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23%3E%20PREFIX%20owl%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23%3E%20PREFIX%20telicent%3A%20%3Chttp%3A%2F%2Ftelicent.io%2Fontology%2F%3E%20SELECT%20%3Frelating%20WHERE%20%7B%3Frelating%20%3Fpred%20%3CtestUri%3E%20.%20%3Fpred%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23subPropertyOf%3E*%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23domain%3E%20.%20%7D")
    })
  })

  describe("getRangeProperties", () => {
    beforeEach(() => {
      fetchMock.resetMocks();
    })

    it("should perform getRelating query with rdfsRange value", () => {
      fetchMock.mockResponseOnce(JSON.stringify({}))
      new OntologyService()
        .getRangeProperties("testUri")

      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3030/ontology/query?query=PREFIX%20xsd%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2001%2FXMLSchema%23%3E%20PREFIX%20dc%3A%20%3Chttp%3A%2F%2Fpurl.org%2Fdc%2Felements%2F1.1%2F%3E%20PREFIX%20rdf%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%20PREFIX%20rdfs%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23%3E%20PREFIX%20owl%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23%3E%20PREFIX%20telicent%3A%20%3Chttp%3A%2F%2Ftelicent.io%2Fontology%2F%3E%20SELECT%20%3Frelating%20WHERE%20%7B%3Frelating%20%3Fpred%20%3CtestUri%3E%20.%20%3Fpred%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23subPropertyOf%3E*%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23range%3E%20.%20%7D")
    })
  })


  describe("getInheritedDomainProperties", () => {
    beforeEach(() => {
      fetchMock.resetMocks();
    })

    it("should perform getRelating query with rdfsDomain and rdfsSubClassOf values", () => {
      fetchMock.mockResponseOnce(JSON.stringify({}))
      new OntologyService()
        .getInheritedDomainProperties("testUri")

      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3030/ontology/query?query=PREFIX%20xsd%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2001%2FXMLSchema%23%3E%20PREFIX%20dc%3A%20%3Chttp%3A%2F%2Fpurl.org%2Fdc%2Felements%2F1.1%2F%3E%20PREFIX%20rdf%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%20PREFIX%20rdfs%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23%3E%20PREFIX%20owl%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23%3E%20PREFIX%20telicent%3A%20%3Chttp%3A%2F%2Ftelicent.io%2Fontology%2F%3E%20SELECT%20%3Fprop%20%3Fitem%20WHERE%20%7B%3Fprop%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23domain%3E%20%3Fitem%20.%20%3CtestUri%3E%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23subClassOf%3E*%20%3Fitem.%20%7D")
    })
  })

  describe("getInheritedRangeProperties", () => {
    beforeEach(() => {
      fetchMock.resetMocks();
    })

    it("should perform the same query as getInheritedDomainProperties but using the rdfsRange value", () => {
      fetchMock.mockResponseOnce(JSON.stringify({}))
      new OntologyService()
        .getInheritedRangeProperties("testUri")

      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3030/ontology/query?query=PREFIX%20xsd%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2001%2FXMLSchema%23%3E%20PREFIX%20dc%3A%20%3Chttp%3A%2F%2Fpurl.org%2Fdc%2Felements%2F1.1%2F%3E%20PREFIX%20rdf%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%20PREFIX%20rdfs%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23%3E%20PREFIX%20owl%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23%3E%20PREFIX%20telicent%3A%20%3Chttp%3A%2F%2Ftelicent.io%2Fontology%2F%3E%20SELECT%20%3Fprop%20%3Fitem%20WHERE%20%7B%3Fprop%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23range%3E%20%3Fitem%20.%20%3CtestUri%3E%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23subClassOf%3E*%20%3Fitem.%20%7D")
    })
  })

  describe("addSubClass", () => {
    beforeEach(() => {
      fetchMock.resetMocks();
    })

    it("should send an insert query", () => {
      fetchMock.mockResponseOnce(JSON.stringify({}))
      new OntologyService()
        .addSubClass("subClass", "superClass")

      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3030/ontology/update", { "body": "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> PREFIX dc: <http://purl.org/dc/elements/1.1/> PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> PREFIX owl: <http://www.w3.org/2002/07/owl#> PREFIX telicent: <http://telicent.io/ontology/> INSERT DATA {<subClass> <http://www.w3.org/2000/01/rdf-schema#subClassOf> <superClass> . }", "headers": { "Accept": "*/*", "Content-Type": "application/sparql-update" }, "method": "POST" })
    })
  })

  describe("getSubClasses", () => {
    beforeEach(() => {
      fetchMock.resetMocks();
    })

    it("should perform a get relating query with the rdfsSubClassOf value", () => {
      fetchMock.mockResponseOnce(JSON.stringify({}))
      new OntologyService()
        .getSubClasses("testUri")

      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3030/ontology/query?query=PREFIX%20xsd%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2001%2FXMLSchema%23%3E%20PREFIX%20dc%3A%20%3Chttp%3A%2F%2Fpurl.org%2Fdc%2Felements%2F1.1%2F%3E%20PREFIX%20rdf%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%20PREFIX%20rdfs%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23%3E%20PREFIX%20owl%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23%3E%20PREFIX%20telicent%3A%20%3Chttp%3A%2F%2Ftelicent.io%2Fontology%2F%3E%20SELECT%20%3Frelating%20WHERE%20%7B%3Frelating%20%3Fpred%20%3CtestUri%3E%20.%20%3Fpred%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23subPropertyOf%3E*%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23subClassOf%3E%20.%20%7D")
    })
  })

  describe("getSuperClasses", () => {
    beforeEach(() => {
      fetchMock.resetMocks();
    })

    it("should run a query without the wild card and should not ignoreSubProps", () => {
      fetchMock.mockResponseOnce(JSON.stringify({}))
      new OntologyService()
        .getSuperClasses("testUri")

      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3030/ontology/query?query=PREFIX%20xsd%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2001%2FXMLSchema%23%3E%20PREFIX%20dc%3A%20%3Chttp%3A%2F%2Fpurl.org%2Fdc%2Felements%2F1.1%2F%3E%20PREFIX%20rdf%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%20PREFIX%20rdfs%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23%3E%20PREFIX%20owl%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23%3E%20PREFIX%20telicent%3A%20%3Chttp%3A%2F%2Ftelicent.io%2Fontology%2F%3E%20SELECT%20%3Fsuper%20WHERE%20%7B%3CtestUri%3E%20%3FsubRel%20%3Fsuper%20.%20%3FsubRel%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23subPropertyOf%3E*%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23subClassOf%3E%20.%7D")
    })
    it("should run a query with the while card and should ignoreSubProps", () => {
      fetchMock.mockResponseOnce(JSON.stringify({}))
      new OntologyService()
        .getSuperClasses("testUri", true, true)

      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3030/ontology/query?query=PREFIX%20xsd%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2001%2FXMLSchema%23%3E%20PREFIX%20dc%3A%20%3Chttp%3A%2F%2Fpurl.org%2Fdc%2Felements%2F1.1%2F%3E%20PREFIX%20rdf%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%20PREFIX%20rdfs%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23%3E%20PREFIX%20owl%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23%3E%20PREFIX%20telicent%3A%20%3Chttp%3A%2F%2Ftelicent.io%2Fontology%2F%3E%20SELECT%20%3Fsuper%20WHERE%20%7B%3CtestUri%3E%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23subClassOf%3E*%20%3Fsuper%20.%7D")
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
      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3030/ontology/query?query=PREFIX%20xsd%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2001%2FXMLSchema%23%3E%20PREFIX%20dc%3A%20%3Chttp%3A%2F%2Fpurl.org%2Fdc%2Felements%2F1.1%2F%3E%20PREFIX%20rdf%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%20PREFIX%20rdfs%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23%3E%20PREFIX%20owl%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23%3E%20PREFIX%20telicent%3A%20%3Chttp%3A%2F%2Ftelicent.io%2Fontology%2F%3E%20SELECT%20%3Fcls%20%3Fstyle%20WHERE%20%7B%3Fcls%20%3Chttp%3A%2F%2Ftelicent.io%2Fontology%2Fstyle%3E%20%3Fstyle%20.%20FILTER%20(str(%3Fcls)%20IN%20(%22style1%22%2C%20%22style2%22)%20)%20%7D")
    })
  })

  describe("setStyles", () => {
    beforeEach(() => {
      fetchMock.resetMocks();
    })
    it("should send a request for each style", () => {
      fetchMock.mockResponseOnce(JSON.stringify({}))
      const styleObj = makeStyleObject()
      new OntologyService()
        .setStyle("style1", styleObj)
      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(fetchMock).toHaveBeenNthCalledWith(1, "http://localhost:3030/ontology/update", {
        "body": "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> PREFIX dc: <http://purl.org/dc/elements/1.1/> PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> PREFIX owl: <http://www.w3.org/2002/07/owl#> PREFIX telicent: <http://telicent.io/ontology/> DELETE WHERE {<style1> <http://telicent.io/ontology/style> ?o . }",
        "headers": { "Accept": "*/*", "Content-Type": "application/sparql-update" },
        "method": "POST"
      })
      expect(fetchMock).toHaveBeenNthCalledWith(2, "http://localhost:3030/ontology/update", {
        "body": "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> PREFIX dc: <http://purl.org/dc/elements/1.1/> PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> PREFIX owl: <http://www.w3.org/2002/07/owl#> PREFIX telicent: <http://telicent.io/ontology/> INSERT DATA {<style1> <http://telicent.io/ontology/style> \"%7B%22bgColour%22%3A%22%23888%22%2C%22colour%22%3A%22%23000%22%2C%22icon%22%3A%22fa-solid%20fa-question%22%2C%22height%22%3A0%2C%22width%22%3A0%2C%22x%22%3A0%2C%22y%22%3A0%2C%22shape%22%3A%22diamond%22%7D\" . }",
        "headers": {
          "Accept": "*/*",
          "Content-Type": "application/sparql-update",
        },
        "method": "POST"
      })
    })
  })

  describe("getAllElements", () => {
    beforeEach(() => {
      fetchMock.resetMocks();
    })
    it("should create two elements, one based of the subject and one off the object", async () => {
      const updateResponse = JSON.parse(JSON.stringify(mockSPARQLResponse))
      updateResponse.results.bindings[0].o.type = "illiteral"
      fetchMock.mockResponseOnce(JSON.stringify(updateResponse))
      const obj = new OntologyService()
      const got = await obj.getAllElements();
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3030/ontology/query?query=PREFIX%20xsd%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2001%2FXMLSchema%23%3E%20PREFIX%20dc%3A%20%3Chttp%3A%2F%2Fpurl.org%2Fdc%2Felements%2F1.1%2F%3E%20PREFIX%20rdf%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%20PREFIX%20rdfs%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23%3E%20PREFIX%20owl%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23%3E%20PREFIX%20telicent%3A%20%3Chttp%3A%2F%2Ftelicent.io%2Fontology%2F%3E%20SELECT%20*%20WHERE%20%7B%3Fs%20%3Fp%20%3Fo%7D")
      expect(got).toEqual(
        {
          "allElements": {
            "testObject1": {
              "comments": [],
              "defaultStyle": {
                "bgColour": "#888",
                "colour": "#000",
                "height": 0,
                "icon": "fa-solid fa-question",
                "shape": "diamond",
                "width": 0,
                "x": 0,
                "y": 0,
              },
              "labels": [],
              "ownedProperties": [],
              "predicates": {},
              "rdfType": [],
              "subClasses": [],
              "superClasses": [],
              "uri": "testObject1",
            },
            "testSubject1": {
              "comments": [],
              "defaultStyle": {
                "bgColour": "#888",
                "colour": "#000",
                "height": 0,
                "icon": "fa-solid fa-question",
                "shape": "diamond",
                "width": 0,
                "x": 0,
                "y": 0,
              },
              "labels": [],
              "ownedProperties": [],
              "predicates": {},
              "rdfType": [
                "testObject1",
              ],
              "subClasses": [],
              "superClasses": [],
              "uri": "testSubject1",
            },
          },
          "classes": {},
          "properties": {},
          "top": [],
        }
      )
    })

    it("should create one element, based of the subject the object should be skipped if it is a literal ", async () => {
      fetchMock.mockResponseOnce(JSON.stringify(mockSPARQLResponse))
      const obj = new OntologyService()
      const got = await obj.getAllElements();
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3030/ontology/query?query=PREFIX%20xsd%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2001%2FXMLSchema%23%3E%20PREFIX%20dc%3A%20%3Chttp%3A%2F%2Fpurl.org%2Fdc%2Felements%2F1.1%2F%3E%20PREFIX%20rdf%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%20PREFIX%20rdfs%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23%3E%20PREFIX%20owl%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23%3E%20PREFIX%20telicent%3A%20%3Chttp%3A%2F%2Ftelicent.io%2Fontology%2F%3E%20SELECT%20*%20WHERE%20%7B%3Fs%20%3Fp%20%3Fo%7D")
      expect(got).toEqual(
        {
          "allElements": {
            "testSubject1": {
              "comments": [],
              "defaultStyle": {
                "bgColour": "#888",
                "colour": "#000",
                "height": 0,
                "icon": "fa-solid fa-question",
                "shape": "diamond",
                "width": 0,
                "x": 0,
                "y": 0,
              },
              "labels": [],
              "ownedProperties": [],
              "subClasses": [],
              "superClasses": [],
              "predicates": {},
              "rdfType": [
                "testObject1",
              ],
              "uri": "testSubject1",
            },
          },
          "classes": {},
          "properties": {},
          "top": [],
        }
      )
    })

    it("should create one element, and add predicates", async () => {
      fetchMock.mockResponseOnce(JSON.stringify(mockSPARQLResponse))
      const obj = new OntologyService()
      const got = await obj.getAllElements(true);
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3030/ontology/query?query=PREFIX%20xsd%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2001%2FXMLSchema%23%3E%20PREFIX%20dc%3A%20%3Chttp%3A%2F%2Fpurl.org%2Fdc%2Felements%2F1.1%2F%3E%20PREFIX%20rdf%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%20PREFIX%20rdfs%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23%3E%20PREFIX%20owl%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23%3E%20PREFIX%20telicent%3A%20%3Chttp%3A%2F%2Ftelicent.io%2Fontology%2F%3E%20SELECT%20*%20WHERE%20%7B%3Fs%20%3Fp%20%3Fo%7D")
      expect(got).toEqual(
        {
          "allElements": {
            "testSubject1": {
              "comments": [],
              "defaultStyle": {
                "bgColour": "#888",
                "colour": "#000",
                "height": 0,
                "icon": "fa-solid fa-question",
                "shape": "diamond",
                "width": 0,
                "x": 0,
                "y": 0,
              },
              "labels": [],
              "ownedProperties": [],
              "subClasses": [],
              "superClasses": [],
              "predicates": {
                "http://www.w3.org/1999/02/22-rdf-syntax-ns#type": [
                  "testObject1",
                ],

              },
              "rdfType": [
                "testObject1",
              ],
              "uri": "testSubject1",
            },
          },
          "classes": {},
          "properties": {},
          "top": [],
        }
      )
    })
  })
})

