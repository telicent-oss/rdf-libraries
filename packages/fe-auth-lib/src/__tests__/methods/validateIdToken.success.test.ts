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

describe("happy path - validateIdToken succeeds", () => {
  beforeEach(() => {
    installTestEnv();
  });

  afterEach(() => {
    resetTestEnv();
  });

  it("returns true and clears nonce", () => {
    const now = 1_700_000_000_000;
    jest.spyOn(Date, "now").mockReturnValue(now);

    const client = new AuthServerOAuth2Client(createConfig());
    sessionStorage.setItem("oauth_nonce", "ABC_nonce_ABC");
    const token = buildJwt({
      sub: "user-1",
      aud: "client-1",
      exp: Math.floor(now / 1000) + 300,
      iat: Math.floor(now / 1000),
      nonce: "ABC_nonce_ABC",
    });

    const result = client.validateIdToken(token);

    expect({
      result,
      nonceAfter: sessionStorage.getItem("oauth_nonce"),
    }).toMatchInlineSnapshot(`
      {
        "nonceAfter": null,
        "result": true,
      }
    `);

    (Date.now as jest.Mock).mockRestore();
  });
});
