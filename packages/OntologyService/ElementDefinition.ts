import { NamedPredicate, StyleObject } from "./Types";
import { z } from "zod"

export default class ElementDefinition {
  uri: string = "";
  rdfType: string[] = [];
  labels: string[] = [];
  comments: string[] = [];
  defaultStyle: z.infer<typeof StyleObject> = {
    backgroundColor: "#888",
    color: "#000",
    icon: "ri-question-mark",
    faIcon: "fa-solid fa-question",
    faUnicode: "\u003f",
    faClass: "fa-solid"
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
