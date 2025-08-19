import "jest-fetch-mock";
import { RDFServiceConfig } from "@telicent-oss/rdfservice";
import { setupContainer as setupContinerRaw } from "@telicent-oss/dev-dependencies-lib";
import { CatalogService } from "../../index";

export async function setupContainer(options: {
  triplestoreUri: string;
  config: RDFServiceConfig;
}) {
  const { environment } = await setupContinerRaw({
    port: 3030,
    composeFilePath: "./",
    composeFiles: "docker-compose.yml",
  });
  const catalogService = await CatalogService.createAsync({
    writeEnabled: true,
    triplestoreUri: options.triplestoreUri,
    dataset: "catalog",
    config: options.config,
  });
  expect(await catalogService.checkTripleStore()).toBeTruthy();
  return { environment, catalogService };
}
