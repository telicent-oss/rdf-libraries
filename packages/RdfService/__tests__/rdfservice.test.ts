import fetchMock, { enableFetchMocks } from "jest-fetch-mock"
import RdfService, { emptyUriErrorMessage, emptyPredicateErrorMessage } from "../index"
//const crypto = require('crypto')
//
//jest.mock('crypto', () => ({
//  ...jest.requireActual('crypto'), // Preserve other methods from crypto module
//  randomUUID: jest.fn().mockReturnValue('mockedUUID'),
//}));


enableFetchMocks()

describe("RdfService", () => {
  describe("runQuery", () => {
    beforeEach(() => {
      fetchMock.resetMocks();
    });

    it("should call fetch with valid query", async () => {
      // pass a valid json response so error isn't thrown
      fetchMock.mockResponseOnce(JSON.stringify({ "name": "bob" }))

      const obj = new RdfService();
      await obj.runQuery("DarthVader")

      expect(fetch).toHaveBeenCalledTimes(1)
      expect(fetch).toHaveBeenCalledWith("http://localhost:3030/ds/query?query=PREFIX%20%3A%20%3Chttp%3A%2F%2Ftelicent.io%2Fdata%2F%3E%20PREFIX%20xsd%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2001%2FXMLSchema%23%3E%20PREFIX%20dc%3A%20%3Chttp%3A%2F%2Fpurl.org%2Fdc%2Felements%2F1.1%2F%3E%20PREFIX%20rdf%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%20PREFIX%20rdfs%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23%3E%20PREFIX%20owl%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23%3E%20PREFIX%20telicent%3A%20%3Chttp%3A%2F%2Ftelicent.io%2Fontology%2F%3E%20DarthVader")
    })

    it("should show a warning if and empty string query is passed", async () => {
      const obj = new RdfService()
      await expect(obj.runQuery("")).rejects.toThrow("A valid query is required")
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it("should throw an error if runQuery unexpectedly fails", async () => {
      fetchMock.mockRejectedValueOnce("Error: fake error message")

      const obj = new RdfService()
      await expect(obj.runQuery("DarthVader")).rejects.toMatch("Error: fake error message")
    })
  })

  describe("runUpdate", () => {
    beforeEach(() => {
      fetchMock.resetMocks();
    });

    it("should send a post request with a default securityLabel if none is provided", async () => {
      const obj = new RdfService();
      await obj.runUpdate("DarthVader")

      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3030/ds/update", { "body": "PREFIX : <http://telicent.io/data/> PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> PREFIX dc: <http://purl.org/dc/elements/1.1/> PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> PREFIX owl: <http://www.w3.org/2002/07/owl#> PREFIX telicent: <http://telicent.io/ontology/> DarthVader", "headers": { "Accept": "*/*", "Content-Type": "application/sparql-update" }, "method": "POST" })
    })

    it("should warn the user when setting securityLabel to empty string", async () => {
      const consoleMock = jest.spyOn(global.console, 'warn')
      const obj = new RdfService();
      await obj.runUpdate("DarthVader")

      expect(consoleMock).toHaveBeenCalled()
    })

    it.skip("should send a post request including sercurityLabel provided", async () => {
      // fetchMock.dontMock();
      const obj = new RdfService();
      const got = await obj.runUpdate("DarthVader", "mySecurityLabel")
      const SECURITY_LABEL_TODO = 'For this test to be valid we need a security label'
      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3030/ds/update", {
        "body": `PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> PREFIX dc: <http://purl.org/dc/elements/1.1/> PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> PREFIX owl: <http://www.w3.org/2002/07/owl#> PREFIX telicent: <http://telicent.io/ontology/> DarthVader`,
        "headers": {
          "Accept": "*/*",
          "Content-Type": "application/sparql-update",
          "Security_label_or_something!!!": SECURITY_LABEL_TODO
        },
        "method": "POST"
      })
      expect(got).toEqual({}) //What possible responses are there?
    })

    it("should throw an error if fetch encounters a problem", async () => {
      fetchMock.mockRejectedValueOnce("failure message")

      const obj = new RdfService()
      await expect(obj.runUpdate("DarthVader")).rejects.toMatch("failure message")
      expect(fetchMock).toHaveBeenCalled()
    })
  })

  describe("insertTriple", () => {
    beforeEach(() => {
      fetchMock.resetMocks();
    });

    it("should send post request to update triple", async () => {
      const obj = new RdfService()
      await obj.insertTriple("testSubject", "testPredicate", "testObject")
      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3030/ds/update", { "body": "PREFIX : <http://telicent.io/data/> PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> PREFIX dc: <http://purl.org/dc/elements/1.1/> PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> PREFIX owl: <http://www.w3.org/2002/07/owl#> PREFIX telicent: <http://telicent.io/ontology/> INSERT DATA {<testSubject> <testPredicate> <testObject> . }", "headers": { "Accept": "*/*", "Content-Type": "application/sparql-update" }, "method": "POST" })
    })

    it("should send post request with the defaultSecurityLabel", async () => {
      const obj = new RdfService()
      obj.defaultSecurityLabel = "testSecurityLabel"
      await obj.insertTriple("testSubject", "testPredicate", "testObject")
      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3030/ds/update", { "body": "PREFIX : <http://telicent.io/data/> PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> PREFIX dc: <http://purl.org/dc/elements/1.1/> PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> PREFIX owl: <http://www.w3.org/2002/07/owl#> PREFIX telicent: <http://telicent.io/ontology/> INSERT DATA {<testSubject> <testPredicate> <testObject> . }", "headers": { "Accept": "*/*", "Content-Type": "application/sparql-update" }, "method": "POST" })
    })

    it("should throw an error if fetch encounters a problem", async () => {
      fetchMock.mockRejectedValueOnce("failure message")

      const obj = new RdfService()
      await expect(obj.insertTriple("testSubject", "testPredicate", "testObject")).rejects.toMatch("failure message")
      expect(fetchMock).toHaveBeenCalled()
    })
  })

  describe("deleteTriple", () => {
    it("should send post request to delete triple", async () => {
      const obj = new RdfService()
      await obj.deleteTriple("testSubject", "testPredicate", "testObject", "LITERAL")
      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3030/ds/update", { "body": "PREFIX : <http://telicent.io/data/> PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> PREFIX dc: <http://purl.org/dc/elements/1.1/> PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> PREFIX owl: <http://www.w3.org/2002/07/owl#> PREFIX telicent: <http://telicent.io/ontology/> DELETE DATA {<testSubject> <testPredicate> \"testObject\" . }", "headers": { "Accept": "*/*", "Content-Type": "application/sparql-update" }, "method": "POST" })
    })

    it("should send post request with the defaultSecurityLabel", async () => {
      const obj = new RdfService()
      obj.defaultSecurityLabel = "testSecurityLabel"
      await obj.deleteTriple("testSubject", "testPredicate", "testObject", "LITERAL")
      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3030/ds/update", { "body": "PREFIX : <http://telicent.io/data/> PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> PREFIX dc: <http://purl.org/dc/elements/1.1/> PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> PREFIX owl: <http://www.w3.org/2002/07/owl#> PREFIX telicent: <http://telicent.io/ontology/> DELETE DATA {<testSubject> <testPredicate> \"testObject\" . }", "headers": { "Accept": "*/*", "Content-Type": "application/sparql-update" }, "method": "POST" })
    })

    it("should throw an error if fetch encounters a problem", async () => {
      fetchMock.mockRejectedValueOnce("failure message")

      const obj = new RdfService()
      await expect(obj.deleteTriple("testSubject", "testPredicate", "testObject", "LITERAL")).rejects.toMatch("failure message")
      expect(fetchMock).toHaveBeenCalled()
    })
  })

  describe("deleteNode", () => {
    beforeEach(() => {
      fetchMock.resetMocks();
    });

    it("should send post request to delete node do not ignoreInboundReferences ", async () => {
      const obj = new RdfService()

      // ignoreInboundReferences by default
      await obj.deleteNode("testSubject")
      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3030/ds/update", {
        "body": "PREFIX : <http://telicent.io/data/> PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> PREFIX dc: <http://purl.org/dc/elements/1.1/> PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> PREFIX owl: <http://www.w3.org/2002/07/owl#> PREFIX telicent: <http://telicent.io/ontology/> DELETE WHERE {?s ?p <testSubject>}",
        "headers": {
          "Accept": "*/*",
          "Content-Type": "application/sparql-update",
        },
        "method": "POST"
      })

      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3030/ds/update", {
        "body": "PREFIX : <http://telicent.io/data/> PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> PREFIX dc: <http://purl.org/dc/elements/1.1/> PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> PREFIX owl: <http://www.w3.org/2002/07/owl#> PREFIX telicent: <http://telicent.io/ontology/> DELETE WHERE {?s ?p <testSubject>}",
        "headers": {
          "Accept": "*/*",
          "Content-Type": "application/sparql-update",
        }
        , "method": "POST"
      })
    })

    it("should send post request to delete node, ignoreInboundReferences ", async () => {
      const obj = new RdfService()

      // ignoreInboundReferences set to true
      // expect query to be DELETE WHERE {?s ?p <testSubject>} 
      await obj.deleteNode("testSubject", true)
      expect(fetchMock).toHaveBeenCalledTimes(1)

      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3030/ds/update", {
        "body": "PREFIX : <http://telicent.io/data/> PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> PREFIX dc: <http://purl.org/dc/elements/1.1/> PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> PREFIX owl: <http://www.w3.org/2002/07/owl#> PREFIX telicent: <http://telicent.io/ontology/> DELETE WHERE {<testSubject> ?p ?o . }",
        "headers": {
          "Accept": "*/*",
          "Content-Type": "application/sparql-update",
        }, "method": "POST"
      })
    })

    it("should send post request with the defaultSecurityLabel", async () => {
      const obj = new RdfService()
      obj.defaultSecurityLabel = "testSecurityLabel"
      await obj.deleteNode("testSubject", true)
      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3030/ds/update", {
        "body": "PREFIX : <http://telicent.io/data/> PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> PREFIX dc: <http://purl.org/dc/elements/1.1/> PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> PREFIX owl: <http://www.w3.org/2002/07/owl#> PREFIX telicent: <http://telicent.io/ontology/> DELETE WHERE {<testSubject> ?p ?o . }",
        "headers": {
          "Accept": "*/*",
          "Content-Type": "application/sparql-update",
        }, "method": "POST"
      })
    })

    it("should throw an error if fetch encounters a problem", async () => {
      fetchMock.mockRejectedValueOnce("failure message")
      const obj = new RdfService()
      obj.defaultSecurityLabel = "defaultSecurityLabel" // done to suppress console.warn

      await obj.deleteNode("testSubject").catch(err => expect(err).toMatch("failure message"))
    })

    it("should throw error if the uri is an empty string", async () => {
      const obj = new RdfService()
      await expect(obj.deleteNode("")).rejects.toThrow(emptyUriErrorMessage)
    })

  })

  describe("deleteRelationships", () => {
    beforeEach(() => {
      fetchMock.resetMocks();
    })

    it("should make a post with valid request", async () => {
      const obj = new RdfService()
      obj.defaultSecurityLabel = "testSecurityLabel"

      await obj.deleteRelationships("testURI", "testPredicate")
      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3030/ds/update", { "body": "PREFIX : <http://telicent.io/data/> PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> PREFIX dc: <http://purl.org/dc/elements/1.1/> PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> PREFIX owl: <http://www.w3.org/2002/07/owl#> PREFIX telicent: <http://telicent.io/ontology/> DELETE WHERE {<testURI> <testPredicate> ?o . }", "headers": { "Accept": "*/*", "Content-Type": "application/sparql-update" }, "method": "POST" })
    })

    it("should throw an error if the uri is an empty string", async () => {
      const obj = new RdfService()
      obj.defaultSecurityLabel = "testSecurityLabel"

      await expect(obj.deleteRelationships("", "")).rejects.toThrow(emptyUriErrorMessage)
    })

    it("should throw an error if the predicate is an empty string", async () => {
      const obj = new RdfService()
      obj.defaultSecurityLabel = "testSecurityLabel"

      await expect(obj.deleteRelationships("testURI", "")).rejects.toThrow("Cannot have an empty predicate")
    })

    it("should throw an error if fetch encounters a problem", async () => {
      fetchMock.mockRejectedValueOnce("failure message")
      const obj = new RdfService()
      obj.defaultSecurityLabel = "defaultSecurityLabel" // done to suppress console.warn

      await obj.deleteRelationships("testSubject", "testPredicate").catch(err => expect(err).toMatch("failure message"))
    })
  })

  describe("instantiate", () => {
    beforeEach(() => {
      fetchMock.resetMocks();
    })

    it("should make a post with a valid request", async () => {
      const obj = new RdfService()
      await obj.instantiate("testCLS", "testURI")

      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3030/ds/update", { "body": "PREFIX : <http://telicent.io/data/> PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> PREFIX dc: <http://purl.org/dc/elements/1.1/> PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> PREFIX owl: <http://www.w3.org/2002/07/owl#> PREFIX telicent: <http://telicent.io/ontology/> INSERT DATA {<testURI> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <testCLS> . }", "headers": { "Accept": "*/*", "Content-Type": "application/sparql-update" }, "method": "POST" })
    })

    xit("should generate a URI if none is provided", async () => {
      const obj = new RdfService()
      await obj.instantiate("testCLS", "")

      const expectedURI = "http://telicent.io/data/mockedUUID"
      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3030/ds/update", {
        "body": "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> PREFIX dc: <http://purl.org/dc/elements/1.1/> PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> PREFIX owl: <http://www.w3.org/2002/07/owl#> PREFIX telicent: <http://telicent.io/ontology/> INSERT DATA {<" + expectedURI + "> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <testCLS> . }",
        "headers": {
          "Accept": "*/*",
          "Content-Type": "application/sparql-update",
        },
        "method": "POST"
      })
    })

    it("should throw an error if cls is an empty string", async () => {
      const obj = new RdfService();
      await expect(obj.instantiate("", "")).rejects.toThrow("Cannot have an empty cls")
    })
  })

  describe("addLiteral", () => {
    beforeEach(() => {
      fetchMock.resetMocks();
    })

    it("should send post request to add Literal", async () => {
      const obj = new RdfService();
      await obj.addLiteral("testUri", "testPredicate", "testText")

      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3030/ds/update", { "body": "PREFIX : <http://telicent.io/data/> PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> PREFIX dc: <http://purl.org/dc/elements/1.1/> PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> PREFIX owl: <http://www.w3.org/2002/07/owl#> PREFIX telicent: <http://telicent.io/ontology/> INSERT DATA {<testUri> <testPredicate> \"testText\" . }", "headers": { "Accept": "*/*", "Content-Type": "application/sparql-update" }, "method": "POST" })
    })

    it("should send post request to delete before adding new literal", async () => {
      const obj = new RdfService();
      await obj.addLiteral("testUri", "testPredicate", "testText", true)

      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(fetchMock).toHaveBeenNthCalledWith(1, "http://localhost:3030/ds/update", {
        "body": "PREFIX : <http://telicent.io/data/> PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> PREFIX dc: <http://purl.org/dc/elements/1.1/> PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> PREFIX owl: <http://www.w3.org/2002/07/owl#> PREFIX telicent: <http://telicent.io/ontology/> DELETE WHERE {<testUri> <testPredicate> ?o . }",
        "headers": {
          "Accept": "*/*",
          "Content-Type": "application/sparql-update",
        }, "method": "POST"
      })
      expect(fetchMock).toHaveBeenLastCalledWith("http://localhost:3030/ds/update", { "body": "PREFIX : <http://telicent.io/data/> PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> PREFIX dc: <http://purl.org/dc/elements/1.1/> PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> PREFIX owl: <http://www.w3.org/2002/07/owl#> PREFIX telicent: <http://telicent.io/ontology/> INSERT DATA {<testUri> <testPredicate> \"testText\" . }", "headers": { "Accept": "*/*", "Content-Type": "application/sparql-update" }, "method": "POST" })
    })

    it("should throw an error if the uri is an empty string", async () => {
      const obj = new RdfService()
      await expect(obj.addLiteral("", "testPredicate", "testText")).rejects.toThrow(emptyUriErrorMessage)
    })

    it("should throw an error if the predicate is an empty string", async () => {
      const obj = new RdfService()
      await expect(obj.addLiteral("testUri", "", "testText")).rejects.toThrow("Cannot have an empty predicate")
    })

    it("should throw an error if the text is an empty string", async () => {
      const obj = new RdfService()
      await expect(obj.addLiteral("testUri", "testPredicate", "")).rejects.toThrow("Cannot have empty text in a triple")
    })
  })

  describe("addLabel", () => {
    beforeEach(() => {
      fetchMock.resetMocks()
    })

    it("should send post request to add label", async () => {
      const obj = new RdfService()
      await obj.addLabel("testUri", "testLabel")

      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3030/ds/update", { "body": "PREFIX : <http://telicent.io/data/> PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> PREFIX dc: <http://purl.org/dc/elements/1.1/> PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> PREFIX owl: <http://www.w3.org/2002/07/owl#> PREFIX telicent: <http://telicent.io/ontology/> INSERT DATA {<testUri> <http://www.w3.org/2000/01/rdf-schema#label> <testLabel> . }", "headers": { "Accept": "*/*", "Content-Type": "application/sparql-update" }, "method": "POST" })
    })

    it("should throw an error if the uri is an empty string", async () => {
      const obj = new RdfService()
      await expect(obj.addLabel("", "testLabel")).rejects.toThrow(emptyUriErrorMessage)
    })

    it("should throw an error if the label is an empty string", async () => {
      const obj = new RdfService()
      await expect(obj.addLabel("testUri", "")).rejects.toThrow("invalid label string")
    })
  })

  describe("addComment", () => {
    beforeEach(() => {
      fetchMock.resetMocks()
    })

    it("should send post request to add comment", async () => {
      const obj = new RdfService();
      await obj.addComment("testUri", "testComment")

      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3030/ds/update", { "body": "PREFIX : <http://telicent.io/data/> PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> PREFIX dc: <http://purl.org/dc/elements/1.1/> PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> PREFIX owl: <http://www.w3.org/2002/07/owl#> PREFIX telicent: <http://telicent.io/ontology/> INSERT DATA {<testUri> <http://www.w3.org/2000/01/rdf-schema#comment> <testComment> . }", "headers": { "Accept": "*/*", "Content-Type": "application/sparql-update" }, "method": "POST" })
    })

    it("should throw an error if the uri is an empty string", async () => {
      const obj = new RdfService()
      await expect(obj.addComment("", "testComment")).rejects.toThrow(emptyUriErrorMessage)
    })

    it("should throw an error if the uri is an empty string", async () => {
      const obj = new RdfService()
      await expect(obj.addComment("testUri", "")).rejects.toThrow("invalid comment string")
    })
  })

  describe("getRelated", () => {
    beforeEach(() => {
      fetchMock.resetMocks()
    })

    it("should send a post request to get all objects related to the uri by a predicate", async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ "name": "bob" }))

      const obj = new RdfService()
      await obj.getRelated("testUri", "testPredicate")

      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3030/ds/query?query=PREFIX%20%3A%20%3Chttp%3A%2F%2Ftelicent.io%2Fdata%2F%3E%20PREFIX%20xsd%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2001%2FXMLSchema%23%3E%20PREFIX%20dc%3A%20%3Chttp%3A%2F%2Fpurl.org%2Fdc%2Felements%2F1.1%2F%3E%20PREFIX%20rdf%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%20PREFIX%20rdfs%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23%3E%20PREFIX%20owl%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23%3E%20PREFIX%20telicent%3A%20%3Chttp%3A%2F%2Ftelicent.io%2Fontology%2F%3E%20SELECT%20%3Frelated%20WHERE%20%7B%3CtestUri%3E%20%3Fpred%20%3Frelated%20.%20%3Fpred%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23subPropertyOf%3E*%20%3CtestPredicate%3E%20.%7D")
    })

    it("should throw error if the uri is an empty string", async () => {
      const obj = new RdfService()
      await expect(obj.getRelated("", "testPredicate")).rejects.toThrow(emptyUriErrorMessage)
    })

    it("should throw error if the predicate is an empty string", async () => {
      const obj = new RdfService()
      await expect(obj.getRelated("testUri", "")).rejects.toThrow(emptyPredicateErrorMessage)
    })
  })

  describe("getRelating", () => {
    beforeEach(() => {
      fetchMock.resetMocks()
    })

    it("should send a post request to get all subjects related to the uri by a predicate", async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ "name": "bob" }))

      const obj = new RdfService()
      await obj.getRelating("testUri", "testPredicate")
      const [urlArg] = fetchMock.mock.calls[0]
      expect(urlArg).toEqual("http://localhost:3030/ds/query?query=PREFIX%20%3A%20%3Chttp%3A%2F%2Ftelicent.io%2Fdata%2F%3E%20PREFIX%20xsd%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2001%2FXMLSchema%23%3E%20PREFIX%20dc%3A%20%3Chttp%3A%2F%2Fpurl.org%2Fdc%2Felements%2F1.1%2F%3E%20PREFIX%20rdf%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%20PREFIX%20rdfs%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23%3E%20PREFIX%20owl%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23%3E%20PREFIX%20telicent%3A%20%3Chttp%3A%2F%2Ftelicent.io%2Fontology%2F%3E%20SELECT%20%3Frelating%20WHERE%20%7B%3Frelating%20%3Fpred%20%3CtestUri%3E%20.%20%3Fpred%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23subPropertyOf%3E*%20%3CtestPredicate%3E%20.%20%7D")
    })

    it("should throw error if the uri is an empty string", async () => {
      const obj = new RdfService()
      await expect(obj.getRelating("", "testPredicate")).rejects.toThrow(emptyUriErrorMessage)
    })

    it("should throw error if the predicate is an empty string", async () => {
      const obj = new RdfService()
      await expect(obj.getRelating("testUri", "")).rejects.toThrow(emptyPredicateErrorMessage)
    })
  })
})
