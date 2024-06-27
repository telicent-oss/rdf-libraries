import z from "zod";
import { CatalogService } from "../index";
import { searchFactory } from "./DataCatalogueFrontend/searchFactory";
import { catalogFactory } from "./DataCatalogueFrontend/catalogFactory";
import { DataResourceSchema, TreeViewBaseItemType } from "./DataCatalogueFrontend/common";

export const SearchParamsSchema = z.object({
  dataResourceFilter: z.union([z.literal("all"), z.string()]),
  searchText: z.string(),
});

export type SearchParamsType = z.infer<typeof SearchParamsSchema>;

export interface Api {
    // TODO use types instead of infer
    search: (params:SearchParamsType) => Promise<Array<z.infer<typeof DataResourceSchema>>>;
    catalog: (params:SearchParamsType) => Promise<TreeViewBaseItemType[]>;
    _service: CatalogService;
}

export const apiFactory = (service: CatalogService): Api => ({
    search: searchFactory(service),
    catalog: catalogFactory(service),
    _service: service,
});
