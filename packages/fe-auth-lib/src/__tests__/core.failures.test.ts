import AuthServerOAuth2Client, {
  AuthServerOAuth2ClientConfig,
} from "../AuthServerOAuth2Client";
import { installTestEnv, resetTestEnv, setWindowLocation } from "./test-utils";

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

describe("failure path - validation failures and edge handling", () => {
  beforeEach(() => {
    installTestEnv();
    setWindowLocation("http://app.telicent.localhost/home");
  });

  afterEach(() => {
    resetTestEnv();
  });

  it("throws on invalid config and logs details", () => {
    let error: Error | null = null;
    try {
      new AuthServerOAuth2Client(createConfig({ authServerUrl: "not-a-url" }));
    } catch (caught) {
      error = caught as Error;
    }

    const errorCalls = (console.error as jest.Mock).mock.calls;

    expect({
      error: error?.message,
      consoleError: errorCalls.map((call) => call[0]),
    }).toMatchInlineSnapshot(`
      {
        "consoleError": [
          "❌ Invalid AuthServerOAuth2Client configuration:",
        ],
        "error": "Invalid AuthServerOAuth2Client configuration: [
        {
          "validation": "url",
          "code": "invalid_string",
          "message": "Invalid url",
          "path": [
            "authServerUrl"
          ]
        }
      ]",
      }
    `);
  });

  it("returns early when config is undefined", () => {
    const client = new (AuthServerOAuth2Client as unknown as new (
      config?: AuthServerOAuth2ClientConfig
    ) => AuthServerOAuth2Client)(undefined);

    const warnCalls = (console.warn as jest.Mock).mock.calls;

    expect({
      config: (client as AuthServerOAuth2Client).config,
      isCrossDomain: (client as AuthServerOAuth2Client).isCrossDomain,
      consoleWarn: warnCalls.map((call) => call[0]),
    }).toMatchInlineSnapshot(`
      {
        "config": undefined,
        "consoleWarn": [
          "⚠️ AuthServerOAuth2Client instantiated with undefined config",
        ],
        "isCrossDomain": undefined,
      }
    `);
  });

  it("defaults to cross-domain when window origin is invalid", () => {
    Object.defineProperty(window, "location", {
      value: { origin: "not-a-url" },
      writable: true,
    });

    const client = new AuthServerOAuth2Client(createConfig());
    const warnCalls = (console.warn as jest.Mock).mock.calls;

    expect({
      isCrossDomain: client.isCrossDomain,
      consoleWarn: warnCalls.map((call) => call[0]),
    }).toMatchInlineSnapshot(`
      {
        "consoleWarn": [
          "Error detecting domain context, defaulting to cross-domain:",
        ],
        "isCrossDomain": true,
      }
    `);
  });

  it("requires popup redirect uri for popup login", async () => {
    const client = new AuthServerOAuth2Client(createConfig());
    (client.config as { popupRedirectUri?: string }).popupRedirectUri =
      undefined;

    let error: Error | null = null;
    try {
      await client.loginWithPopup();
    } catch (caught) {
      error = caught as Error;
    }

    expect({ error: error?.message }).toMatchInlineSnapshot(`
      {
        "error": "redirectUri is required for popup login. Either provide it as a parameter or configure popupRedirectUri in the client config.",
      }
    `);
  });
});
