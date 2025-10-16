import { UpdateTriple } from "@telicent-oss/rdf-write-lib";

/**
 * ASK: For the given (s, p), there is no object different from `o`.
 * Returns true when (s,p) has:
 *   - no objects, OR
 *   - exactly `o`
 * Returns false if any other object exists for (s,p).
 */
export const askIfObjectIsUniqueForPredicate = ({ s, p, o }: UpdateTriple) => {
  const pred = p.startsWith("http") ? `<${p}>` : p; // allow prefixed name like rdf:type
  const obj =
    o.startsWith("http") ? `<${o}>` : `"${o.replace(/"/g, '\\"')}"`;

  return `
  # For the given (s, p), there is no object different from "o"
ASK {
  FILTER NOT EXISTS {
    <${s}> ${pred} ?other .
    FILTER (?other != ${obj})
  }
}
`.trim();
};