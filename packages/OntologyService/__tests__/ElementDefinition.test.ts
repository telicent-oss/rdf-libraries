import ElementDefinition from "../ElementDefinition";
import { makeStyleObject } from "../helper";
import Style from "packages/OntologyService"

describe("ElementDefinition", () => {
  it("should create an instance of an element with no uri", () => {
    const el = new ElementDefinition()
    expect(el).toEqual({
      comments: [],
      defaultStyle: makeStyleObject,
      labels: [],
      predicates: {},
      rdfType: [],
      uri: ""
    })
  })

  it("should create an instance of an element with a uri", () => {
    const el = new ElementDefinition("testUri")
    expect(el).toEqual({
      comments: [],
      defaultStyle: makeStyleObject,
      labels: [],
      predicates: {},
      rdfType: [],
      uri: "testUri"
    })
  })

  it("should add predicate to the element", () => {
    const el = new ElementDefinition("testUri")
      .addPredicate("predicateName", "predicateValue")

    expect(el).toEqual({
      comments: [],
      defaultStyle: makeStyleObject,
      labels: [],
      predicates: {
        predicateName: ["predicateValue"]
      },
      rdfType: [],
      uri: "testUri"
    })
  })

  it("should override default style", () => {
    const origStyle = makeStyleObject
    const el = new ElementDefinition("testUri")

    expect(el.defaultStyle).toEqual(origStyle)
    const updatedStyle = new Style("#999", "#111", "ri-icon")

    //el.setDefaultStyle(updatedStyle)
    //expect(el.defaultStyle).toEqual(updatedStyle)
  })
})
