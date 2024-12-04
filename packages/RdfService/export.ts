export { RdfService, type RDFServiceConfig } from "./src/classes/AbstractConstructorPromises.RDFService";
export { RDFSResource } from './src/classes/AbstractConstructorPromises.RDFSResource';
export * from "./src/schema";
export * from "./src/types";
export { getConfig } from "./utils/getConfig";
export {
  emptyUriErrorMessage,
  emptyPredicateErrorMessage,
  noColonInPrefixException,
  unknownPrefixException,
  unrecognisedIdField,
} from "./src/constants";
export { createQueryResponseSchema } from "./src/utils/createQueryResponseSchema";
export { type RDFSResourceDescendant } from "./src/classes/AbstractConstructorPromises.RDFSResource";
export { type RankWrapper } from "./src/classes/AbstractConstructorPromises.RDFService";
