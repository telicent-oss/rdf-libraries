import packageJSON from "../package.json";

export const version = packageJSON?.version;

export const DEBUG = true;

export const COMMON_PREFIXES = `
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX prov: <http://www.w3.org/ns/prov#>
`;