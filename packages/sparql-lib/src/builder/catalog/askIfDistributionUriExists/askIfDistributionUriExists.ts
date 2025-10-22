export const askIfDistributionUriExists = ({ distributionUri }: { distributionUri: string }) => `
ASK {
  VALUES ?needle { <${distributionUri}> }
  { ?needle ?p ?o }
  UNION { ?s ?needle ?o }
  UNION { ?s ?p ?needle }
}
`;