import { NamedPredicate, StyleObject } from "./Types";
import { z } from "zod"

export const ElementDefinitionSchema = z.object({
  uri: z.string(),
  rdfType: z.array(z.string()),
  labels: z.array(z.string()),
  comments: z.array(z.string()),
  defaultStyle: StyleObject,
})

export default class ElementDefinition {
  uri: string = "";
  rdfType: string[] = [];
  labels: string[] = [];
  comments: string[] = [];
  defaultStyle: z.infer<typeof StyleObject> = {
    bgColour: "#888",
    colour: "#000",
    icon: "fa-solid fa-question",
    height: 0,
    width: 0,
    x: 0,
    y: 0,
    shape: "diamond"
  };

  predicates: NamedPredicate = {}

  constructor(uri?: string) {
    if (uri) this.uri = uri
  }

  addPredicate(predicate: string, value: string) {
    if (!(predicate in this.predicates)) {
      this.predicates[predicate] = [value]
    } else {
      this.predicates[predicate].push(value)
    }
    return this;
  }

  setDefaultStyle(style: z.infer<typeof StyleObject>) {
    this.defaultStyle = style;
    return this;
  }

  addRdfType(type: string) {
    this.rdfType.push(type)
    return this;
  }

  addLabel(label: string) {
    this.labels.push(label)
    return this;
  }

  addComment(comment: string) {
    this.comments.push(comment)
    return this;
  }
}
