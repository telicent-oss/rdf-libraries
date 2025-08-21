import { debounce } from "perfect-debounce";
import { DCATResource } from "../RDFSResource.DCATResource";
import { StoreTripleForOntology } from "./storeTriplesForPhase2";

type Options = {
  instance: DCATResource;
  api: Parameters<StoreTripleForOntology>[0]["api"];
};

// Hopefully we don't need to use this
export const updateModifiedFactory = ({ instance, api }: Options) => {
  if ("updateByPredicateFns" in api === false) {
    // unnecessary if only creating as handled in rdf write API (paperback-writer)
    return () => {}; 
  }
  const updateCall = () =>
    api.updateByPredicateFns["dct:modified"]({
      triple: {
        s: instance.uri,
        p: "dct:modified",
        o: new Date().toISOString(),
      },
      prev: instance?.max_modified || null,
    });

  return debounce(updateCall, 1200, { leading: true, trailing: true });
};
