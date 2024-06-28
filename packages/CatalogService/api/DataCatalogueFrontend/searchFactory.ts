import { z } from "zod";
import {
  CatalogService,
  DCATCatalog,
  DCATDataService,
  DCATDataset,
} from "../../index";

import {
  DATASET_URI,
  SERVICE_URI,
  CATALOG_URI,
  DataResourceSchema,
  instanceFromResourceFactory,
  getAllResourceTriples,
  uiDataResourceFromInstance,
  typeStatementMatcherWithId,
  DCATResourceSchema,
  SearchParamsType,
  transformDataResourceFilters,
} from "./common";
import { printJSON } from "./utils/printJSON";
import { tryCatch } from "./utils/tryCatch";
import { tryInstantiate } from "./tryInstantiate";

export const searchFactory = (service: CatalogService) => {
  // TODO why must UriToClass be defined within searchFactory?
  const UriToClass = {
    [DATASET_URI]: DCATDataset,
    [SERVICE_URI]: DCATDataService,
    [CATALOG_URI]: DCATCatalog,
  };
  return async function search(
    params: SearchParamsType
  ): Promise<Array<z.infer<typeof DataResourceSchema>>> {
    const { hasAccess, dataResourceFilter } = transformDataResourceFilters(
      params.dataResourceFilters
    );

    if (dataResourceFilter === "all" || !dataResourceFilter) {
      // REQUIREMENT All
      const result = Promise.all(
        (await getAllResourceTriples({ service, hasAccess }))
          .map(instanceFromResourceFactory({ service, UriToClass }))
          .map(uiDataResourceFromInstance)
      );
      console.info(`REQUIREMENT All`);
      return result; // 🛑 exit.....
    }

    const id = dataResourceFilter;
    const resourceTriples = await getAllResourceTriples({ service, hasAccess });
    const triple = resourceTriples.find(typeStatementMatcherWithId(id));
    const type = tryCatch(
      () => DCATResourceSchema.parse(triple?.o.value),
      ` id:${id} & type:(DCATResource) in ${printJSON(resourceTriples)}`
    );
    if (type === undefined) {
      throw new Error(`Expected id:${id} in ${printJSON(resourceTriples)}`);
    }

    if (type === CATALOG_URI) {
      // REQUIREMENT 6.5 Search by dataResourceFilter: selected data-resources
      const cat = new DCATCatalog(service, id);

      if (params.searchText) {
        // REQUIREMENT 7.2 Search by input text
        const found = await service.find(params.searchText, undefined, cat);
        const foundForUI = found
          .map((el) => el.item)
          .map(uiDataResourceFromInstance);
        console.info(foundForUI.length);
        console.info(`7.2 Search by input text`);
        return Promise.all(foundForUI); // 🛑 exit.....
      }

      const ownedInstances = await cat.getOwnedResources();
      // TODO add owned
      const results = [cat, ...ownedInstances];
      console.info(`
        Owner: ${id}
        Owned: ${ownedInstances.length}
        `);
      console.info(
        ` 6.5 Search by dataResourceFilter: selected data-resources`
      );
      return Promise.all(results.map(uiDataResourceFromInstance)); // 🛑 exit.....
    }
    // TODO for now just return selected
    const instance = await tryInstantiate({ UriToClass, type, id, service })
    const ui = await uiDataResourceFromInstance(instance);
    return [ui];


    // throw Error(
    //   `Only dataResourceFilter: "all" and type "Catalog" supported for now, instead got: "${dataResourceFilter}" `
    // );
  };
};
