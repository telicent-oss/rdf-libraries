import z from 'zod';

// Bad: 
export const permissiveUriRegex = /^(https?|ftp):\/\/[^ \t\r\n]+$/i;


// Schema for the object representing "o", "p", or "s" within each triple
const TripleObjectSchema = z.object({
  type: z.string(),
  value: z.string()
}).refine((value) => {
  // Validate as URI if type is "uri"
  return value.type !== 'uri' || permissiveUriRegex.test(value?.value);
  // TODO inefficient
  // WHEN ASAP
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
