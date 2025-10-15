export const askIfDistributionIdentifierIsUnattached = ({
  distributionIdentifier,
  datasetUri,
}: {
  distributionIdentifier: string;
  datasetUri?: string;
}) => {
  const datasetFilter = datasetUri
    ? `FILTER(?s != <${datasetUri}>)`
    : "";
  return `
  PREFIX dcat: <http://www.w3.org/ns/dcat#>
  PREFIX dct:  <http://purl.org/dc/terms/>
  ASK {
    VALUES ?identifier { "${distributionIdentifier}" }
    FILTER NOT EXISTS {
      ?anyDistribution a dcat:Distribution ; dct:identifier ?identifier .
      ?s dcat:distribution ?anyDistribution .
      ${datasetFilter}
    }
  }
  # Confirm distribution is unattached 

`;
};
