import { RDFServiceConfig } from "@telicent-oss/rdfservice";
import { createACLEDMock } from "./createACLEDMock";
import { makeStatic } from "./__tests__/utils/makeStatic";
import { apiFactory } from "./apiFactory/apiFactory";
export { apiFactory, type Api } from "./apiFactory/apiFactory";
import { CatalogService } from "../index";
import { DEBUG, MOCK, MockSet } from "./setup/constants";
import { createMocks } from "./createMocks";
import { formatDataAsArray } from "./__tests__/utils/formatDataAsArray";

export const setup = async (options: {
  config: RDFServiceConfig;
  triplestoreUri?: string;
  mockSet?: MockSet;
  catalogService?: CatalogService;
}) => {
  let catalogService = options.catalogService;

  if (options.triplestoreUri && catalogService === undefined) {
    /**
     * WARNING instantiation may be stateful, and required to reset
     * See https://telicent.atlassian.net/browse/TELFE-787
     */
    catalogService = await CatalogService.createAsync({
      writeEnabled: true,
      triplestoreUri: options.triplestoreUri,
      dataset: "catalog",
      config: options.config,
    });
  }
  if (catalogService === undefined) {
    throw new Error(
      `Invalid params - must set hostName (${options.triplestoreUri}) or catalogService (${options.catalogService})`
    );
  }

  if (!(await catalogService.checkTripleStore())) {
    throw new Error("Triple store error: simple WHERE failed");
  }

  if (options.mockSet === MockSet.ACLED) {
    await createACLEDMock({ catalogService });
  } else {
    await createMocks({ mockSet: options.mockSet, catalogService });
  }

  const data = await catalogService.runQuery(
    `SELECT ?s ?p ?o WHERE { ?s ?p ?o }`
  );
  const dataFormatted = formatDataAsArray(makeStatic(data.results).bindings);
  DEBUG && console.info(dataFormatted);
  return apiFactory(catalogService, MOCK);
};
