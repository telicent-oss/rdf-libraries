import { CatalogService } from "../../../index";
import { transformRdfToTree } from "./utils/transformRdfToTree";
import {
  UITreeViewBaseItemType,
  UISearchParamsType,
  getAllResourcesWithDetails,
  ResourceQuerySchema,
  ResourceQueryType,
  ResourceDetailResponseSchema,
} from "./utils/common";
import { transformDataResourceFilters } from "./utils/transformDataResourceFilters";

export const catalogFactory = (service: CatalogService) => {
  return async function catalog(
    params: UISearchParamsType
  ): Promise<UITreeViewBaseItemType[]> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { hasAccess } = transformDataResourceFilters(
      params.dataResourceFilters
    );
    const rdfResources = await getAllResourcesWithDetails({
      service,
    });
    const resources: ResourceQueryType[] = rdfResources.results.bindings.map(
      (el) => ResourceQuerySchema.parse(el)
    );

    if (resources.length === 0) {
      return [
        {
          id: "all",
          label: "All",
          children: [],
        },
      ];
    }

    const tree = transformRdfToTree({
      resources: resources,
    });

    return [
      {
        id: "all",
        label: "All",
        children: tree,
      },
    ];
  };
};
