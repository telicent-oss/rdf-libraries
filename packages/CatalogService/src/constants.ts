import packageJSON from "../package.json";

export const version = packageJSON?.version;

export const DEBUG = true;

export const REGEX = {
  [`YYYY-MM-DDTHH:mm:ss[.fraction][Z|±HH:MM]`]:
    /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/,
};

export const DATASET_NAMESPACE = "http://telicent.io/catalog/dataset#";
export const DISTRIBUTION_NAMESPACE =
  "http://telicent.io/catalog/Distribution#";

export const COMMON_PREFIXES_MAP = {
  dcat: "http://www.w3.org/ns/dcat#",
  dcterms: "http://purl.org/dc/terms/",
  dct: "http://purl.org/dc/terms/",
  rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  prov: "http://www.w3.org/ns/prov#",
  tcat: "http://telicent.io/catalog#",
  "tcat-dataset": DATASET_NAMESPACE,
  "tcat-distribution": DISTRIBUTION_NAMESPACE,
  sdo: "https://schema.org/",
  vcard: "http://www.w3.org/2006/vcard/ns#fn", // TODO https://github.com/telicent-oss/rdf-libraries/pull/299#discussion_r2432701466
  xsd: "http://www.w3.org/2001/XMLSchema#",
} as const;
export const COMMON_PREFIXES = (
  Object.entries(COMMON_PREFIXES_MAP) as [string, string][]
)
  .map(([key, value]) => `PREFIX ${key}: <${value}>`)
  .join("\n");

export const buildDatasetUri = (identifier: string) =>
  `${DATASET_NAMESPACE}${identifier}`;

export const buildDistributionUri = (identifier: string) =>
  `${DISTRIBUTION_NAMESPACE}${identifier}`;
