import 'jest-fetch-mock';
import { DCATCatalog } from "./index"
import { Api } from "./api/DataCatalogueFrontend"
import { setup } from "./setup"
import { setupContainer } from './__tests__/setupContainer';

let api:Api
const SEC = 1000;

describe('setup', () => {
  beforeAll(async () => {
    const result = await setupContainer();
    const catalogService = result.cs;
    api = await setup({ catalogService })
  }, 30 * SEC)
  test('getOwned', async () => {
    const cat = new DCATCatalog(api._service, api._testData!.catalog1.uri);
    await Promise.all(cat.workAsync); // TODO remove; Just paranoid
    const ownedResources = await cat.getOwnedResources();
    expect(ownedResources.length).toBe(2);

    
  })
})