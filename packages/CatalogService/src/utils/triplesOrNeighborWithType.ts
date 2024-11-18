import { DCATResourceSchema, RDF_TYPE_URI } from "../../index";
import { RDFTripleType } from "@telicent-oss/rdfservice";
import { z, ZodSchema } from "zod";

export const findTripleBySchema =
  ({
    s = z.any(),
    p = z.any(),
    o = z.any(),
  }: {
    s?: ZodSchema;
    p?: ZodSchema;
    o?: ZodSchema;
  }) =>
  (triple: RDFTripleType) =>
    s.safeParse(triple.s.value).success &&
    p.safeParse(triple.p.value).success &&
    o.safeParse(triple.o.value).success;


// IDEA Perhaps remove this
// HOW use findTripleBySchema everywhere
// WHY its explicit (thus readable)
// WHY NOT? Its perhaps less performant; 
//  and using findTripleBySchema when there
//  is lots of repetition feels error-prone
//  but that feeling may fade.

export const findDCATResourceBySubject = (subject:string|undefined) => ({ s, p, o }:RDFTripleType) => 
  s.value === subject
  && p.value === RDF_TYPE_URI 
  && DCATResourceSchema.safeParse(o.value).success;



export const findTypeInTripleOrNeighbor = ({
  id,
  triples,
  assert
}: {
  id:string, 
  triples: RDFTripleType[],
  assert?: boolean
}): RDFTripleType | undefined => {
  // with subject of id, check DCATResourceSchema
  findTripleBySchema({
    s: z.literal(id),
    p: undefined,
    o: undefined
  });
  let found = triples.find(findDCATResourceBySubject(id));
  let neighbor:string | undefined;
  if (found === undefined) {
    // With connections to subject of id, check DCATResourceSchema
    neighbor = triples.find(({ o }) => o.value === id)?.s.value
    if (neighbor) {
      found = triples.find(findDCATResourceBySubject(neighbor));
    }
  }
  if (found === undefined && assert) {
    throw new Error(
      `Expected ${id} of type DCATResourceSchema (neighbor: ${neighbor})`
    );
  }
  return found;
}