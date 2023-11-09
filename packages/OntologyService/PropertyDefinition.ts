import ElementDefinition from "./ElementDefinition";

export default class PropertyDefinition extends ElementDefinition {
  subProperties: string[] = [];
  superProperties: string[] = [];
  domain: string[] = [];
  range: string[] = [];

  addSubProperty(subProperty: string) {
    this.subProperties.push(subProperty)
    return this;
  }

  addSuperProperty(superProperty: string) {
    this.superProperties.push(superProperty)
    return this;
  }

  addDomain(domain: string) {
    this.domain.push(domain)
    return this;
  }

  addRange(range: string) {
    this.range.push(range)
    return this;
  }
}


