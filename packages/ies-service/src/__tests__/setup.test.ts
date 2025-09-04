import "jest-fetch-mock";
import { StartedDockerComposeEnvironment } from "testcontainers";
import { setupContainer } from "./utils/setupContainer";
import { IESService, IESServicePassedOptions } from "../IESService/IESService";
import { SEC } from "../constants";

const describeOrSkip = process.env.DO_TEST_CONTAINERS
  ? describe
  : describe.skip;

const passedOptions: Partial<IESServicePassedOptions> = {
  triplestoreUri: "http://localhost:3030/",
  config: { NO_WARNINGS: true },
};

describeOrSkip("IESService", () => {
  let environment: StartedDockerComposeEnvironment;
  let service: IESService;

  beforeAll(async () => {
    ({ service, environment } = await setupContainer(passedOptions));
  }, 40 * SEC);

  afterAll(async () => {
    await environment.down({ removeVolumes: true });
  }, 20 * SEC);

  afterEach(async () => {
    await service.runUpdate(["DELETE WHERE {?s ?p ?o }"]); //clear the dataset
  }, 20 * SEC);

  it(
    `triple store should be empty`,
    async () => {
      const query = `SELECT ?s ?p ?o WHERE { ?s ?p ?o }`;
      const data = await service.runQuery(query);
      expect(data.results.bindings).toMatchInlineSnapshot(`[]`);
    },
    15 * SEC
  );
});
