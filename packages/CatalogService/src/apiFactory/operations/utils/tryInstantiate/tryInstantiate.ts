import { RDFTripleType } from "@telicent-oss/rdfService";
import { formatDataAsArray } from "../../../../__tests__/utils/formatDataAsArray";
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
import { shorten } from "../../../../utils/shorten";

export const tryInstantiate = ({
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
DCATCatalog | DCATDataset | DCATDataService => {
  console.log(
    'tryInstantiate',
    JSON.stringify(
      { type, id, triples },
      (key, value) => {
        // Check if the current value is an object with type 'literal'
        if (value && value.type === 'literal') {
          // Return a new object with the shortened value
          return { ...value, value: shorten(value.value, 100) };
        }
        // Return the value unchanged
        return value;
      },
      2
    )
  );
  if (service.nodes[id]) {
    try {
      if (type === CATALOG_URI) {
        return new DCATCatalog(service, id);
      } else if (type === DATASET_URI) {
        return new DCATDataset(service, id);
      } else if (type === SERVICE_URI) {
        return new DCATDataService(service, id);
      }
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
  console.log(formatDataAsArray(triples).join('\n'))
  const title = service.interpretation.dcTitleFromTriples(id, triples, { assert: true })
  if (type === CATALOG_URI) {
    return new DCATCatalog(service, id, title);
  } else if (type === DATASET_URI) {
    return new DCATDataset(service, id, title);
  } else if (type === SERVICE_URI) {
    return new DCATDataService(service, id, title);
  }
  throw TypeError(`type "${type}" is not handled`);

};
