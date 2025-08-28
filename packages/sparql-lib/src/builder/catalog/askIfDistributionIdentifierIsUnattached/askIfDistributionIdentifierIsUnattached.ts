export const askIfDistributionIdentifierIsUnattached = ({
  distributionIdentifier,
}: {
  distributionIdentifier: string;
}) => {
  return `
  PREFIX dcat: <http://www.w3.org/ns/dcat#>
  PREFIX dct:  <http://purl.org/dc/terms/>
  ASK {
    VALUES ?identifier { "${distributionIdentifier}" }
    FILTER NOT EXISTS {
      ?anyDistribution a dcat:Distribution ; dct:identifier ?identifier .
      ?s dcat:distribution ?anyDistribution .
    }
  }
  # Confirm distribution is unattached 

`;
};
