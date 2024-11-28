import z from 'zod';
import { isValidURI, permissiveUriRegex } from './isValidURI';


/**
 * RE: Name "URISegmentOrHashSchema"
 * the requirement for a url segment or a hash is likely mentioned
 * in specs - I prefer naming it literally for readability and grepping
 */
export const URISegmentOrHashSchema = z.string().regex(permissiveUriRegex, {
  message: `
  Invalid URI format. 
  Ensure it starts with a valid scheme and is followed by '://',
  then a valid resource part without spaces.`,
}).refine(value => {
  try {
    const url = new URL(value);
    // Check for hash or at least one path segment
    return url.hash !== '' || url.pathname.split('/').length > 1
  } catch {
    return false;
  }
}, {
  message: "URI must include either a hash or at least one URI segment."
});






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
