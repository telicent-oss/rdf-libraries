export { apiFactory, type Api } from "./apiFactory/apiFactory";
import {
  CatalogService,
  DCATCatalog,
  DCATDataset,
  DCATDataService,
} from "../index";
import { MOCK, MockData, MockSet } from "./setup/constants";

export const createMocks = async ({
  catalogService,
  mockSet,
}: {
  catalogService: CatalogService;
  mockSet?: MockSet;
}) => {
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
          mock.uri,
          mock.title,
          published,
          undefined
          // parent,
        );
        break;
      case "DCATDataService":
        r = new DCATDataService(
          catalogService,
          mock.uri,
          mock.title,
          published,
          undefined
          // catalog1
        );
        break;
      case "DCATDataset":
        r = new DCATDataset(
          catalogService,
          mock.uri,
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
    await r.setModified(mock.modified);
    await r.setAccessRights(mock.accessRights);

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

  let catalog1_1: DCATCatalog | undefined =
    mockSet === MockSet.COMPLEX
      ? ((await createResource({
          mock: MOCK.catalog1_1,
          published: "2022-01-01",
          parent: catalog1,
        })) as DCATCatalog)
      : undefined;

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

  let catalog2: DCATCatalog | undefined;

  if (mockSet === MockSet.COMPLEX) {
    catalog2 = (await createResource({
      mock: MOCK.catalog2,
    })) as DCATCatalog;
  }
};
