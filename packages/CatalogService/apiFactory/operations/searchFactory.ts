import { z } from "zod";
import {
  CatalogService,
  DCATCatalog,
} from "../../index";

import {
  CATALOG_URI,
  UIDataResourceSchema,
  uiDataResourceFromInstance,
  typeStatementMatcherWithId,
  DCATResourceSchema,
  UISearchParamsType,
} from "./utils/common";
import { instanceFromResourceFactory } from './utils/instanceFromResourceFactory';
import { getAllResourceTriples } from './utils/getAllResourceTriples';
import { transformDataResourceFilters } from './utils/transformDataResourceFilters';
import { printJSON } from "./utils/printJSON";
import { tryCatch } from "./utils/tryCatch";
import { tryInstantiate } from "./utils/tryInstantiate";

export const searchFactory = (service: CatalogService) => {
  return async function search(
    params: UISearchParamsType
  ): Promise<Array<z.infer<typeof UIDataResourceSchema>>> {
    const { hasAccess, dataResourceFilter } = transformDataResourceFilters(
      params.dataResourceFilters
    );

    if (dataResourceFilter === "all" || !dataResourceFilter) {
      // REQUIREMENT All
      // TODO pagination
      const resourceTriples = await getAllResourceTriples({ service, hasAccess });
      const uiDataResource = resourceTriples
        .map(instanceFromResourceFactory({ service }))
        .map(uiDataResourceFromInstance)
      return Promise.all(uiDataResource); // 🛑 exit.....
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
        return Promise.all(foundForUI); // 🛑 exit.....
      }

      const ownedInstances = await cat.getOwnedResources();
      // TODO add owned.
      //    TODO! 16Sep24 Is this done?
      const results = [cat, ...ownedInstances];
      return Promise.all(results.map(uiDataResourceFromInstance)); // 🛑 exit.....
    }
    // TODO for now just return selected. 
    //    TODO! 16Sep24 Is this done?
    const instance = await tryInstantiate({ type, id, service })
    const ui = await uiDataResourceFromInstance(instance);
    return [ui];
  };
};
