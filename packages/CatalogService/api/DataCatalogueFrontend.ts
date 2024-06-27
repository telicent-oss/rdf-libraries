import z from "zod";
import { CatalogService } from "../index";
import { searchFactory } from "./DataCatalogueFrontend/searchFactory";
import { catalogFactory } from "./DataCatalogueFrontend/catalogFactory";
import { DataResourceSchema, SearchParamsType, TreeViewBaseItemType } from "./DataCatalogueFrontend/common";


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
