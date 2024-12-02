import {
  OntologyService,
  type FlattenedStyleType,
  type FlattenedStyleTypeForFindIcon,
} from "@telicent-oss/OntologyService";
import { URISegmentOrHashSchema } from "@telicent-oss/RdfService";
import { findIcon, flattenStyles } from "./context-utils";
export * from './context-utils';

// TODO Update ./findIcon with new behavior
// @see {@link https://telicent.atlassian.net/browse/TELFE-839}

type IconStyleType = FlattenedStyleTypeForFindIcon | FlattenedStyleType;

// **module** scoped variables

export let moduleStyles: IconStyleType[];
let moduleOntologyService: OntologyService;
export let moduleStylesPromise:Promise<IconStyleType[]>;

const assertModulesStyles= () => {
  if (typeof moduleStyles !== "object") {
    throw new Error(`
      Expected moduleStyles to be type FlattenedStyleType, 
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
):Promise<void> => {
  moduleOntologyService = await ontologyServicePromise;
  assertModuleOntologyService()
  moduleStylesPromise = moduleOntologyService.getStyles([]).then(flattenStyles);
  moduleStyles = await moduleStylesPromise;
};

export const findByClassUri = (maybeClassUri: string) => {
  const classUri = URISegmentOrHashSchema.parse(maybeClassUri);
  assertModulesStyles();
  return findIcon(moduleStyles, classUri)
};
