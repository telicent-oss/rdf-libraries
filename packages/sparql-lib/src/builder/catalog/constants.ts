export const COMMON_PREFIXES = `
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX tcat: <http://telicent.io/catalog#>
PREFIX sdo: <https://schema.org/>
`;

export const DCAT_DOMAIN = "http://www.w3.org/ns/dcat#";

export const VOCAB = {
  dcat: {
    dcatResource: `${DCAT_DOMAIN}Resource`,
    dcatCatalog:``,
    dcatDataService:``,
    dcatDataset:``,
    dcat_dataset: `${DCAT_DOMAIN}dataset`, // TODO WARNING NOT Dataset
    dcat_service: `${DCAT_DOMAIN}service`,
    dcat_catalog: `${DCAT_DOMAIN}catalog`,
  },
};
