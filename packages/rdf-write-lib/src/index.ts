// Entry-point a.k.a "Barrel-file"; No code should go in here
import packageJSON from "../package.json";
export const version = packageJSON?.version;
export const name = packageJSON?.name;

export * from './types';
export * from './rdfWriteApiClientFactory';
export * from './updateByPredicateFnFactory';
export * from './createByPredicateFnFactory';