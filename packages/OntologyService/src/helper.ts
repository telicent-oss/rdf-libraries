//import { SPARQL } from "packages/RdfService";

import { Style } from "./index";
/*
 * @function makeStyleObject
 * @remarks
 * creates a js object with the provided colours, icons, etc. If you leave them unset, they'll default to the grey box.
 * @param string - An array of URIs (strings) of the classes whose styles are required
 * @param string - An array of URIs (strings) of the classes whose styles are required
 * @param string - Legacy feature - an alternative remix icon ID for older apps that still use remix. This will be deprecated in future versions
 * @param string - The font awesome icon string
 * @param string - The unicode representation of the font awesome icon
 * @param string - The class string of font awesome icon - usually ontologyService also included in the faIcon string
 * @returns object - a style object for use in other methods
 */
export const makeStyleObject = new Style(
  "#888",
  "#000",
  "fa-solid fa-question",
);
/*
const doesExist = (target: string, elementList: AllElements) => Boolean(target in elementList)

const processClasses = (elementList: AllElements, subject: string, object: string) => {
  if (!(elementList[subject])) {
    elementList[subject] = new ClassDefinition()
      .addSuperClass(object)
  }

  if (!(elementList[object])) {
    elementList[object] = new ClassDefinition()
      .addSubClass(subject)
  }
}

const processProperties = (output: OntologyService, subject: string, object: string) => {
  const subjectProperty = output.nodes.allElements[subject] as PropertyDefinition ?? new PropertyDefinition()
    .addSuperProperty(object)

  const objectProperty = output.nodes.allElements[object] as PropertyDefinition ?? new PropertyDefinition()
    .addSubProperty(subject)

  output.nodes.allElements[subject] = output.nodes.properties[subject] = subjectProperty;
  output.nodes.allElements[object] = output.nodes.properties[object] = objectProperty;
}

const processRdfsDomain = (output: OntologyService, subject: string, object: string) => {
  const domainProperty = output.nodes.allElements[subject] as PropertyDefinition ?? new PropertyDefinition()
    .addDomain(object)
  const classProperty = output.nodes.allElements[object] as ClassDefinition ?? new ClassDefinition()
    .addOwnedProperties(subject)

  output.nodes.allElements[subject] = output.nodes.properties[subject] = domainProperty;
  output.nodes.allElements[object] = output.nodes.classes[object] = classProperty;
}

const processRdfsRange = (output: OntologyService, subject: string, object: string) => {
  const rangeProperty = output.nodes.allElements[subject] as PropertyDefinition ?? new PropertyDefinition()
    .addRange(object)

  const classProperty = output.nodes.allElements[object] as ClassDefinition ?? new ClassDefinition()

  output.nodes.allElements[subject] = output.nodes.properties[subject] = rangeProperty;
  output.nodes.allElements[object] = output.nodes.classes[object] = classProperty;
}


const processRdfType = (output: OntologyService, subject: string, object: string) => {
  if ((object === output.rdfsClass) || (object === output.owlClass)) {
    const predicateClass = output.nodes.allElements[subject] as ClassDefinition ?? new ClassDefinition()
      .addSuperClass(object)

    output.nodes.allElements[subject] = output.nodes.classes[subject] = predicateClass;
  } else if ((object === output.rdfProperty) || (object === output.owlDatatypeProperty) || (object === output.owlObjectProperty)) {
    const predicateProperty = output.nodes.allElements[subject] as PropertyDefinition ?? new PropertyDefinition()
      .addDomain(object)
    const classProperty = output.nodes.allElements[object] as ClassDefinition ?? new ClassDefinition()
    output.nodes.allElements[subject] = output.nodes.properties[subject] = predicateProperty;
    output.nodes.allElements[object] = output.nodes.classes[object] = classProperty;
  }
}
const isClassDefinition = (el: any): el is ClassDefinition => el instanceof ClassDefinition;

const processPredicates = (getAllPredicates = false, output: OntologyService, predicate: string, subject: string, object: string) => {
  const element = output.nodes.allElements[subject]
  if (!isClassDefinition(element)) {
    throw new Error("should never go here");
  }

  if (getAllPredicates) {
    element.addPredicate(predicate, object)
  }

  if ((predicate === output.telicentStyle) && object) {
    const styleObj = JSON.parse(decodeURIComponent(object))
    element.setDefaultStyle(styleObj)
  }

  switch (predicate) {
    case output.rdfsSubClassOf:
      processClasses(output.nodes.allElements, subject, object);
      break;
    case output.rdfsSubPropertyOf:
      processProperties(output, subject, object)
      break;
    case output.rdfsDomain:
      processRdfsDomain(output, subject, object)
      break;
    case output.rdfsRange:
      processRdfsRange(output, subject, object)
      break;
    case output.rdfType:
      processRdfType(output, subject, object)
      element.addRdfType(object)
      break;
    case output.rdfsLabel:
      element.addLabel(object)
      break;
    case output.rdfsComment:
      element.addComment(object)
      break;
    default:
      break;
  }
}

export const buildStatementPartial = (ontologyService: OntologyService, getAllPredicates = false) => (statement: SPARQL) => {
  const subject = statement.s.value;
  const predicate = statement.p.value;
  const object = statement.o.value;

  if ((statement.o.type !== "literal") && !doesExist(object, ontologyService.nodes.allElements)) {
    // Going to need superClasses field which is on ClassDefinition.
    // Are the naming conventions correct? Should ElementDefinition always
    // be ClassDefinition schema?
    ontologyService.nodes.allElements[object] = new ClassDefinition(object)
  }

  if (!doesExist(subject, ontologyService.nodes.allElements)) {
    ontologyService.nodes.allElements[subject] = new ClassDefinition(subject)
  }


  processPredicates(getAllPredicates, ontologyService, predicate, subject, object)

  return ontologyService.nodes
}


*/
