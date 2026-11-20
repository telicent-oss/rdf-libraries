import AuthServerOAuth2Client, {
  AuthServerOAuth2ClientConfig,
} from "../../AuthServerOAuth2Client";
import { buildJwt, installTestEnv, resetTestEnv, holdIdToken } from "../test-utils";

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

describe("failure path - isIdTokenExpired errors", () => {
  beforeEach(() => {
    installTestEnv();
  });

  afterEach(() => {
    resetTestEnv();
  });

  it("returns true when token is missing", () => {
    const client = new AuthServerOAuth2Client(createConfig());

    const result = client.isIdTokenExpired();

    expect({ result }).toMatchInlineSnapshot(`
      {
        "result": true,
      }
    `);
  });

  it("returns true for expired token", async () => {
    const now = 1_700_000_000_000;
    jest.spyOn(Date, "now").mockReturnValue(now);

    const client = new AuthServerOAuth2Client(createConfig());
    const token = buildJwt({
      sub: "user-1",
      aud: "client-1",
      exp: Math.floor(now / 1000) - 10,
    });
    await holdIdToken(client, token);

    const result = client.isIdTokenExpired();

    expect({ result }).toMatchInlineSnapshot(`
      {
        "result": true,
      }
    `);

    (Date.now as jest.Mock).mockRestore();
  });

  it("returns true when decodeJWT throws", async () => {
    const client = new AuthServerOAuth2Client(createConfig());
    await holdIdToken(client, "TOKEN");
    jest.spyOn(client, "decodeJWT").mockImplementation(() => {
      throw new Error("decode failed");
    });

    const result = client.isIdTokenExpired();

    expect({ result }).toMatchInlineSnapshot(`
      {
        "result": true,
      }
    `);
  });
});
