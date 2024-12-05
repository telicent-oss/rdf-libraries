import { RDFTripleType } from "@telicent-oss/rdfservice";
import {
  DCATDataset,
  DCATDataService,
  DCATCatalog,
  CatalogService,
} from "../../../../../index";
import { HumanError } from "../../../../utils/HumanError";
import {
  DATASET_URI,
  SERVICE_URI,
  CATALOG_URI,
  RESOURCE_URI_TYPE,
} from "../common";

export const tryInstantiate = async ({
  type,
  id,
  service,
  triples,
}: {
  type: RESOURCE_URI_TYPE;
  id: string; // TODO rename to uri
  service: CatalogService;
  triples?: RDFTripleType[];
}): // NOTE: TS cannot infer return type correct due to
// reliance on constructor signature being the same
// (DCATCatalog is different)
Promise<DCATCatalog | DCATDataset | DCATDataService> => {
  if (service.nodes[id]) {
    try {
      return await (
        type === CATALOG_URI
          ? DCATCatalog.createAsync(service, id)
          : type === DATASET_URI
          ? DCATDataset.createAsync(service, id)
          : type === SERVICE_URI
          ? DCATDataService.createAsync(service, id)
          : (() => {
              throw "Never here";
            })()
      );
    } catch (err) {
      throw err instanceof Error
        ? new HumanError(
            `Cached: Problem creating "${type}" or "${id}", error: ${err}`,
            err
          )
        : err;
    }
    throw TypeError(`Cached: type "${type}" is not handled`);
  }

  if (!triples) {
    throw Error('Expected triples to be set if instantiating DCAT classes for the first time');
  }
  // TODO Perhaps remove
  // WHY I'm not currently using these classes for much at all
  // HOW consider creating a few query building fn, and util fns and leave it at that
  const title = service.interpretation.dcTitleFromTriples(id, triples, { assert: true });
  const published = service.interpretation.dcPublishedFromTriples(id, triples, { assert: true });
  
  return await (
    type === CATALOG_URI
      ? DCATCatalog.createAsync(service, id, title, published)
      : type === DATASET_URI
      ? DCATDataset.createAsync(service, id, title, published)
      : type === SERVICE_URI
      ? DCATDataService.createAsync(service, id, title, published)
      : (() => {
          throw TypeError(`type "${type}" is not handled`);
        })()
  );
};
