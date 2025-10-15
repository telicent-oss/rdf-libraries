import packageJSON from "../package.json";

export const version = packageJSON?.version;

export const DEBUG = true;

export const REGEX = {
  [`YYYY-MM-DDTHH:mm:ss[.fraction][Z|±HH:MM]`]:
    /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/,
};

export const DATASET_URI_PREFIX = "http://telicent.io/catalog/dataset#";
export const DISTRIBUTION_URI_PREFIX =
  "http://telicent.io/catalog/distribution#";

export const COMMON_PREFIXES_MAP = {
  dcat: "http://www.w3.org/ns/dcat#",
  dcterms: "http://purl.org/dc/terms/",
  dct: "http://purl.org/dc/terms/",
  rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  prov: "http://www.w3.org/ns/prov#",
  tcat: "http://telicent.io/catalog#",
  "tcat-dataset": DATASET_URI_PREFIX,
  "tcat-distribution": DISTRIBUTION_URI_PREFIX,
  sdo: "https://schema.org/",
  vcard: "http://www.w3.org/2006/vcard/ns#fn",
  xsd: "http://www.w3.org/2001/XMLSchema#",
} as const;
export const COMMON_PREFIXES = (
  Object.entries(COMMON_PREFIXES_MAP) as [string, string][]
)
  .map(([key, value]) => `PREFIX ${key}: <${value}>`)
  .join("\n");

export const buildDatasetUri = (identifier: string) =>
  `${DATASET_URI_PREFIX}${identifier}`;

export const buildDistributionUri = (identifier: string) =>
  `${DISTRIBUTION_URI_PREFIX}${identifier}`;
