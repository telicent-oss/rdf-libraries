/* eslint-disable @typescript-eslint/no-explicit-any */
import "jest-fetch-mock";
import { execSync } from "child_process";
import { setupContainer } from "packages/sparql-lib/src/testUtils/setupContainer";
import { getAllDCATResources } from "../getAllDCATResources/getAllDCATResources";
import { VOCAB } from "../constants";
import { loadData } from "packages/sparql-lib/src/testUtils/loadData";
import fs from "fs";
import path from "path";
import { StartedDockerComposeEnvironment } from "testcontainers";
import { triplesForSelect } from "../../../testUtils/triplesForSelect";

const SEC = 1000;
const port = 3030;
const sparqlUrl = `http://localhost:${port}/catalog/`;
const outDir = path.resolve(__dirname, "__artifacts__");

describe("getAllDCATResources", () => {
  let environment: StartedDockerComposeEnvironment;
  let result: any;

  const query = getAllDCATResources({
    vocab: VOCAB,
    catalog: undefined,
    catalogRelation: undefined,
    cls: undefined,
  });

  beforeAll(async () => {
    ({ environment } = await setupContainer({
      port,
      composeFilePath: "../CatalogService",
      composeFiles: "docker-compose.yml",
    }));

    await loadData({
      environment,
      updateUri: `${sparqlUrl}/update`,
      dataLoc: path.resolve(
        "./src/builder/catalog/__mocks__/catalog-from-remote.nt"
      ),
    });
  }, 60 * SEC);

  afterAll(async () => {
    await environment.down({ removeVolumes: true });
  }, 60 * SEC);

  it("gets json", async () => {
    const res = await fetch(sparqlUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/sparql-query",
        Accept: "application/sparql-results+json",
      },
      body: query,
    });

    result = await res.json();
    expect(result).toMatchSnapshot();
  });
  it("gets n-triples", async () => {
    const nTriples = await triplesForSelect(sparqlUrl, result);

    fs.writeFileSync(`${outDir}/getAllDCATResources.nt`, nTriples, "utf8");
    expect(nTriples).toMatchSnapshot();

    execSync(
      `../../scripts/dev/graph/chart-triples \
        -i ${outDir}/getAllDCATResources.nt \
        -o ${outDir}/getAllDCATResources.png \
        -f png`,
      { stdio: "inherit" }
    );
  });
});
