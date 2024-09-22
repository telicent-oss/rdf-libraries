import { z } from "zod";
import {
  CatalogService,
} from "../../../index";

import {
  UIDataResourceSchema,
  uiDataResourceFromInstance,
  typeStatementMatcherWithId,
  DCATResourceSchema,
  UISearchParamsType,
} from "./utils/common";
import { getAllResourceTriples } from './utils/getAllResourceTriples';
import { transformDataResourceFilters } from './utils/transformDataResourceFilters';
import { tryCatch } from "./utils/tryCatch";
import { session } from "../../constants";
import { tryInstantiate } from "./utils/tryInstantiate/tryInstantiate";

export const searchFactory = (service: CatalogService) => {
  return async function search(
    params: UISearchParamsType
  ): Promise<Array<z.infer<typeof UIDataResourceSchema>>> {
    const { hasAccess, dataResourceFilter } = transformDataResourceFilters(
      params.dataResourceFilters
    );
    const resourceTriples = await getAllResourceTriples({ service, hasAccess });
    const ownerTriple = dataResourceFilter === "all"
      ? undefined
      :  resourceTriples.find(typeStatementMatcherWithId(dataResourceFilter));
    const ownerType = tryCatch(
      () => ownerTriple ? DCATResourceSchema.parse(ownerTriple?.o.value) : undefined,
      `Expected ownerTriple.o.value ("${ownerTriple?.o.value}") to pass DCATResourceSchema`
    );
    const owner = ownerType
    ? await tryInstantiate({ type: ownerType, id:dataResourceFilter, service })
    : undefined; // Unnecessary
    const found = await service.findWithParams({
      searchText: params.searchText,
      owner,
      accessRights: hasAccess ? session.user.name : undefined
    });
    const foundForUI = found
      .map((el) => el.item)
      .map(uiDataResourceFromInstance);
    const searchResult = await Promise.all(foundForUI);
    return searchResult;
  }
};
