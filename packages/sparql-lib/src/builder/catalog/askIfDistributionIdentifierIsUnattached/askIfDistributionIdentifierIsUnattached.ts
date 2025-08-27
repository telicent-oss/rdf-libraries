export const askIfDistributionIdentifierIsUnattached = ({
  distributionIdentifier,
}: {
  distributionIdentifier: string;
}) => {
  return `
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX dct:  <http://purl.org/dc/terms/>

ASK {
  VALUES ?needle { "${distributionIdentifier}" }
  ?dist a dcat:Distribution ;
  dct:identifier ?needle .
  FILTER NOT EXISTS { ?s dcat:distribution ?dist }
}`;
};
