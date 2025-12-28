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

describe("happy path - getUserInfo returns mapped user info", () => {
  beforeEach(() => {
    installTestEnv();
  });

  afterEach(() => {
    resetTestEnv();
  });

  it("returns user info for valid token", () => {
    const now = 1_700_000_000_000;
    jest.spyOn(Date, "now").mockReturnValue(now);

    const client = new AuthServerOAuth2Client(createConfig());
    const token = buildJwt({
      sub: "user-1",
      aud: "client-1",
      exp: Math.floor(now / 1000) + 300,
      iat: Math.floor(now / 1000),
      email: "user@example.com",
      preferred_name: "User One",
      iss: "http://auth.telicent.localhost",
      jti: "id-1",
      isActive: true,
    });
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
            "isActive": true,
            "iss": "http://auth.telicent.localhost",
            "jti": "id-1",
            "preferred_name": "User One",
            "sub": "user-1",
          },
          "iat": 1700000000,
          "isActive": true,
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
