import z from 'zod';
import { isValidURI } from './isValidURI';


// Schema for the object representing "o", "p", or "s" within each triple
const TripleObjectSchema = z.object({
  type: z.string(),
  value: z.string()
}).refine((value) => {
  // Validate as URI if type is "uri"
  return (value.type !== 'uri' 
    // TODO Check this logic/name
    // WHY Ash was tempted to do this: `&& value.type !== 'literal'`
    //  Probably not required or perhaps semantically wrong
    // HOW Check if Schema should be renamed
  ) || isValidURI(value?.value);
  // TODO Make more performant
  // WHY executed many times
  // WHEN perf is noticeable
}, {
  message: "The value must be a valid URI when type is 'uri'"
});

// Schema for the RDF triple
export const RDFTripleSchema = z.object({
  o: TripleObjectSchema,
  p: TripleObjectSchema,
  s: TripleObjectSchema,
});

// Schema for the entire RDF dataset
export const RDFSchema = z.array(RDFTripleSchema);
