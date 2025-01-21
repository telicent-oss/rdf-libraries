// Entry-point a.k.a "Barrel-file"; No code should go in here
import packageJSON from '../package.json';
export const version = packageJSON?.version;
export * from "./components/OntologyIcon/OntologyIcon";
export * from "./hooks/useOntologyStyles/useOntologyStyles";

