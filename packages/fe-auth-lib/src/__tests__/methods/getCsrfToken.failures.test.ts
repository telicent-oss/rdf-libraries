import AuthServerOAuth2Client, {
  AuthServerOAuth2ClientConfig,
} from "../../AuthServerOAuth2Client";
import { installTestEnv, resetTestEnv, setWindowLocation } from "../test-utils";

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

describe("failure path - getCsrfToken errors", () => {
  beforeEach(() => {
    installTestEnv();
  });

  afterEach(() => {
    resetTestEnv();
  });

  it("returns null for cross-domain clients", () => {
    setWindowLocation("http://app.telicent.localhost/home");
    const client = new AuthServerOAuth2Client(
      createConfig({ authServerUrl: "https://auth.telicent.io" })
    );

    const result = client.getCsrfToken();

    expect({ result }).toMatchInlineSnapshot(`
      {
        "result": null,
      }
    `);
  });

  it("returns null when cookie is missing", () => {
    setWindowLocation("http://app.telicent.localhost/home");
    const client = new AuthServerOAuth2Client(createConfig());

    const result = client.getCsrfToken();

    expect({ result }).toMatchInlineSnapshot(`
      {
        "result": null,
      }
    `);
  });
});
