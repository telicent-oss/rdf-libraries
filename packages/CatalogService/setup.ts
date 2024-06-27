import { apiFactory } from "./api/DataCatalogueFrontend";
import {
  CatalogService,
  DCATCatalog,
  DCATDataset,
  DCATDataService,
} from "./index";

export const setup = async ({
  hostName = "http://localhost:3030/",
}: {
  hostName: string;
}) => {
  if (CatalogService === undefined) {
    throw new TypeError("CatalogService === undefined");
  }
  const catalogService = new CatalogService(
    hostName,
    "catalog",
    undefined,
    undefined,
    true
  );

  const testDefaultNamespace = "http://telicent.io/data/";
  const cat1 = `${testDefaultNamespace}cat1`;
  const dataset1 = `${testDefaultNamespace}dataset1`;
  const dataservice1 = `${testDefaultNamespace}dataservice1`;

  
  await catalogService.runUpdate(["DELETE WHERE {?s ?p ?o }"]); //clear the dataset
  const cat = new DCATCatalog(
    catalogService,
    cat1,
    "Catalog One",
    "2022-01-01"
  );
  await Promise.all(cat.workAsync);
  const d1 = new DCATDataset(
    catalogService,
    dataset1,
    "Dataset One",
    "2022-01-02",
    undefined,
    cat
  );
  await Promise.all(d1.workAsync);
  const ds1 = new DCATDataService(
    catalogService,
    dataservice1,
    "Data Service One",
    undefined,
    undefined
  );
  await Promise.all(ds1.workAsync);
  await ds1.setPublished("2022-01-03");
  cat.addOwnedResource(ds1);
  await Promise.all(cat.workAsync);
  await catalogService.checkTripleStore();
  return apiFactory(catalogService);
};
