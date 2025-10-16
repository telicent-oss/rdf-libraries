export const askIfDistributionUriIsUnattached = ({ distributionUri }: { distributionUri: string }) => `
PREFIX dcat: <http://www.w3.org/ns/dcat#>

ASK {
  FILTER NOT EXISTS { ?s dcat:distribution <${distributionUri}> }
}
`;