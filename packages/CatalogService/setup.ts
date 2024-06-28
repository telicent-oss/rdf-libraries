import { apiFactory } from "./api/DataCatalogueFrontend";
import {
  CatalogService,
  DCATCatalog,
  DCATDataset,
  DCATDataService,
} from "./index";

const MOCK_TEXT = {
  catalog: {
    title: `Catalog: Cornwall Data`,
    description: `2020 Royal Engineers’ Cornwall-focused data catalog. Includes real-time IoT telemetry and historical archives for environmental and technological research.`,
    creator: `Mario Giacomelli`,
    rights: `James Hardacre`,
    published: `12/3/2020`
  },
  service: {
    title: `Service: Wind Feed`,
    description: `Cornwall Wind Detector data via JSON REST API. Real-time, API-token controlled access for environmental scientists and meteorologists.`,
    creator: `James Hardacre`,
    rights: `James Hardacre`,
    published: `3/4/2023`
  },
  dataset: {
    title: `Dataset: Q1 2021`,
    description: `Q1 2021 Cornwall incident reports dataset in CSV format. Heavily redacted, supporting public safety analysis and policy development.`,
    creator: `Kiki Sato`,
    rights: `Kiki Sato`,
    published: `3/4/2021`
  }
}
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
  // 
  const cat = new DCATCatalog(
    catalogService,
    cat1,
    MOCK_TEXT.catalog.title,
    "2022-01-01"
  );
  await Promise.all(cat.workAsync);
  await cat.setDescription(MOCK_TEXT.catalog.description);
  await cat.setCreator(MOCK_TEXT.catalog.creator);
  await cat.setRights(MOCK_TEXT.catalog.rights);
  await cat.setPublished(MOCK_TEXT.catalog.published);

  // 
  const d1 = new DCATDataset(
    catalogService,
    dataset1,
    MOCK_TEXT.service.title,
    "2022-01-02",
    undefined,
    cat
  );
  await Promise.all(d1.workAsync);
  await d1.setDescription(MOCK_TEXT.service.description);
  await d1.setCreator(MOCK_TEXT.service.creator);
  await d1.setRights(MOCK_TEXT.service.rights);
  await d1.setPublished(MOCK_TEXT.service.published);



  const ds1 = new DCATDataService(
    catalogService,
    dataservice1,
    MOCK_TEXT.dataset.title,
    undefined,
    undefined
  );
  await Promise.all(ds1.workAsync);
  await ds1.setDescription(MOCK_TEXT.dataset.description);
  await ds1.setCreator(MOCK_TEXT.dataset.creator);
  await ds1.setRights(MOCK_TEXT.dataset.rights);
  await ds1.setPublished(MOCK_TEXT.dataset.published);
  
  cat.addOwnedResource(ds1);
  await Promise.all(cat.workAsync);
  await catalogService.checkTripleStore();
  return apiFactory(catalogService);
};
