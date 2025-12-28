import { installTestEnv, resetTestEnv } from "./test-utils";

describe("failure path - schema loading fails", () => {
  beforeEach(() => {
    installTestEnv();
    jest.resetModules();
  });

  afterEach(() => {
    resetTestEnv();
    jest.resetModules();
    jest.dontMock("../schemas.js");
  });

  it("warns when schemas cannot be required", () => {
    jest.doMock("../schemas.js", () => {
      throw new Error("missing schemas");
    });

    let AuthServerOAuth2Client:
      | typeof import("../AuthServerOAuth2Client").default
      | undefined;
    jest.isolateModules(() => {
      AuthServerOAuth2Client = require("../AuthServerOAuth2Client").default;
    });
    if (!AuthServerOAuth2Client) {
      throw new Error("AuthServerOAuth2Client not loaded");
    }

    const warnCalls = (console.warn as jest.Mock).mock.calls;

    expect({
      hasClient: typeof AuthServerOAuth2Client === "function",
      warnings: warnCalls.map((call) => call[0]),
    }).toMatchInlineSnapshot(`
      {
        "hasClient": true,
        "warnings": [
          "Zod schema not available, validation will be skipped:",
        ],
      }
    `);
  });
});
