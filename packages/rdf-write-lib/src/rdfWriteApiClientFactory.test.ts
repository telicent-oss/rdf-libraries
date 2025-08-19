// tests/rdfWriteApiClientFactory.jest.test.ts
import {
  describe,
  it,
  beforeEach,
  afterEach,
  expect,
  jest,
} from "@jest/globals";

jest.mock("openapi-fetch", () => {
  const create = jest.fn(() => {
    const POST = jest.fn(async (_ep: string, _init?: unknown) => ({
      ok: true,
      data: { ep: _ep, init: _init },
    }));
    return { POST };
  });
  return { __esModule: true, default: create };
});

describe("rdfWriteApiClientFactory (Jest)", () => {
  let mod: typeof import("./rdfWriteApiClientFactory");
  let createClientMock: jest.Mock;

  beforeEach(async () => {
    jest.resetModules();
    mod = await import("./index");
    createClientMock = (await import("openapi-fetch"))
      .default as unknown as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("passes options to openapi-fetch and returns the client", () => {
    const opts = { baseUrl: "http://localhost:8000" } as const;
    const client = mod.rdfWriteApiClientFactory(opts);

    expect(createClientMock).toHaveBeenCalledTimes(1);
    expect(createClientMock.mock.calls).toMatchInlineSnapshot(`
      [
        [
          {
            "baseUrl": "http://localhost:8000",
          },
        ],
      ]
    `);

    expect(client).toMatchInlineSnapshot(`
      {
        "POST": [MockFunction],
      }
    `);
  });
});
