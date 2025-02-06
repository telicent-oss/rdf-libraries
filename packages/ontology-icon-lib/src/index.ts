import {
  OntologyService,
  type FlattenedStyleType,
  type FlattenedStyleTypeForFindIcon,
} from "@telicent-oss/ontologyservice";
import { URISegmentOrHashSchema } from "@telicent-oss/rdfservice";
import { findIcon, flattenStyles } from "./context-utils";
export * from './context-utils';
export { version, name } from '../package.json';

// TODO Update ./findIcon with new behavior
// WHEN TELFE-839
// @see {@link https://telicent.atlassian.net/browse/TELFE-839}

export type IconType = FlattenedStyleTypeForFindIcon | FlattenedStyleType;

// **module** scoped variables

export let moduleStyles: IconType[];
let moduleOntologyService: OntologyService;

export let moduleStylesPromiseCallbackFulfill:(value: IconType[] | PromiseLike<IconType[]>) => void;
export let moduleStylesPromiseCallbackReject:(reason?: unknown) => void;
export  const moduleStylesPromise:Promise<IconType[]> = new Promise((fulfill, reject) => {
  moduleStylesPromiseCallbackFulfill = fulfill;
  moduleStylesPromiseCallbackReject = reject;
});

const assertModulesStyles= () => {
  if (typeof moduleStyles !== "object") {
    throw new Error(`
      Expected moduleStyles to be of type FlattenedStyleType, 
      instead got "${moduleStyles}" (${typeof moduleStyles})`
    );
  }
}
const assertModuleOntologyService = () => {
  // I would do moduleOntologyService instanceof OntologyService
  // - but I'm not certain it will always be the same instance of OntologyService
  if (moduleOntologyService?.getStyles === undefined) {
    throw new Error(`
      Expected moduleOntologyService instance of OntologyService with getStyles()
      instead got "${JSON.stringify(moduleOntologyService)}"
      (${typeof moduleOntologyService})`
    );
  }
}


export const init = async (
  ontologyServicePromise: Promise<OntologyService>
):Promise<IconType[]> => {
  moduleOntologyService = await ontologyServicePromise;
  assertModuleOntologyService()
  moduleOntologyService.getStyles([])
    .then(flattenStyles)
    .then(res => moduleStylesPromiseCallbackFulfill(res))
    .catch(err => moduleStylesPromiseCallbackReject(err));

  moduleStyles = await moduleStylesPromise;
  return moduleStyles;
};

export const findByClassUri = (maybeClassUri: string) => {
  const classUri = URISegmentOrHashSchema.parse(maybeClassUri);
  assertModulesStyles();
  return findIcon(moduleStyles, classUri)
};
