import { CatalogService, MOCK } from "../index";
import { searchFactory } from "./operations/searchFactory";
import { catalogFactory } from "./operations/catalogFactory";
import {
  UIDataResourceType,
  UISearchContextType,
  UISearchParamsType,
  UITreeViewBaseItemType,
} from "./operations/utils/common";
import { ApiFactoryConfigType } from "./operations/type";

export interface Api {
  search: (params: UISearchParamsType, context: UISearchContextType) => Promise<Array<UIDataResourceType>>;
  catalog: (params: UISearchParamsType) => Promise<UITreeViewBaseItemType[]>;
  _service: CatalogService;
  _testData?: typeof MOCK;
}

export const apiFactory = (
  service: CatalogService,
  config: ApiFactoryConfigType = {},
  testData?: typeof MOCK
): Api => ({
  search: searchFactory(service, config),
  catalog: catalogFactory(service),
  _service: service,
  _testData: testData,
});
