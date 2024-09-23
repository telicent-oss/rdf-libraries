import { LiteralPropertyQuerySolution, RDFTripleType, RelatedLiterals } from "@telicent-oss/rdfservice";
import { CatalogService, DCATResourceSchema, RDF_TYPE_URI } from "../../index";
import { findTripleBySchema } from "../utils/triplesOrNeighborWithType";
import { z, ZodSchema } from "zod";
import { IDCAT3Interpretation } from "./types";
import { formatDataAsArray } from "../__tests__/utils/formatDataAsArray";

const TERM = {
  published: 'http://purl.org/dc/terms/issued',
  owner: {
    publisher: 'http://purl.org/dc/terms/publisher',
  }
}

const findTripleWithTriples = (triples:RDFTripleType[]) =>
  ({ s, p, o, label }: { s?: ZodSchema; p?:ZodSchema; o?: ZodSchema, label:string}) => {
    const result = triples.find(findTripleBySchema({ s, p, o }));
    return result;
  }

  const findTripleWithTriplesAssert = (triples:RDFTripleType[]) =>
  ({ s, p, o, label }: { s?: ZodSchema; p?:ZodSchema; o?: ZodSchema, label:string}) => {
    const result = triples.find(findTripleBySchema({ s, p, o }));
    if (result === undefined) {
      throw new Error(`Expected to find ${label}`);
    }
    return result;
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
      // TODO Check if can delete this block
      // WHEN Have time to test
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
          o: undefined,
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

  dcPublishedFromTriples = (
    id: string,
    triples: RDFTripleType[],
    options: { assert: boolean }
  ) => {
    {
      // TODO Check if can delete this block
      // WHEN Have time to test
      const publishedTriple = triples.find(
        findTripleBySchema({
          s: z.literal(id),
          p: z.literal(TERM.published),
        })
      );

      if (publishedTriple?.o.value) {
        return publishedTriple?.o.value;
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
      const publishedTriple = triples.find(
        findTripleBySchema({
          s: z.literal(typeTriple?.s.value),
          p: z.literal(TERM.published),
          o: undefined,
        })
      );
      if (publishedTriple?.o.value) {
        return publishedTriple?.o.value;
      }
    }
    if (options?.assert) {
      throw new Error(`dcPublishedFromTriples failed to find "${TERM.published}" for "${id}" in ${triples.length} triples
        ${formatDataAsArray(triples, 80).join('\n')}`);
    }
  };

  creatorFromTriples = (
    id: string,
    triples: RDFTripleType[],
    options: { assert: boolean }
  ) => {
    const getTriple = options?.assert ? findTripleWithTriplesAssert(triples) : findTripleWithTriples(triples);

    const resource = getTriple({
      label: "resource",
      s: z.literal(id),
      p: z.literal(RDF_TYPE_URI),
      o: DCATResourceSchema,
    });
    const publisher = getTriple({
      label: `publisher for ${resource?.s.value}`,
      s: z.literal(resource?.s.value),
      p: z.literal('http://purl.org/dc/terms/publisher'),
      o: undefined,
    });
    const email = getTriple({
      label: "email",
      s: z.literal(publisher?.o.value),
      p: z.literal("https://schema.org/email"),
      o: undefined,
    });
    const name = getTriple({
      label: "name",
      s: z.literal(publisher?.o.value),
      p: z.literal("https://schema.org/name"),
      o: undefined,
    });

    return {
      name: name?.o.value,
      email: email?.o.value.replace('http://server/unset-base/', '')
    }
  };
  creatorNameFromTriples = (
    id: string,
    triples: RDFTripleType[],
    options: { assert: boolean }
  ) => this.creatorFromTriples(id,triples, options)?.name

  creatorEmailFromTriples = (
    id: string,
    triples: RDFTripleType[],
    options: { assert: boolean }
  ) => this.creatorFromTriples(id,triples, options)?.email
  
  rightsFromTriples = (
    id: string,
    triples: RDFTripleType[],
    options: { assert: boolean }
  ) => {
    const getTriple = options?.assert ? findTripleWithTriplesAssert(triples) : findTripleWithTriples(triples);

    const resource = getTriple({
      label: "resource",
      s: z.literal(id),
      p: z.literal(RDF_TYPE_URI),
      o: DCATResourceSchema,
    });
    const rights = getTriple({
      label: `rights for ${resource?.s.value}, for ${id}`,
      s: z.literal(resource?.s.value),
      p: z.literal('http://purl.org/dc/terms/rights'),
      o: undefined,
    });
    const description = getTriple({
      label: `description for ${rights?.o.value}, for ${resource?.s.value}, for ${id}`,
      s: z.literal(rights?.o.value),
      p: z.literal("http://purl.org/dc/terms/description"),
      o: undefined,
    });

    return description?.o.value
  };
}
