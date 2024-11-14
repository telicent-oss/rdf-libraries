/* eslint-disable @typescript-eslint/no-unused-vars */
import { RDFTripleType } from "@telicent-oss/rdfservice";
import { CatalogService } from "../../index";
import { IDCAT3Interpretation } from "./types";

// !WARNING Not used; Implement or delete
// HOW
//  Decide what to do with existing DCAT/RDF classes;
//     - How/where serialize / deserialize?
//     - How/where to put spec-interpretation / semantic-variation
//    perhaps refactor DCAT3 classes to encapsulate an interpretation
//    and inject as dependency into CatalogService

export class DCAT3InterpretationByBailey implements IDCAT3Interpretation {
  private service: CatalogService;

  constructor(service: CatalogService) {
    if (service.interpretation !== undefined) {
      throw new Error(
        `Expected DCAT3InterpretationByCola to be instantiated by CatalogService.
        ` +
          `Rationale: time-saving trade-off
        ` +
          `Intention: Pass instance of interpretation to service
        `
      );
    }
    this.service = service;
  }
  dcTitleFromTriples(id: string, triples: RDFTripleType[], options?: { assert: boolean; }): string | undefined {
    throw new Error("Method not implemented.");
  }
  dcPublishedFromTriples(id: string, triples: RDFTripleType[], options?: { assert: boolean; }): string | undefined {
    throw new Error("Method not implemented.");
  }
  creatorNameFromTriples(id: string, triples: RDFTripleType[], options?: { assert: boolean; }): string | undefined {
    throw new Error("Method not implemented.");
  }
  creatorEmailFromTriples(id: string, triples: RDFTripleType[], options?: { assert: boolean; }): string | undefined {
    throw new Error("Method not implemented.");
  }
  rightsFromTriples(id: string, triples: RDFTripleType[], options?: { assert: boolean; }): string | undefined {
    throw new Error("Method not implemented.");
  }

}
