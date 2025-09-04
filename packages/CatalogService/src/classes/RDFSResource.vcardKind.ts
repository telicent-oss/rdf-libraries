import { RDFSResource } from "@telicent-oss/rdfservice";
import { CatalogService, DcatResourceQuerySolution } from "../index";

/**
 * @deprecated Ash naive opinion follows: 
 * # RE:instances on sub-graphs of ontology
 * 
 * Short term seems unlikely we'd use this.
 * 
 * Medium term, MAYBE we'd bless a vocab of schema-based entities 
 * 
 * e.g. prov:person
 * 
 * But even then, it seems simpler/scalable to create new structural serializable data (rather than new code)
 * 
 * e.g 
 * ```tsx
 * type PropertyToOntology = Record<keyof RDFSResouce, schemaPredicates[]>
 * const prov:PropertyToOntology = {
 *   name: ['prov:name'];
 * }
 * ```
 * Also
 * 1. Practically: Our Product/Data teams haven't dealt in schema entities, only business entities
 * 2. Prior-art: I found no code built around schema entities after googling
 */
export class vcardKind extends RDFSResource {
  service: CatalogService;
  constructor(
    service: CatalogService,
    uri?: string,
    type: string = "http://www.w3.org/2006/vcard/ns#Kind",
    statement?: DcatResourceQuerySolution
  ) {
    let cached = false;
    if (uri) {
      cached = service.inCache(uri);
    }
    super(service, uri, type, statement);
    this.service = service;
    if (cached) {
      return this;
    }
  }

  async setFormattedName(name: string) {
    const promise = this.addLiteral(`${this.service.vcard}fn`, name);
    this.constructorPromises.push(promise);
    return promise;
  }
  setGivenName(name: string) {
    const promise = this.addLiteral(`${this.service.vcard}given-name`, name);
    this.constructorPromises.push(promise);
    return promise;
  }
  setFamilyName(name: string) {
    const promise = this.addLiteral(`${this.service.vcard}family-name`, name);
    this.constructorPromises.push(promise);
    return promise;
  }
  setEmail(emailAddress: string) {
    const promise = this.service.insertTriple(
      this.uri,
      `${this.service.vcard}hasEmail`,
      `mailto:` + emailAddress
    );
    this.constructorPromises.push(promise);
    return promise;
  }
}
