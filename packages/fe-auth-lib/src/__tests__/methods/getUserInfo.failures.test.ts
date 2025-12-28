import AuthServerOAuth2Client, {
  AuthServerOAuth2ClientConfig,
} from "../../AuthServerOAuth2Client";
import { buildJwt, installTestEnv, resetTestEnv } from "../test-utils";

const createConfig = (
  overrides: Partial<AuthServerOAuth2ClientConfig> = {}
): AuthServerOAuth2ClientConfig => ({
  clientId: "client-1",
  authServerUrl: "http://auth.telicent.localhost",
  redirectUri: "http://app.telicent.localhost/callback",
  popupRedirectUri: "http://app.telicent.localhost/popup",
  scope: "openid profile",
  onLogout: jest.fn(),
  ...overrides,
});

describe("failure path - getUserInfo errors", () => {
  beforeEach(() => {
    installTestEnv();
  });

  afterEach(() => {
    resetTestEnv();
  });

  it("returns null when token is missing", () => {
    const client = new AuthServerOAuth2Client(createConfig());

    const info = client.getUserInfo();

    expect({ info }).toMatchInlineSnapshot(`
      {
        "info": null,
      }
    `);
  });

  it("returns null for invalid token", () => {
    const client = new AuthServerOAuth2Client(createConfig());
    sessionStorage.setItem("auth_id_token", "not-a-jwt");

    const info = client.getUserInfo();

    expect({ info }).toMatchInlineSnapshot(`
      {
        "info": null,
      }
    `);
  });

  it("returns null for expired token", () => {
    const now = 1_700_000_000_000;
    jest.spyOn(Date, "now").mockReturnValue(now);

    const client = new AuthServerOAuth2Client(createConfig());
    const token = buildJwt({
      sub: "user-1",
      aud: "client-1",
      exp: Math.floor(now / 1000) - 10,
      iat: Math.floor(now / 1000) - 100,
      email: "user@example.com",
      preferred_name: "User One",
      iss: "http://auth.telicent.localhost",
      jti: "id-1",
    });
    sessionStorage.setItem("auth_id_token", token);

    const info = client.getUserInfo();

    expect({ info }).toMatchInlineSnapshot(`
      {
        "info": null,
      }
    `);

    (Date.now as jest.Mock).mockRestore();
  });

  it("returns unvalidated info when schema validation fails", () => {
    const now = 1_700_000_000_000;
    jest.spyOn(Date, "now").mockReturnValue(now);

    const client = new AuthServerOAuth2Client(createConfig());
    const token = buildJwt({
      sub: "user-1",
      aud: "client-1",
      exp: Math.floor(now / 1000) + 300,
      iat: Math.floor(now / 1000),
      iss: "http://auth.telicent.localhost",
      jti: "id-1",
    });
    sessionStorage.setItem("auth_id_token", token);

    const info = client.getUserInfo();

    expect({
      info,
      warnings: (console.warn as jest.Mock).mock.calls.map((call) => call[0]),
    }).toMatchInlineSnapshot(`
      {
        "info": {
          "aud": "client-1",
          "auth_time": undefined,
          "azp": undefined,
          "email": undefined,
          "exp": 1700000300,
          "externalProvider": {
            "aud": "client-1",
            "exp": 1700000300,
            "iat": 1700000000,
            "iss": "http://auth.telicent.localhost",
            "jti": "id-1",
            "sub": "user-1",
          },
          "iat": 1700000000,
          "isActive": undefined,
          "iss": "http://auth.telicent.localhost",
          "jti": "id-1",
          "name": "user-1",
          "nonce": undefined,
          "preferred_name": undefined,
          "sid": undefined,
          "source": "id_token",
          "sub": "user-1",
          "token_expired": false,
          "token_expires_at": "2023-11-14T22:18:20.000Z",
        },
        "warnings": [
          "Returning unvalidated user info. Validation errors:",
        ],
      }
    `);

    (Date.now as jest.Mock).mockRestore();
  });

  it("returns null when decodeJWT throws", () => {
    const client = new AuthServerOAuth2Client(createConfig());
    sessionStorage.setItem("auth_id_token", "TOKEN");
    jest.spyOn(client, "decodeJWT").mockImplementation(() => {
      throw new Error("decode failed");
    });

    const info = client.getUserInfo();

    expect({ info }).toMatchInlineSnapshot(`
      {
        "info": null,
      }
    `);
  });
});
