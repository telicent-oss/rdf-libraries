import { z } from 'zod';
import { RDFSchema, RDFTripleSchema, URISegmentOrHashSchema } from './schema';

// Schema for the RDF triple
export type RDFTripleType = z.infer<typeof RDFTripleSchema>;
export type RDFType = z.infer<typeof RDFSchema>;
export type URISegmentOrHashType = z.infer<typeof URISegmentOrHashSchema>; // Lossy type