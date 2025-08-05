import { RDFSResource } from "@telicent-oss/rdfservice";
import { CatalogService, DcatResourceQuerySolution } from "../index";

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
