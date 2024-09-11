import "jest-fetch-mock";
import {
  CatalogService,
} from "../index";
import {
  DockerComposeEnvironment,
  Wait,
} from "testcontainers";
import { checkPort } from "./checkPort";

const SEC = 1000;

export async function setupContainer() {
  await checkPort(3030, 30 * SEC);
  const environment = await new DockerComposeEnvironment(
    "./",
    "docker-compose.yml"
  )
    .withWaitStrategy(
      "telicent-jena-smart-cache",
      Wait.forLogMessage("Your service is ready")
    )
    .up();

  const cs = new CatalogService(
    "http://localhost:3030/",
    "catalog",
    true,
    undefined,
    undefined
  );

  expect(await cs.checkTripleStore()).toBeTruthy();
  return { environment, cs };
}