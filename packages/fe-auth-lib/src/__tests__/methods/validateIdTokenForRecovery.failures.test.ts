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

describe("failure path - validateIdTokenForRecovery errors", () => {
  beforeEach(() => {
    installTestEnv();
  });

  afterEach(() => {
    resetTestEnv();
  });

  it("returns false for expired token", () => {
    const now = 1_700_000_000_000;
    jest.spyOn(Date, "now").mockReturnValue(now);

    const client = new AuthServerOAuth2Client(createConfig());
    const token = buildJwt({
      sub: "user-1",
      aud: "client-1",
      exp: Math.floor(now / 1000) - 10,
      iat: Math.floor(now / 1000) - 3600,
    });

    const result = client.validateIdTokenForRecovery(token);

    expect({ result }).toMatchInlineSnapshot(`
      {
        "result": false,
      }
    `);

    (Date.now as jest.Mock).mockRestore();
  });

  it("returns false when payload cannot be decoded", () => {
    const client = new AuthServerOAuth2Client(createConfig());
    const result = client.validateIdTokenForRecovery("not-a-jwt");

    expect({ result }).toMatchInlineSnapshot(`
      {
        "result": false,
      }
    `);
  });

  it("returns false when iat is too old", () => {
    const now = 1_700_000_000_000;
    jest.spyOn(Date, "now").mockReturnValue(now);

    const client = new AuthServerOAuth2Client(createConfig());
    const token = buildJwt({
      sub: "user-1",
      aud: "client-1",
      exp: Math.floor(now / 1000) + 300,
      iat: Math.floor(now / 1000) - 7200,
    });

    const result = client.validateIdTokenForRecovery(token);

    expect({ result }).toMatchInlineSnapshot(`
      {
        "result": false,
      }
    `);

    (Date.now as jest.Mock).mockRestore();
  });

  it("returns false for audience mismatch", () => {
    const now = 1_700_000_000_000;
    jest.spyOn(Date, "now").mockReturnValue(now);

    const client = new AuthServerOAuth2Client(createConfig());
    const token = buildJwt({
      sub: "user-1",
      aud: "client-2",
      exp: Math.floor(now / 1000) + 300,
      iat: Math.floor(now / 1000),
    });

    const result = client.validateIdTokenForRecovery(token);

    expect({ result }).toMatchInlineSnapshot(`
      {
        "result": false,
      }
    `);

    (Date.now as jest.Mock).mockRestore();
  });

  it("returns false when decodeJWT throws", () => {
    const client = new AuthServerOAuth2Client(createConfig());
    jest.spyOn(client, "decodeJWT").mockImplementation(() => {
      throw new Error("decode failed");
    });

    const result = client.validateIdTokenForRecovery("token");

    expect({ result }).toMatchInlineSnapshot(`
      {
        "result": false,
      }
    `);
  });
});
