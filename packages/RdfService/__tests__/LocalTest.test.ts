import RdfService from "../RdfService"

describe("LocalTest", () => {
    it("should connect to triplestore", () => {
      const service = new RdfService()
      const dc = service.dc
      expect(dc).toEqual("http://purl.org/dc/elements/1.1/")
    })
  
  })