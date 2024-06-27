import { z } from "zod";
import {
  CatalogService,
  DCATCatalog,
  DCATDataService,
  DCATDataset,
} from "../../index";

import { SearchParamsType } from "../DataCatalogueFrontend";
import {
  DATASET_URI,
  SERVICE_URI,
  CATALOG_URI,
  DataResourceSchema,
  ResourceType,
  instanceFromResourceFactory,
  getAllResourceTriples,
  uiDataResourceFromInstance,
} from "./common";

export const searchFactory = (service: CatalogService) => {
  // TODO why must UriToClass be defined within searchFactory?
  const UriToClass = {
    [DATASET_URI]: DCATDataset,
    [SERVICE_URI]: DCATDataService,
    [CATALOG_URI]: DCATCatalog,
  };
  return async function search(
    params: SearchParamsType
  ): Promise<Array<z.infer<typeof DataResourceSchema>>> {

    // REQUIREMENT 7.2 Search by input text
    // Ok. I'll simply implement the `CatalogService.find`
    // THen if I get time I'll update find to work with DataSet and DataService
    /**
     * ```ts
     * if (params.searchText) {
     *   const cat = new DCATCatalog(service, catId)
     *   return await cat.find().map(el => el.item);
     */
    // CONCLUSION ~1hr WITH LIMITATIONS: Does not work with DataSet and DataService

    if (params.dataResourceFilter === "all") {

      const resourceTriples: ResourceType[] = await getAllResourceTriples(service);
      
      const dcatInstances = resourceTriples
        .map(instanceFromResourceFactory({ service, UriToClass }))
        .map(uiDataResourceFromInstance);
      return Promise.all(dcatInstances);
    } 

    // REQUIREMENT 6.5 Search by dataResourceFilter: selected data-resources
    // const id = params.dataResourceFilter[0];
    // const triples = 


    /**
     * ```ts
     * const id = params.dataResourceFilter[0];
     * const triples = lookup if not existing (inefficient but fine for demo)
     * const type = triples.find(tripleWithId(id))
     * tryInstantiate({ UriToClass, type: uri, service, id});
     * ```
     * CONCLUSION: ~1hr
     */
    // 
    // 

    // REQUIREMENTS 8.1 Search by user-owned data-resources
    /**
     * Hm. doesn't exist.
     * Fine. 
     * 1. add creator into each RDFService
     * 2. In selectFactory & catalogFactory, update WHERE clauses to include creator (if it exists)
     * ... That should be it, as the rest of my logic iterates off the output 
     * 
     * {@link https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/creator/}
     * CONCLUSION: ~2hrs
     * 
     */
    throw Error(
      `Only dataResourceFilter: "all" supported for now, instead got: "${params.dataResourceFilter}" `
    );
  };
};
