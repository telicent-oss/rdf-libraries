import {
  OntologyService,
  type FlattenedStyleType,
  type FlattenedStyleTypeForFindIcon,
} from "@telicent-oss/ontologyservice";
import { URISegmentOrHashSchema } from "@telicent-oss/rdfservice";
import { findIcon, flattenStyles } from "./context-utils";
export * from "./context-utils";
export { version, name } from "../package.json";

export type IconType = FlattenedStyleTypeForFindIcon | FlattenedStyleType;

// **module** scoped variables

export let moduleStyles: IconType[];
let moduleOntologyService: OntologyService;

export let moduleStylesPromiseCallbackFulfill: (
  value: IconType[] | PromiseLike<IconType[]>
) => void;
export let moduleStylesPromiseCallbackReject: (reason?: unknown) => void;
export const moduleStylesPromise: Promise<IconType[]> = new Promise(
  (fulfill, reject) => {
    moduleStylesPromiseCallbackFulfill = fulfill;
    moduleStylesPromiseCallbackReject = reject;
  }
);

const assertModulesStyles = () => {
  if (typeof moduleStyles !== "object") {
    throw new Error(`
      Expected moduleStyles to be of type FlattenedStyleType, 
      instead got "${moduleStyles}" (${typeof moduleStyles})`);
  }
};
const assertModuleOntologyService = () => {
  // I would do moduleOntologyService instanceof OntologyService
  // - but I'm not certain it will always be the same instance of OntologyService
  if (moduleOntologyService?.getStyles === undefined) {
    throw new Error(`
      Expected moduleOntologyService instance of OntologyService with getStyles()
      instead got "${JSON.stringify(moduleOntologyService)}"
      (${typeof moduleOntologyService})`);
  }
};

export const init = async (
  ontologyServicePromise: Promise<OntologyService>
): Promise<IconType[]> => {
  moduleOntologyService = await ontologyServicePromise;
  assertModuleOntologyService();
  // Older OntologyService instances predate getInheritedStyles
  const stylesPromise =
    typeof moduleOntologyService.getInheritedStyles === "function"
      ? moduleOntologyService.getInheritedStyles()
      : (console.warn(
          "OntologyService has no getInheritedStyles(), styles will not be inherited"
        ),
        moduleOntologyService.getStyles([]));
  stylesPromise
    .then(flattenStyles)
    .then((res) => moduleStylesPromiseCallbackFulfill(res))
    .catch((err) => moduleStylesPromiseCallbackReject(err));

  moduleStyles = await moduleStylesPromise;
  return moduleStyles;
};

export const findByClassUri = (
  maybeClassUri: string
) => {
  const classUriRes = URISegmentOrHashSchema.safeParse(maybeClassUri);
  if (!classUriRes.success) {
    return  {
        classUri: "Unknown",
        color: "#DDDDDD",
        backgroundColor: "#121212",
        iconFallbackText: "?",
        alt: "Unknown"
      };
  } 
  try {
    assertModulesStyles();
  } catch (error) {
    console.warn(`Problem with module styles`, error);
  }

  return findIcon(moduleStyles, classUriRes.data);
};
