import PropertyDefinition from "../PropertyDefinition"

const propertyDefinitionStub = {
  "comments": [],
  "defaultStyle": {
    "backgroundColor": "#888",
    "color": "#000",
    "faClass": "fa-solid",
    "faIcon": "fa-solid fa-question",
    "faUnicode": "?",
    "icon": "ri-question-mark",
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
