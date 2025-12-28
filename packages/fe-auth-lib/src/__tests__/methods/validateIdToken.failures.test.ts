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

describe("failure path - validateIdToken errors", () => {
  beforeEach(() => {
    installTestEnv();
  });

  afterEach(() => {
    resetTestEnv();
  });

  it("returns false when nonce is missing", () => {
    const now = 1_700_000_000_000;
    jest.spyOn(Date, "now").mockReturnValue(now);

    const client = new AuthServerOAuth2Client(createConfig());
    const token = buildJwt({
      sub: "user-1",
      aud: "client-1",
      exp: Math.floor(now / 1000) + 300,
      iat: Math.floor(now / 1000),
      nonce: "ABC_nonce_ABC",
    });

    const result = client.validateIdToken(token);

    expect({ result }).toMatchInlineSnapshot(`
      {
        "result": false,
      }
    `);

    (Date.now as jest.Mock).mockRestore();
  });

  it("returns false when payload cannot be decoded", () => {
    const client = new AuthServerOAuth2Client(createConfig());

    const result = client.validateIdToken("not-a-jwt");

    expect({ result }).toMatchInlineSnapshot(`
      {
        "result": false,
      }
    `);
  });

  it("returns false when nonce does not match", () => {
    const now = 1_700_000_000_000;
    jest.spyOn(Date, "now").mockReturnValue(now);

    const client = new AuthServerOAuth2Client(createConfig());
    sessionStorage.setItem("oauth_nonce", "ABC_nonce_ABC");
    const token = buildJwt({
      sub: "user-1",
      aud: "client-1",
      exp: Math.floor(now / 1000) + 300,
      iat: Math.floor(now / 1000),
      nonce: "WRONG_NONCE",
    });

    const result = client.validateIdToken(token);

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
    sessionStorage.setItem("oauth_nonce", "ABC_nonce_ABC");
    const token = buildJwt({
      sub: "user-1",
      aud: "client-2",
      exp: Math.floor(now / 1000) + 300,
      iat: Math.floor(now / 1000),
      nonce: "ABC_nonce_ABC",
    });

    const result = client.validateIdToken(token);

    expect({ result }).toMatchInlineSnapshot(`
      {
        "result": false,
      }
    `);

    (Date.now as jest.Mock).mockRestore();
  });

  it("returns false for expired token", () => {
    const now = 1_700_000_000_000;
    jest.spyOn(Date, "now").mockReturnValue(now);

    const client = new AuthServerOAuth2Client(createConfig());
    sessionStorage.setItem("oauth_nonce", "ABC_nonce_ABC");
    const token = buildJwt({
      sub: "user-1",
      aud: "client-1",
      exp: Math.floor(now / 1000) - 10,
      iat: Math.floor(now / 1000) - 100,
      nonce: "ABC_nonce_ABC",
    });

    const result = client.validateIdToken(token);

    expect({ result }).toMatchInlineSnapshot(`
      {
        "result": false,
      }
    `);

    (Date.now as jest.Mock).mockRestore();
  });

  it("returns false for iat too old", () => {
    const now = 1_700_000_000_000;
    jest.spyOn(Date, "now").mockReturnValue(now);

    const client = new AuthServerOAuth2Client(createConfig());
    sessionStorage.setItem("oauth_nonce", "ABC_nonce_ABC");
    const token = buildJwt({
      sub: "user-1",
      aud: "client-1",
      exp: Math.floor(now / 1000) + 300,
      iat: Math.floor(now / 1000) - 400,
      nonce: "ABC_nonce_ABC",
    });

    const result = client.validateIdToken(token);

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

    const result = client.validateIdToken("token");

    expect({ result }).toMatchInlineSnapshot(`
      {
        "result": false,
      }
    `);
  });
});
