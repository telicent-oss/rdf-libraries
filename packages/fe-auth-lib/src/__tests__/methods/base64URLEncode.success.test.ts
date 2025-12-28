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

describe("happy path - base64URLEncode", () => {
  beforeEach(() => {
    installTestEnv();
  });

  afterEach(() => {
    resetTestEnv();
  });

  it("encodes bytes to base64url", () => {
    const client = new AuthServerOAuth2Client(createConfig());
    const bytes = new Uint8Array([65, 66, 67]);

    const result = client.base64URLEncode(bytes);

    expect({ result }).toMatchInlineSnapshot(`
      {
        "result": "QUJD",
      }
    `);
  });
});
