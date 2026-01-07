import { installTestEnv, resetTestEnv } from "./test-utils";

describe("happy path - schema loading succeeds", () => {
  beforeEach(() => {
    installTestEnv();
  });

  afterEach(() => {
    resetTestEnv();
    jest.resetModules();
  });

  it("parses config when schema is available", () => {
    let AuthServerOAuth2Client:
      | typeof import("../AuthServerOAuth2Client").default
      | undefined;
    jest.isolateModules(() => {
      AuthServerOAuth2Client = require("../AuthServerOAuth2Client").default;
    });
    if (!AuthServerOAuth2Client) {
      throw new Error("AuthServerOAuth2Client not loaded");
    }

    const client = new AuthServerOAuth2Client({
      clientId: "client-1",
      authServerUrl: "http://auth.telicent.localhost",
      redirectUri: "http://app.telicent.localhost/callback",
      popupRedirectUri: "http://app.telicent.localhost/popup",
      scope: "openid profile",
      onLogout: jest.fn(),
    });

    expect({
      clientId: client.config.clientId,
    }).toMatchInlineSnapshot(`
      {
        "clientId": "client-1",
      }
    `);
  });

  it("validates user info via schema when available", () => {
    let AuthServerOAuth2Client:
      | typeof import("../AuthServerOAuth2Client").default
      | undefined;
    jest.isolateModules(() => {
      AuthServerOAuth2Client = require("../AuthServerOAuth2Client").default;
    });
    if (!AuthServerOAuth2Client) {
      throw new Error("AuthServerOAuth2Client not loaded");
    }

    const client = new AuthServerOAuth2Client({
      clientId: "client-1",
      authServerUrl: "http://auth.telicent.localhost",
      redirectUri: "http://app.telicent.localhost/callback",
      popupRedirectUri: "http://app.telicent.localhost/popup",
      scope: "openid profile",
      onLogout: jest.fn(),
    });

    const now = 1_700_000_000_000;
    jest.spyOn(Date, "now").mockReturnValue(now);
    const token =
      "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ1c2VyLTEiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJwcmVmZXJyZWRfbmFtZSI6IlVzZXIgT25lIiwiaXNzIjoiaHR0cDovL2F1dGgudGVsaWNlbnQubG9jYWxob3N0IiwiYXVkIjoiY2xpZW50LTEiLCJleHAiOjE3MDAwMDAzMDAsImlhdCI6MTcwMDAwMDAwMCwianRpIjoiaWQtMSJ9.";

    sessionStorage.setItem("auth_id_token", token);
    const info = client.getUserInfo();

    expect({ info }).toMatchInlineSnapshot(`
      {
        "info": {
          "aud": "client-1",
          "auth_time": undefined,
          "azp": undefined,
          "email": "user@example.com",
          "exp": 1700000300,
          "externalProvider": {
            "aud": "client-1",
            "email": "user@example.com",
            "exp": 1700000300,
            "iat": 1700000000,
            "iss": "http://auth.telicent.localhost",
            "jti": "id-1",
            "preferred_name": "User One",
            "sub": "user-1",
          },
          "iat": 1700000000,
          "isActive": undefined,
          "iss": "http://auth.telicent.localhost",
          "jti": "id-1",
          "name": "User One",
          "nonce": undefined,
          "preferred_name": "User One",
          "sid": undefined,
          "source": "id_token",
          "sub": "user-1",
          "token_expired": false,
          "token_expires_at": "2023-11-14T22:18:20.000Z",
        },
      }
    `);

    (Date.now as jest.Mock).mockRestore();
  });
});
