import { z } from 'zod';
import { RDFSchema, RDFTripleSchema } from './schema';

// Schema for the RDF triple
export type RDFTripleType = z.infer<typeof RDFTripleSchema>;
export type RDFType = z.infer<typeof RDFSchema>;
