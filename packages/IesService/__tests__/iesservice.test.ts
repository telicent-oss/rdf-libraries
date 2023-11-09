import fetchMock, { enableFetchMocks } from 'jest-fetch-mock'
import IesService from '../index'

enableFetchMocks()

describe("IesService", () => {
  it("should run the test", () => {
    expect(true).toBeTruthy()
  })
});
