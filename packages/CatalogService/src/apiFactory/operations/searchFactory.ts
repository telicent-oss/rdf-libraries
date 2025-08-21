import { CatalogService, DCATResource } from "../../index";

import { UIDataResourceType, UISearchParamsType } from "./utils/common";
import { transformDataResourceFilters } from "./utils/transformDataResourceFilters";
import { ApiFactoryConfigType } from "./type";

export const searchFactory = (
  service: CatalogService,
  config: ApiFactoryConfigType = {}
) => {
  let cachedResources: DCATResource[] | undefined = undefined;
  const getAllResources = async () => {
    if (!cachedResources) {
      cachedResources = await service.getAllDCATResources();
    }
    return [...cachedResources];
  };
  return searchFactoryFn(getAllResources, config);
};

export const searchFactoryFn =
  (
    getResourcesFn: () => Promise<DCATResource[]>,
    config: ApiFactoryConfigType = {}
  ) =>
  async (
    params: UISearchParamsType,
    // context: { ownerEmail?: string} = {} as UISearchContextType
  ): Promise<Array<Partial<UIDataResourceType>>> => {
    const { 
      // hasOwnerFilter, 
      dataResourceFilter } = transformDataResourceFilters(
      params.dataResourceFilters
    );
    // Simplify to get all Data Resources, need to keep an eye on this to check it doesnt
    // become too expensive
    const resources = await getResourcesFn();
    const re = params.searchText
      ? new RegExp(params.searchText.toLowerCase(), "gi")
      : undefined;
    // let isWarnOwnerEmailExpected = false
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
        // .filter((resource) => {
        //   if (!hasOwnerFilter) {
        //     return true
        //   }
        //   if (context?.ownerEmail === undefined) {
        //     isWarnOwnerEmailExpected = true
        //   }
        //   return resource.publisher__title === context.ownerEmail;
        // })
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
        .map(async (resource) => {
          const uiRepresentation = await resource.item.toUIRepresentation();

          if (!config.FF_CATALOG_UPDATE) {
            return uiRepresentation;
          }
          return uiRepresentation;
        })
    );
    // if (isWarnOwnerEmailExpected) {
    //   console.error('Expected ownerEmail to be set to search for owned resources')
    // }
    return found;
  };
