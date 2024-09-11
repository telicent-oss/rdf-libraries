import 'jest-fetch-mock';
import { DCATCatalog } from "./index"
import { Api } from "./api/DataCatalogueFrontend"
import { setup } from "./setup"

let api:Api

describe('setup', () => {
  beforeAll(async () => {
    api = await setup({ hostName: "http://localhost:3030/" })
  })
  test('getOwned', async () => {
    const cat = new DCATCatalog(api._service, api._testData!.catalog1.id);
    await Promise.all(cat.workAsync); // TODO remove; Just paranoid
    const ownedResources = await cat.getOwnedResources();
    expect(ownedResources.length).toBe(2);

    
  })
})