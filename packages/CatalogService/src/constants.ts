import packageJSON from "../package.json";

export const version = packageJSON?.version;

export const DEBUG = true;



export const COMMON_PREFIXES_MAP = {
  dcat: "http://www.w3.org/ns/dcat#",
  dcterms: "http://purl.org/dc/terms/",
  dct: "http://purl.org/dc/terms/",
  rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  prov: "http://www.w3.org/ns/prov#",
  tcat: "http://telicent.io/catalog#",
  sdo: "https://schema.org/",
  vcard: "http://www.w3.org/2006/vcard/ns#fn",
  xsd: "http://www.w3.org/2001/XMLSchema#",
} as const;;
export const COMMON_PREFIXES = (
  Object.entries(COMMON_PREFIXES_MAP) as [string, string][]
)
  .map(([key, value]) => `PREFIX ${key}: <${value}>`)
  .join("\n") ;
