
export const DCAT_DOMAIN = "http://www.w3.org/ns/dcat#";
export const DCT_DOMAIN = "http://purl.org/dc/terms/";
export const RDF_DOMAIN = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
export const PROV_DOMAIN = "http://www.w3.org/ns/prov#";
export const SCHEMA_DOMAIN = "https://schema.org/";
export const TCAT_DOMAIN = "http://telicent.io";

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
  tcat: {
    catalog: `${TCAT_DOMAIN}/catalog#`,
    dataset: `${TCAT_DOMAIN}/catalog/dataset#`,
    distribution: `${TCAT_DOMAIN}/catalog/Distribution#`,
  },
};


export const COMMON_PREFIXES = `
PREFIX dcat: <${DCAT_DOMAIN}>
PREFIX dct: <${DCT_DOMAIN}>
PREFIX rdf: <${RDF_DOMAIN}>
PREFIX prov: <${PROV_DOMAIN}>
PREFIX tcat: <${VOCAB.tcat.catalog}>
PREFIX tcat-dataset: <${VOCAB.tcat.dataset}>
PREFIX tcat-distribution: <${VOCAB.tcat.distribution}>
PREFIX sdo: <${SCHEMA_DOMAIN}>
`;
