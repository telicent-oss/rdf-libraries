import { z } from "zod";
import { CatalogService, DCATResource } from "../../../index";

import { UIDataResourceSchema, UISearchParamsType } from "./utils/common";
import { transformDataResourceFilters } from "./utils/transformDataResourceFilters";

export const searchFactory = (service: CatalogService) => {
  let cachedResources: DCATResource[] | undefined = undefined;
  const getAllResources = async () => {
    if (!cachedResources) {
      cachedResources = await service.getAllDCATResources();
    }
    return [...cachedResources];
  };
  return async function search(
    params: UISearchParamsType
  ): Promise<Array<z.infer<typeof UIDataResourceSchema>>> {
    const { hasAccess, dataResourceFilter } = transformDataResourceFilters(
      params.dataResourceFilters
    );

    // Simplify to get all Data Resources, need to keep an eye on this to check it doesnt
    // become too expensive
    const resources = await getAllResources();
    console.log("Resources", resources);
    const re = params.searchText
      ? new RegExp(params.searchText.toLowerCase(), "gi")
      : undefined;
    const found = await Promise.all(
      resources
        .filter((resource) => {
          if (!dataResourceFilter || dataResourceFilter === "all") {
            return true;
          }
          return (
            resource.uri === dataResourceFilter ||
            resource.owner === dataResourceFilter
          );
        })
        .map((resource) => ({
          item: resource,
          score: 0,
        }))

        .filter((resource) => {
          if (re) {
            const match = resource.item.toFindString().match(re);
            if (match) {
              resource.score = match.length;
            }
            return resource.score > 0;
          }
          return true;
        })
        .sort((a, b) => {
          if (!a.score || !b.score) {
            return 0;
          }
          if (a.score < b.score) {
            return 1;
          }
          if (a.score > b.score) {
            return -1;
          }
          return 0;
        })
        .map(async (resource) => await resource.item.toUIRepresentation())
    );

    return found;
  };
};
