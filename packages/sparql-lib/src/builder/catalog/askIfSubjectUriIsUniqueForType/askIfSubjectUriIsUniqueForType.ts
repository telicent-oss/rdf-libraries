import {
  UpdateTriple,
} from "@telicent-oss/rdf-write-lib";
import { RDF_DOMAIN } from "../constants";


const RDF_TYPE = `${RDF_DOMAIN}#type` as const;



export const askIfSubjectUriIsUniqueForType = ({ s, p, o }: UpdateTriple) => {
  // Enforce short-form - instead of full url
  if (p !== 'rdf:type') {
    throw new Error(`askIfSubjectUriIsUniqueForType expects p === rdf:type (${RDF_TYPE}), got: ${p}`);
  }
  return `
PREFIX rdf: <${RDF_DOMAIN}> 

ASK {
  FILTER NOT EXISTS { <${s}> rdf:type <${o}> }
}
`;
};