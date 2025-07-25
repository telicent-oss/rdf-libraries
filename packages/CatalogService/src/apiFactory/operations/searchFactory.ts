import { z } from "zod";
import { CatalogService, DCATResource } from "../../../index";

import { UIDataResourceSchema, UISearchContextType, UISearchParamsType } from "./utils/common";
import { transformDataResourceFilters } from "./utils/transformDataResourceFilters";

export const searchFactory = (service: CatalogService) => {
  let cachedResources: DCATResource[] | undefined = undefined;
  const getAllResources = async () => {
    if (!cachedResources) {
      cachedResources = await service.getAllDCATResources();
    }
    return [...cachedResources];
  };
  return searchFactoryFn(getAllResources);
};

export const searchFactoryFn =
  (getResourcesFn: () => Promise<DCATResource[]>) =>
  async (
    params: UISearchParamsType,
    context: { ownerEmail?: string} = {} as UISearchContextType
  ): Promise<Array<z.infer<typeof UIDataResourceSchema>>> => {
    const { hasOwnerFilter, dataResourceFilter } = transformDataResourceFilters(
      params.dataResourceFilters
    );
    // Simplify to get all Data Resources, need to keep an eye on this to check it doesnt
    // become too expensive
    const resources = await getResourcesFn();
    const re = params.searchText
      ? new RegExp(params.searchText.toLowerCase(), "gi")
      : undefined;
    let isWarnOwnerEmailExpected = false
    const found = await Promise.all(
      resources
        .filter((resource) => {
          if (!dataResourceFilter || dataResourceFilter === "all") {
            return true;
          }
          return (
            resource.uri === dataResourceFilter
          );
        })
        .filter((resource) => {
          if (!hasOwnerFilter) {
            return true
          }
          if (context?.ownerEmail === undefined) {
            isWarnOwnerEmailExpected = true
          }
          return resource.attributionAgentStr === context.ownerEmail
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
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .map(async (resource) => await resource.item.toUIRepresentation())
    );
    if (isWarnOwnerEmailExpected) {
      console.error('Expected ownerEmail to be set to search for owned resources')
    }
    return found;
  };
