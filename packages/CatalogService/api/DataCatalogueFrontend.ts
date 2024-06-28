import z from "zod";
import { CatalogService, MOCK } from "../index";
import { searchFactory } from "./DataCatalogueFrontend/searchFactory";
import { catalogFactory } from "./DataCatalogueFrontend/catalogFactory";
import { DataResourceSchema, SearchParamsType, TreeViewBaseItemType } from "./DataCatalogueFrontend/common";


export interface Api {
    // TODO use types instead of infer
    search: (params:SearchParamsType) => Promise<Array<z.infer<typeof DataResourceSchema>>>;
    catalog: (params:SearchParamsType) => Promise<TreeViewBaseItemType[]>;
    _service: CatalogService;
    _testData?: typeof MOCK;
}

export const apiFactory = (service: CatalogService, testData: typeof MOCK): Api => ({
    search: searchFactory(service),
    catalog: catalogFactory(service),
    _service: service,
    _testData: testData,
});
