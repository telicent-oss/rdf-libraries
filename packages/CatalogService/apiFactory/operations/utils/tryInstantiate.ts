import {
  DCATDataset,
  DCATDataService,
  DCATCatalog,
  CatalogService,
} from "../../../index";
import { HumanError } from "../../../utils/HumanError";
import {
  DATASET_URI,
  SERVICE_URI,
  CATALOG_URI,
  RESOURCE_URI_TYPE,
} from "./common";

export const tryInstantiate = ({
  type,
  id,
  service,
}: {
  type: RESOURCE_URI_TYPE;
  id: string; // TODO rename to uri
  service: CatalogService;
}): // NOTE: TS cannot infer return type correct due to
// reliance on constructor signature being the same
// (DCATCatalog is different)
DCATCatalog | DCATDataset | DCATDataService => {
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
      ? new HumanError(`new ${type}(service, ${id}) ${err}`, err)
      : err;
  }
  throw TypeError(`type "${type}" is not handled`);
};
