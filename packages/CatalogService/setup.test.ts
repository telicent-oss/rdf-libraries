import 'jest-fetch-mock';
import { CatalogService, DCATCatalog } from "./index"
import { Api } from "./api/DataCatalogueFrontend"
import { setup } from "./setup"
import { setupContainer } from './__tests__/setupContainer';
import { StartedDockerComposeEnvironment } from 'testcontainers';

const SEC = 1000;

describe('setup', () => {
  let catalogService: CatalogService;
  let environment: StartedDockerComposeEnvironment;
  let api:Api
  beforeAll(async () => {
    ({ catalogService, environment} = await setupContainer());
    api = await setup({ catalogService })
  }, 30 * SEC)
  afterAll(async () => {
    await Promise.all(api._service.workAsync);
    await environment.down({ removeVolumes: true });
  }, 60 * SEC);
  test('getOwned', async () => {
    const cat = new DCATCatalog(api._service, api._testData!.catalog1.uri);
    await Promise.all(cat.workAsync); // TODO remove; Just paranoid
    const ownedResources = await cat.getOwnedResources();
    expect(ownedResources.length).toBe(2);

    
  })
})