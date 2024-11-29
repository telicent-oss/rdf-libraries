import {
  OntologyService,
  type FlattenedStyleType,
  type FlattenedStyleTypeForFindIcon,
} from "@telicent-oss/OntologyService";
import { URISegmentOrHashSchema } from "@telicent-oss/RdfService";
import { findIcon, flattenStyles } from "./context-utils";
export * from './context-utils';

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


/**
 * Originally due to the work in TELFE-655, we intended to do:
 * 
 * ```diff
 * export const init = async (
 *   ontologyServicePromise: Promise<OntologyService>
 * ):Promise<void> => {
 *   moduleOntologyService = await ontologyServicePromise;
 *   assertModuleOntologyService()
 * - moduleStylesPromise = moduleOntologyService.getStyles([]).then(flattenStyles);
 * + moduleStylesPromise = moduleOntologyService.getFlattenedStyles([]);
 *   moduleStyles = await moduleStylesPromise;
 * };
 * 
 * export const findByClassUri = (maybeClassUri: IconStyleType["classUri"]) => {
 *   assertModulesStyles();
 *   const classUri = URISegmentOrHashSchema.parse(maybeClassUri);
 * -  return findIcon(moduleStyles, classUri)
 * +  return moduleOntologyService.PROPOSED_findIcon(moduleStyles as FlattenedStyleType[], classUri);
 * }
 * ```
 * 
 * The goal was to remove the half-baked \@telicent-oss/ds "DSProviders/findIcon" functionality
 * from all apps.
 * 
 * However, after removing said code, and wiring-in the functions in this file -
 * we realized PROPOSED_findIcon was slightly different from the original code.
 * This impacted all of Search app's unit tests.
 * ALSO, the very act of re-wiring the unit tests, unintentionally made the icon
 * resolution logic more correctly draw from test mock data - which also caused changes
 * to test case actual output.
 * 
 * Rather than trying to verify two sources of diffs on test case output
 * And to keep the QA to "check for parity" - we decided to use the pre-existing,
 * but perhaps incorrect findIcon logic from the design system 
 * (but moved into this package @see "context-utils.ts")
 * 
*/

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
