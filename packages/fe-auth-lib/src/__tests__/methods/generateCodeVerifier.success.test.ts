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

describe("happy path - generateCodeVerifier", () => {
  beforeEach(() => {
    installTestEnv();
    installCryptoMock({ fillByte: 65 });
  });

  afterEach(() => {
    resetTestEnv();
  });

  it("returns verifier", () => {
    const client = new AuthServerOAuth2Client(createConfig());

    const result = client.generateCodeVerifier();

    expect({ result }).toMatchInlineSnapshot(`
      {
        "result": "QUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUE",
      }
    `);
  });
});
