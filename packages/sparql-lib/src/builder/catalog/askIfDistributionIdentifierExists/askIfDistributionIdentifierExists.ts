export const askIfDistributionIdentifierExists = ({
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
}`;
};
