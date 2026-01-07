import AuthServerOAuth2Client, {
  AuthServerOAuth2ClientConfig,
} from "../../AuthServerOAuth2Client";
import {
  installCryptoMock,
  installTestEnv,
  resetTestEnv,
} from "../test-utils";

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

describe("happy path - generateCodeChallenge", () => {
  beforeEach(() => {
    installTestEnv();
    installCryptoMock({ digestBytes: [65, 66, 67] });
  });

  afterEach(() => {
    resetTestEnv();
  });

  it("returns challenge", async () => {
    const client = new AuthServerOAuth2Client(createConfig());

    const result = await client.generateCodeChallenge("VERIFIER");

    expect({ result }).toMatchInlineSnapshot(`
      {
        "result": "QUJD",
      }
    `);
  });
});
