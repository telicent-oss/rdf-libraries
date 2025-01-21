import "jest-fetch-mock";
import { RDFServiceConfig } from "@telicent-oss/rdfservice";
import {
  CatalogService,
} from "../../../index";
import {
  DockerComposeEnvironment,
  Wait,
} from "testcontainers";
import { checkPort } from "./checkPort";

const SEC = 1000;

export async function setupContainer(options: { triplestoreUri: string; config: RDFServiceConfig  }) {
  await checkPort(3030, 60 * SEC);
  const environment = await new DockerComposeEnvironment(
    "./",
    "docker-compose.yml"
  )
    .withWaitStrategy(
      "telicent-jena-smart-cache",
      Wait.forLogMessage("Your service is ready")
    )
    .up();

  const catalogService = await CatalogService.createAsync({
      writeEnabled: true,
      triplestoreUri:  options.triplestoreUri,
      dataset: "catalog",
      config: options.config
    }
  );

  expect(await catalogService.checkTripleStore()).toBeTruthy();
  return { environment, catalogService };
}