import { apiFactory } from "./api/DataCatalogueFrontend";
import {
  CatalogService,
  DCATCatalog,
  DCATDataset,
  DCATDataService,
} from "./index";

const ns = "http://telicent.io/data/";

export const MOCK = {
  catalog1: {
    id: `${ns}cat1`,
    title: `Catalog: Cornwall Data`,
    description: `2020 Royal Engineers’ Cornwall focused data catalog. Includes real-time IoT telemetry and historical archives for environmental and technological research.`,
    creator: `Mario Giacomelli`,
    rights: `James Hardacre`,
    published: `12/3/2020`,
  },
  dataservice1: {
    id: `${ns}dataservice1`,
    title: `Service: Wind Feed`,
    description: `Cornwall Wind Detector data via JSON REST API. Real-time, API-token controlled access for analysis by environmental scientists and meteorologists.`,
    creator: `James Hardacre`,
    rights: `James Hardacre`,
    published: `3/4/2023`,
  },
  dataset1: {
    id: `${ns}dataset1`,
    title: `Dataset: Q1 2021`,
    description: `Q1 2021 Cornwall incident reports dataset in CSV format. Heavily redacted, supporting public safety analysis and policy development.`,
    creator: `Kiki Sato`,
    rights: `Kiki Sato`,
    published: `3/4/2021`,
  },
};
export const setup = async ({
  hostName = "http://localhost:3030/",
}: {
  hostName: string;
}) => {
  const catalogService = new CatalogService(
    hostName,
    "catalog",
    undefined,
    undefined,
    true
  );

  await catalogService.runUpdate(["DELETE WHERE {?s ?p ?o }"]); //clear the dataset

  // DCATCatalog
  const cat1 = new DCATCatalog(
    catalogService,
    MOCK.catalog1.id,
    MOCK.catalog1.title,
    "2022-01-01"
  );
  await Promise.all(cat1.workAsync);
  await cat1.setDescription(MOCK.catalog1.description);
  await cat1.setCreator(MOCK.catalog1.creator);
  await cat1.setRights(MOCK.catalog1.rights);
  await cat1.setPublished(MOCK.catalog1.published);
  {
    // DCATDataService
    const dataservice1 = new DCATDataService(
      catalogService,
      MOCK.dataservice1.id,
      MOCK.dataservice1.title,
      undefined,
      undefined
      // cat1
    );
    await Promise.all(dataservice1.workAsync);
    await dataservice1.setDescription(MOCK.dataservice1.description);
    await dataservice1.setCreator(MOCK.dataservice1.creator);
    await dataservice1.setRights(MOCK.dataservice1.rights);
    await dataservice1.setPublished(MOCK.dataservice1.published);
    cat1.addOwnedResource(dataservice1);
    await Promise.all(cat1.workAsync);
  }

  {
    // DCATDataset
    const dataset1 = new DCATDataset(
      catalogService,
      MOCK.dataset1.id,
      MOCK.dataset1.title,
      "2022-01-02",
      undefined
      // cat1,
    );
    await Promise.all(dataset1.workAsync);
    await dataset1.setDescription(MOCK.dataset1.description);
    await dataset1.setCreator(MOCK.dataset1.creator);
    await dataset1.setRights(MOCK.dataset1.rights);
    await dataset1.setPublished(MOCK.dataset1.published);
    cat1.addOwnedResource(dataset1);
    await Promise.all(cat1.workAsync);
  }

  await catalogService.checkTripleStore();
  console.log(`setup complete
    cat1 owns ${(await cat1.getOwnedResources()).length}`);
  return apiFactory(catalogService, MOCK);
};
