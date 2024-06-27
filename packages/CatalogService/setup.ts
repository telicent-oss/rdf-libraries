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

  function delays(waitMs: number) {
    return new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  await catalogService.runUpdate(["DELETE WHERE {?s ?p ?o }"]); //clear the dataset
  await delays(1000);

  const cat = new DCATCatalog(
    catalogService,
    cat1,
    "Catalog One",
    "2022-01-01"
  );
  const d1 = new DCATDataset(
    catalogService,
    dataset1,
    "Dataset One",
    "2022-01-02",
    undefined,
    cat
  );
  const ds1 = new DCATDataService(
    catalogService,
    dataservice1,
    "Data Service One",
    undefined,
    undefined
  );
  ds1.setPublished("2022-01-03");
  cat.addOwnedResource(ds1);
  await delays(3000);
  await catalogService.checkTripleStore();
  return apiFactory(catalogService);
};
