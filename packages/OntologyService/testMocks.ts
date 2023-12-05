import OntologyService from "./index"

const ontServ = new OntologyService()

export const { rdfType, rdfProperty, rdfsClass, rdfsSubClassOf, rdfsSubPropertyOf, rdfsDomain } = ontServ
