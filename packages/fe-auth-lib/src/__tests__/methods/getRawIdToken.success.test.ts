import AuthServerOAuth2Client, {
  AuthServerOAuth2ClientConfig,
} from "../../AuthServerOAuth2Client";
import { installTestEnv, resetTestEnv } from "../test-utils";

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

describe("happy path - getRawIdToken returns stored token", () => {
  beforeEach(() => {
    installTestEnv();
  });

  afterEach(() => {
    resetTestEnv();
  });

  it("returns auth_id_token from storage", () => {
    const client = new AuthServerOAuth2Client(createConfig());
    sessionStorage.setItem("auth_id_token", "RAW_TOKEN");

    const result = client.getRawIdToken();

    expect({ result }).toMatchInlineSnapshot(`
      {
        "result": "RAW_TOKEN",
      }
    `);
  });
});
