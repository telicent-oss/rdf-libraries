import {
  OntologyService,
  type FlattenedStyleType,
  type FlattenedStyleTypeForFindIcon,
} from "@telicent-oss/OntologyService";
import { URISegmentOrHashSchema } from "@telicent-oss/RdfService";

type IconStyleType = FlattenedStyleTypeForFindIcon | FlattenedStyleType;

// **module** scoped variables
let moduleStyles: IconStyleType[];
let moduleOntologyService: OntologyService;


const assertModuleValues = () => {
  if (typeof moduleStyles !== "object") {
    throw new Error(`
      Expected moduleStyles to be type FlattenedStyleType, 
      instead got "${moduleStyles}" (${typeof moduleStyles})`
    );
  }
  
  if (moduleOntologyService instanceof OntologyService === false) {
    throw new Error(`
      Expected moduleOntologyService instance of OntologyService
      instead got "${JSON.stringify(moduleOntologyService)}"
      (${typeof moduleOntologyService})`
    );
  }
}

// Public API
// ----------
export const findByClassUri = (maybeClassUri: IconStyleType["classUri"]) => {
  assertModuleValues()
  const classUri = URISegmentOrHashSchema.parse(maybeClassUri);
  return moduleOntologyService.findIcon(moduleStyles as FlattenedStyleType[], classUri);
};


export const init = async (
  ontologyServicePromise: Promise<OntologyService>
):Promise<void> => {
  moduleOntologyService = await ontologyServicePromise;
  moduleStyles = await moduleOntologyService.getFlattenedStyles([]);
};

