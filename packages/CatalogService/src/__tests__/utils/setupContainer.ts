import "jest-fetch-mock";
import {
  CatalogService,
} from "../../../index";
import {
  DockerComposeEnvironment,
  Wait,
} from "testcontainers";
import { checkPort } from "./checkPort";

const SEC = 1000;

export async function setupContainer() {
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

  const catalogService = new CatalogService(
    "http://localhost:3030/",
    "catalog",
    true,
    undefined,
    undefined
  );

  expect(await catalogService.checkTripleStore()).toBeTruthy();
  return { environment, catalogService };
}