import { z } from "zod";
import ElementDefinition from "./ElementDefinition";

export const ClassDefinitionSchema = z.object({
  ownedProperties: z.array(z.string()),
  subClasses: z.array(z.string()),
  superClasses: z.array(z.string()),
});

export default class ClassDefinition extends ElementDefinition {
  ownedProperties: string[] = [];
  subClasses: string[] = [];
  superClasses: string[] = [];

  constructor(uri?: string) {
    super(uri);
  }

  addSubClass(subClass: string) {
    this.subClasses.push(subClass);
    return this;
  }

  addSuperClass(superClass: string) {
    this.superClasses.push(superClass);
    return this;
  }

  addOwnedProperties(property: string) {
    this.ownedProperties.push(property);
    return this;
  }
}
