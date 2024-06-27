import z from "zod";
import { CatalogService } from "../index";
import { searchFactory } from "./DataCatalogueFrontend/searchFactory";

export const SearchParamsSchema = z.object({
  dataResourceFilter: z.union([z.literal("all"), z.string()]),
  searchText: z.string(),
});

export type SearchParamsType = z.infer<typeof SearchParamsSchema>;

export interface Api {
    // TODO Fix unknown
    search: (params:SearchParamsType) => Promise<unknown>;
}

export const apiFactory = (service: CatalogService): Api => ({
    search: searchFactory(service)
});
