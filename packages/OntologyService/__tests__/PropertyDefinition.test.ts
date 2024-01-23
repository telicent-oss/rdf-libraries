import PropertyDefinition from "../PropertyDefinition"

const propertyDefinitionStub = {
  "comments": [],
  "defaultStyle": {
    "bgColour": "#888",
    "colour": "#000",
    "icon": "fa-solid fa-question",
    "height": 0,
    "shape": "diamond",
    "width": 0,
    "x": 0,
    "y": 0
  },
  "domain": [],
  "labels": [],
  "predicates": {},
  "range": [],
  "rdfType": [],
  "subProperties": [],
  "superProperties": [],
  "uri": "",
}

describe("PropertyDefinition", () => {
  it("should create a property definition", () => {
    const obj = new PropertyDefinition();
    expect(obj).toEqual(propertyDefinitionStub)
  })

  it("should add a subProperty", () => {
    const obj = new PropertyDefinition()
      .addSubProperty("testSubProperty")

    expect(obj).toEqual({
      ...propertyDefinitionStub,
      subProperties: ["testSubProperty"]
    })
  })

  it("should add a superProperty", () => {
    const obj = new PropertyDefinition()
      .addSuperProperty("testSuperProperty")

    expect(obj).toEqual({
      ...propertyDefinitionStub,
      superProperties: ["testSuperProperty"]
    })
  })

  it("should add a domain", () => {
    const obj = new PropertyDefinition()
      .addDomain("testDomain")

    expect(obj).toEqual({
      ...propertyDefinitionStub,
      domain: ["testDomain"]
    })
  })

  it("should add a range", () => {
    const obj = new PropertyDefinition()
      .addRange("testRange")

    expect(obj).toEqual({
      ...propertyDefinitionStub,
      range: ["testRange"]
    })
  })
})
