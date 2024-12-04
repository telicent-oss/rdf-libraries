import {
  DockerComposeEnvironment,
  Wait,
} from "testcontainers";
import { checkPort } from "./checkPort";
import { IESService, IESServicePassedOptions } from "../../IESService/IESService";

const SEC = 1000;

export async function setupContainer(passedOptions: Partial<IESServicePassedOptions>) {
  
  await checkPort(3030, 60 * SEC); // TODO grab port from passedOptions.triplestoreUri
  const environment = await new DockerComposeEnvironment(
    "./",
    "docker-compose.yml"
  )
    .withWaitStrategy(
      "telicent-jena-smart-cache",
      Wait.forLogMessage("Your service is ready")
    )
    .up();

  const service = await IESService.createAsync({
      writeEnabled: true,
      ...passedOptions,
    }
  );

  expect(await service.checkTripleStore()).toBeTruthy();
  return { environment, service };
}