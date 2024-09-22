import { makeStatic } from "./__tests__/utils/makeStatic";
import { apiFactory } from "./apiFactory/apiFactory";
export { apiFactory, type Api } from "./apiFactory/apiFactory";
import {
  CatalogService,
} from "../index";
import { DEBUG, MOCK, MockSet } from "./setup/constants";
import { createMocks } from "./createMocks";
import { createACLEDMock } from "./createACLEDMock";

export const setup = async (options: {
  hostName?: string;
  mockSet?: MockSet;
  catalogService?: CatalogService;
}) => {

  
  let catalogService = options.catalogService;
  
  if (options.hostName) {
    catalogService = new CatalogService({
      writeEnabled: true,
      triplestoreUri: options.hostName,
      dataset: "catalog",
  });
  }
  if (catalogService === undefined) {
    throw new Error(`Invalid params - must set hostName (${options.hostName}) or catalogService (${options.catalogService})`);
  }
  
  if (!(await catalogService.checkTripleStore())) {
    throw new Error("Triple store error: simple WHERE failed");
  }
  
  if (options.mockSet === MockSet.ACLED) {
    await createACLEDMock({ catalogService });
  } else {
    await createMocks({ mockSet: options.mockSet, catalogService })
  }

  const query = `SELECT ?s ?p ?o WHERE { ?s ?p ?o }`;
  const data = await catalogService.runQuery(query);
  const dataFormatted = JSON.stringify(makeStatic(data.results), null, 2)
  DEBUG && console.info(dataFormatted);
  return apiFactory(catalogService, MOCK);
};
