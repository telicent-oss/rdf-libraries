import AuthServerOAuth2Client, {
  AuthServerOAuth2ClientConfig,
} from "../../AuthServerOAuth2Client";
import {
  installTestEnv,
  resetTestEnv,
  setCookies,
  setWindowLocation,
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

describe("happy path - getCsrfToken returns cookie token", () => {
  beforeEach(() => {
    installTestEnv();
    setWindowLocation("http://app.telicent.localhost/home");
  });

  afterEach(() => {
    resetTestEnv();
  });

  it("returns decoded csrf token for same-domain", () => {
    const client = new AuthServerOAuth2Client(createConfig());
    setCookies("XSRF-TOKEN=csrf-123");

    const result = client.getCsrfToken();

    expect({ result }).toMatchInlineSnapshot(`
      {
        "result": "csrf-123",
      }
    `);
  });
});
