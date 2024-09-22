import { RDFTripleType } from "@telicent-oss/rdfservice";
import { CatalogService, DCATResourceSchema, RDF_TYPE_URI } from "../../index";
import {
  findTripleBySchema,
} from "../utils/triplesOrNeighborWithType";
import { z } from "zod";

export interface IDCAT3Interpretation {
  dcTitleFromTriples(
    id: string,
    triples: RDFTripleType[],
    options?: { assert?: boolean }
  ): any | undefined;
}
export class DCAT3InterpretationByCola implements IDCAT3Interpretation {
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

  dcTitleFromTriples = (
    id: string,
    triples: RDFTripleType[],
    options: { assert: boolean }
  ) => {
    {
      const titleTriple = triples.find(
        findTripleBySchema({
          s: z.literal(id),
          p: z.literal(this.service.dcTitle),
        })
      );

      if (titleTriple?.o.value) {
        return titleTriple?.o.value;
      }
    }
    {
      const typeTriple = triples.find(
        findTripleBySchema({
          s: z.literal(id),
          p: z.literal(RDF_TYPE_URI),
          o: DCATResourceSchema,
        })
      );
      const titleTriple = triples.find(
        findTripleBySchema({
          s: z.literal(typeTriple?.s.value),
          p: z.literal(this.service.dcTitle),
          o: undefined
        })
      );
      if (titleTriple?.o.value) {
        return titleTriple?.o.value;
      }
    }
    if (options?.assert) {
      throw new Error(`dcTitleFromTriples assert failed for "${id}"`);
    }
  };
}
