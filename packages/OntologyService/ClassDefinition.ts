import ElementDefinition from "./ElementDefinition";

export default class ClassDefinition extends ElementDefinition{
  ownedProperties: string[] = [];
  subClasses: string[] = [];
  superClasses: string[] = [];

  addSubClass(subClass: string) {
    this.subClasses.push(subClass)
    return this;
  }

  addSuperClass(superClass: string) {
    this.superClasses.push(superClass)
    return this;
  }

  addOwnedProperties(property: string) {
    this.ownedProperties.push(property)
    return this;
  }
}
