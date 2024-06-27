import {
  DCATDataset,
  DCATDataService,
  DCATCatalog,
  CatalogService,
} from "../../index";
import { HumanError } from "../../utils/HumanError";
import { DATASET_URI, SERVICE_URI, CATALOG_URI, RESOURCE_URI } from "./common";

export const tryInstantiate = ({
  UriToClass,
  type,
  id,
  service,
}: {
  UriToClass: {
    [DATASET_URI]: typeof DCATDataset;
    [SERVICE_URI]: typeof DCATDataService;
    [CATALOG_URI]: typeof DCATCatalog;
  };
  type: RESOURCE_URI;
  id: string;
  service: CatalogService;
}) => {
  const DCATClass = UriToClass[type];
  if (DCATClass === undefined) {
    throw TypeError(`
        DCATClass is undefined:
          key: ${type}, 
          keys: ${Object.keys(UriToClass)}
          values: ${Object.values(UriToClass)}
        `);
  }
  try {
    return new DCATClass(service, id);
  } catch (err) {
    throw err instanceof Error
      ? new HumanError(`new ${type}(service, ${id}) ${err}`, err)
      : err;
  }
};
