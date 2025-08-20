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
import { resourceUpdateFactory, ResourceUpdateParamsType, ResourceUpdateResults } from "./operations/resourceUpdateFactory/resourceUpdateFactory";
import { RdfWriteApiClientType } from "@telicent-oss/rdf-write-lib";
import { prepareWritebackFactory, PrepareWritebackParamsType } from "./operations/prepareWritebackFactory/prepareWritebackFactory";
import { resourceCreateFactory, ResourceCreateParamsType, ResourceCreateResults } from "./operations/resourceCreateFactory/resourceCreateFactory";

export interface Api {
  search: (params: UISearchParamsType, context: UISearchContextType) => Promise<Array<Partial<UIDataResourceType>>>;
  prepareWriteback: (params: PrepareWritebackParamsType) => Promise<Array<Partial<UIDataResourceType>>>;
  catalog: (params: UISearchParamsType) => Promise<UITreeViewBaseItemType[]>;
  resourceUpdate: (params: ResourceUpdateParamsType) => Promise<ResourceUpdateResults>;
  resourceCreate: (params: ResourceCreateParamsType) => Promise<ResourceCreateResults>;
  _catalogService: CatalogService;
  _rdfWriteApiClient: RdfWriteApiClientType;
  _testData?: typeof MOCK;
}

export const apiFactory = (
  catalogService: CatalogService,
  rdfWriteApiClient: RdfWriteApiClientType,
  config: ApiFactoryConfigType = {},
  testData?: typeof MOCK
): Api => ({
  search: searchFactory(catalogService, config),
  prepareWriteback: prepareWritebackFactory(catalogService, config),
  catalog: catalogFactory(catalogService),
  resourceUpdate: resourceUpdateFactory({ catalogService,  rdfWriteApiClient }),
  resourceCreate: resourceCreateFactory({ catalogService,  rdfWriteApiClient }),
  _catalogService: catalogService,
  _rdfWriteApiClient: rdfWriteApiClient,
  _testData: testData,
});
