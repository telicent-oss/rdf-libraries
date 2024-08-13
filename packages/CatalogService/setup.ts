import { apiFactory } from "./api/DataCatalogueFrontend";
import {
  CatalogService,
  DCATCatalog,
  DCATDataset,
  DCATDataService,
} from "./index";

const ns = "http://telicent.io/data/";
export enum MockSet {
  SIMPLE = 'simple',
  COMPLEX = 'complex'
}

type MockDataBase = {
  id: string;
  title: string;
  description: string;
  creator: string;
  rights: string;
  published: string;
};
type MockDataDCATCatalog = {
  classType: "DCATCatalog";
} & MockDataBase;
type MockDataDCATDataService = {
  classType: "DCATDataService";
} & MockDataBase;
type MockDataDCATDataset = {
  classType: "DCATDataset";
} & MockDataBase;

type MockData =
  | MockDataDCATCatalog
  | MockDataDCATDataService
  | MockDataDCATDataset;

export const MOCK: Record<string, MockData> = {
  catalog1: {
    classType: "DCATCatalog",
    id: `${ns}catalog1`,
    title: `Catalog: Cornwall Data`,
    description: `2020 Royal Engineers’ Cornwall focused data catalog. Includes real-time IoT telemetry and historical archives for environmental and technological research.`,
    creator: `Mario Giacomelli`,
    rights: `James Hardacre`,
    published: `2020-3-12`,
  },
  catalog2: {
    classType: "DCATCatalog",
    id: `${ns}cat2`,
    title: `Catalog: Sussex Data`,
    description: `2020 Royal Engineers’ Cornwall focused data catalog. Includes real-time IoT telemetry and historical archives for environmental and technological research.`,
    creator: `Amina Okeke`,
    rights: `Erik Johansson`,
    published: `2020-3-12`,
  },
  catalog1_1: {
    classType: "DCATCatalog",
    id: `${ns}catalog1.1`,
    title: `Catalog: St Clement Wind turbine`,
    description: `Third-party data pulled from Wind Turbine register.`,
    creator: `Hans Müller`,
    rights: `Aarav Sharma`,
    published: `2019-5-3`,
  },
  catalog1_1_dataset: {
    classType: "DCATDataset",
    id: `${ns}catalog1_1_dataset`,
    title: `Dataset: Region 44`,
    description: `Turbines around Trefranc and St Clether.`,
    creator: `George Maxwell`,
    rights: `Aiman Ismail`,
    published: `2022-6-5`,
  },

  dataservice1: {
    id: `${ns}dataservice1`,
    classType: "DCATDataService",
    title: `Service: Wind Feed`,
    description: `Cornwall Wind Detector data via JSON REST API. Real-time, API-token controlled access for analysis by environmental scientists and meteorologists.`,
    creator: `Oleg Novak`,
    rights: `James Hardacre`,
    published: `2023-2-3`,
  },
  dataset1: {
    classType: "DCATDataset",
    id: `${ns}dataset1`,
    title: `Dataset: Q1 2021`,
    description: `Q1 2021 Cornwall incident reports dataset in CSV format. Heavily redacted, supporting public safety analysis and policy development.`,
    creator: `Kiki Sato`,
    rights: `Damir Sato`,
    published: `2021-4-5`,
  },
  dataset2: {
    classType: "DCATDataset",
    id: `${ns}dataset2`,
    title: `Dataset: Q2 2021`,
    description: `Q2 2021 Cornwall incident reports dataset in CSV format. Heavily redacted, supporting public safety analysis and policy development.`,
    creator: `Kiki Sato`,
    rights: `Damir Sato`,
    published: `2021-7-5`,
  },
  dataset3: {
    classType: "DCATDataset",
    id: `${ns}dataset3`,
    title: `Dataset: Q3 2021`,
    description: `Q3 2021 Cornwall incident reports dataset in CSV format. Heavily redacted, supporting public safety analysis and policy development.`,
    creator: `Kiki Sato`,
    rights: `Damir Sato`,
    published: `2022-10-5`,
  },
  dataset4: {
    classType: "DCATDataset",
    id: `${ns}dataset4`,
    title: `Dataset: Q4 2021`,
    description: `Q4 2021 Cornwall incident reports dataset in CSV format. Heavily redacted, supporting public safety analysis and policy development.`,
    creator: `Kiki Sato`,
    rights: `Wei Zhang`,
    published: `2023-2-5`,
  },
};
export const setup = async ({
  hostName = "http://localhost:3030/",
  mockSet = MockSet.SIMPLE
}: {
  hostName: string;
  mockSet?: MockSet;
}) => {
  const catalogService = new CatalogService(
    hostName,
    "catalog",
    undefined,
    undefined,
    true
  );

  if (!(await catalogService.checkTripleStore())) {
    throw new Error("Triple store error: simple WHERE failed");
  }

  const createResource = async ({
    mock,
    published,
    parent,
  }: {
    mock: MockData;
    published?: string;
    parent?: DCATCatalog;
  }): Promise<DCATCatalog | DCATDataset | DCATDataService> => {
    // DCATDataService
    let r: DCATDataService | DCATCatalog | DCATDataset;
    switch (mock.classType) {
      case "DCATCatalog":
        r = new DCATCatalog(
          catalogService,
          mock.id,
          mock.title,
          published,
          undefined
          // parent,
        );
        break;
      case "DCATDataService":
        r = new DCATDataService(
          catalogService,
          mock.id,
          mock.title,
          published,
          undefined
          // catalog1
        );
        break;
      case "DCATDataset":
        r = new DCATDataset(
          catalogService,
          mock.id,
          mock.title,
          published,
          undefined
          // catalog1
        );
        break;
      default:
        throw "no";
    }
    await Promise.all(r.workAsync);
    await Promise.all(catalogService.workAsync);
    await r.setDescription(mock.description);
    await r.setCreator(mock.creator);
    await r.setRights(mock.rights);
    await r.setPublished(mock.published);
    await Promise.all(r.workAsync);
    if (parent?.addOwnedResource) {
      parent.addOwnedResource(r);
      await Promise.all(parent.workAsync);
    }
    return r;
  };

  await catalogService.runUpdate(["DELETE WHERE {?s ?p ?o }"]); //clear the dataset

  // DCATCatalog #1
  const catalog1 = (await createResource({
    mock: MOCK.catalog1,
    published: "2022-01-01",
  })) as DCATCatalog;

  let catalog1_1: DCATCatalog | undefined = mockSet === MockSet.COMPLEX
  ? (await createResource({
      mock: MOCK.catalog1_1,
      published: "2022-01-01",
      parent: catalog1,
    })) as DCATCatalog : undefined;

  if (mockSet === MockSet.COMPLEX) {
    await createResource({
      mock: MOCK.catalog1_1_dataset,
      parent: catalog1_1,
    });
  }
  

  await createResource({
    mock: MOCK.dataservice1,
    parent: catalog1,
  });
  await createResource({
    mock: MOCK.dataset1,
    parent: catalog1,
  });

  if (mockSet === MockSet.COMPLEX) {
    await createResource({
      mock: MOCK.dataset2,
      parent: catalog1,
    });
    await createResource({
      mock: MOCK.dataset3,
      parent: catalog1,
    });
    await createResource({
      mock: MOCK.dataset4,
      parent: catalog1,
    });
  }

  const catalog2:DCATCatalog | undefined = 
    mockSet === MockSet.COMPLEX
    ? (
      await createResource({
        mock: MOCK.catalog2,
      }) as DCATCatalog
    ) 
    : undefined;
  

  console.log(`Owned resources`);
  console.log(`---------------`);
  console.log(`catalog1:   ${(await catalog1.getOwnedResources()).length}`);
  catalog1_1 && console.log(`catalog1_1:   ${(await catalog1_1.getOwnedResources()).length}`);
  catalog2 && console.log(`catalog2:   ${(await catalog2.getOwnedResources()).length}`);
  // console.log(`catalog1_1: ${OwnedResources.catalog1_1.length}`);
  // console.log(`catalog2:   ${OwnedResources.catalog2.length}`);

  // const cat1 = new DCATCatalog(
  //   catalogService,
  //   MOCK.catalog1.id,
  //   MOCK.catalog1.title,
  //   "2022-01-01"
  // );
  // console.log('cat1.service.workAsync', cat1.service.workAsync);
  // await Promise.all(cat1.workAsync);
  // await Promise.all(catalogService.workAsync);
  // await cat1.setDescription(MOCK.catalog1.description);
  // await cat1.setCreator(MOCK.catalog1.creator);
  // await cat1.setRights(MOCK.catalog1.rights);
  // await cat1.setPublished(MOCK.catalog1.published);
  // {
  //   // DCATDataService
  //   const dataservice1 = new DCATDataService(
  //     catalogService,
  //     MOCK.dataservice1.id,
  //     MOCK.dataservice1.title,
  //     undefined,
  //     undefined
  //     // cat1
  //   );
  //   await Promise.all(dataservice1.workAsync);
  //   await Promise.all(catalogService.workAsync);
  //   await dataservice1.setDescription(MOCK.dataservice1.description);
  //   await dataservice1.setCreator(MOCK.dataservice1.creator);
  //   await dataservice1.setRights(MOCK.dataservice1.rights);
  //   await dataservice1.setPublished(MOCK.dataservice1.published);
  //   cat1.addOwnedResource(dataservice1);
  //   await Promise.all(cat1.workAsync);
  // }

  // {
  //   // DCATDataset
  //   const dataset1 = new DCATDataset(
  //     catalogService,
  //     MOCK.dataset1.id,
  //     MOCK.dataset1.title,
  //     "2022-01-02",
  //     undefined
  //     // cat1,
  //   );
  //   await Promise.all(dataset1.workAsync);
  //   await Promise.all(catalogService.workAsync);
  //   await dataset1.setDescription(MOCK.dataset1.description);
  //   await dataset1.setCreator(MOCK.dataset1.creator);
  //   await dataset1.setRights(MOCK.dataset1.rights);
  //   await dataset1.setPublished(MOCK.dataset1.published);
  //   cat1.addOwnedResource(dataset1);
  //   await Promise.all(cat1.workAsync);
  // }

  // await catalogService.checkTripleStore();
  // console.log(`setup complete
  //   cat1 owns ${(await cat1.getOwnedResources()).length}`);
  return apiFactory(catalogService, MOCK);
};
