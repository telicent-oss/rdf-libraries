// import "jest-fetch-mock";
import { DockerComposeEnvironment, Uuid, Wait } from "testcontainers";
import { checkPort } from "./checkPort";

const SEC = 1000;

type DockerComposeEnvironmentParams = {
  composeFilePath: string;
  composeFiles: string | string[];
  uuid?: Uuid;
};

type SetupContainerArgs = { port: number } & DockerComposeEnvironmentParams;

export async function setupContainer({
  port,
  composeFilePath,
  composeFiles,
  uuid
}: SetupContainerArgs) {



  await checkPort(port, 60 * SEC);
  const environment = await new DockerComposeEnvironment(
    composeFilePath,
    composeFiles,
    uuid
  )
    .withWaitStrategy(
      "telicent-jena-smart-cache",
      Wait.forLogMessage("Your service is ready")
    )
    .up();

  return { environment };
}
