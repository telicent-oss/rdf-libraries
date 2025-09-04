import { CatalogService } from "../../index";
import { transformRdfToTree } from "./utils/transformRdfToTree";
import {
  UITreeViewBaseItemType,
  UISearchParamsType,
  getAllResourcesWithDetails,
  ResourceQuerySchema,
  ResourceQueryType,
} from "./utils/common";
import { transformDataResourceFilters } from "./utils/transformDataResourceFilters";
// import { ApiFactoryConfigType } from "./type";

export const catalogFactory = (
  service: CatalogService,
  // config: ApiFactoryConfigType
) => {
  return async function catalog(
    params: UISearchParamsType,
    // config: ApiFactoryConfigType
  ): Promise<UITreeViewBaseItemType[]> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { hasOwnerFilter } = transformDataResourceFilters(
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
