import ClassDefinition from "../ClassDefinition";
import { makeStyleObject } from "../helper";

describe("ClassDefinition", () => {
  it("should create a new class class ;)", () => {
    const cls = new ClassDefinition()

    expect(cls).toEqual({
      comments: [],
      defaultStyle: makeStyleObject(),
      labels: [],
      ownedProperties: [],
      predicates: {},
      rdfType: [],
      subClasses: [],
      superClasses: [],
      uri: ""
    })
  })

  it("should add a subclass to the class", () => {
    const cls = new ClassDefinition()
      .addSubClass("testSubClass")

    expect(cls).toEqual({
      comments: [],
      defaultStyle: makeStyleObject(),
      labels: [],
      ownedProperties: [],
      predicates: {},
      rdfType: [],
      subClasses: ["testSubClass"],
      superClasses: [],
      uri: ""
    })
  })

  it("should add a superclass to the class", () => {
    const cls = new ClassDefinition()
      .addSuperClass("testSuperClass")

    expect(cls).toEqual({
      comments: [],
      defaultStyle: makeStyleObject(),
      labels: [],
      ownedProperties: [],
      predicates: {},
      rdfType: [],
      subClasses: [],
      superClasses: ["testSuperClass"],
      uri: ""
    })
  })

  it("should add an ownedProperty to the class", () => {
    const cls = new ClassDefinition()
      .addOwnedProperties("testProperty")

    expect(cls).toEqual({
      comments: [],
      defaultStyle: makeStyleObject(),
      labels: [],
      ownedProperties: ["testProperty"],
      predicates: {},
      rdfType: [],
      subClasses: [],
      superClasses: [],
      uri: ""
    })
  })
})

