import { COMMON_PREFIXES } from "../constants";

export type DistributionByUriResult = {
  identifier?: { value: string | null };
  dataset?: { value: string | null }; // URI of attached dcat:Dataset (if any)
};

export const getDistributionByUri = ({
  distributionUri,
}: {
  distributionUri: string;
}) =>
  `
${COMMON_PREFIXES}
SELECT
  (SAMPLE(?id) AS ?identifier)
  (SAMPLE(?ds) AS ?dataset)
WHERE {
  VALUES ?dist { <${distributionUri}> }
  # ?dist a dcat:Distribution . # Don't need as "distribution; is in namespace for disambiguation
  OPTIONAL { ?dist dct:identifier ?id }
  OPTIONAL {
    ?ds a dcat:Dataset ;
        dcat:distribution ?dist .
  }
}
`.trim();