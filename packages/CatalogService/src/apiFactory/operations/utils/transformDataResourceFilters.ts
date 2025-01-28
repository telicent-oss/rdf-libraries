import { UISearchParamsType } from "./common";

/**
 * convert to value object
 */
export const transformDataResourceFilters = (
    val: UISearchParamsType["dataResourceFilters"]
  ) => {
    // TODO sync with frontend (currently copied from frontend)
    const OWNED_FACET = { id: "all-owned-datasets", label: "Owned" };
    // TODO! move Owned to its own field in url
    const hasOwnerFilter = val.includes(OWNED_FACET.label);
    const dataResourceFilter = val.filter((el) => el !== OWNED_FACET.label)?.[0];
    return { hasOwnerFilter, dataResourceFilter };
  };
  