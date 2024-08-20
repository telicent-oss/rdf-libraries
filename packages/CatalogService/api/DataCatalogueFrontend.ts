import z from "zod";
import { CatalogService, MOCK } from "../index";
import { searchFactory } from "./DataCatalogueFrontend/searchFactory";
import { catalogFactory } from "./DataCatalogueFrontend/catalogFactory";
import { UIDataResourceSchema, UISearchParamsType, UITreeViewBaseItemType } from "./DataCatalogueFrontend/common";


export interface Api {
    // TODO use types instead of infer
    search: (params:UISearchParamsType) => Promise<Array<z.infer<typeof UIDataResourceSchema>>>;
    catalog: (params:UISearchParamsType) => Promise<UITreeViewBaseItemType[]>;
    _service: CatalogService;
    _testData?: typeof MOCK;
}

export const apiFactory = (service: CatalogService, testData?: typeof MOCK): Api => ({
    search: searchFactory(service),
    catalog: catalogFactory(service),
    _service: service,
    _testData: testData,
});
