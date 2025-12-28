import AuthServerOAuth2Client, {
  AuthServerOAuth2ClientConfig,
} from "../AuthServerOAuth2Client";
import { installTestEnv, resetTestEnv } from "./test-utils";

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

const createFetchResponse = (options: {
  ok?: boolean;
  jsonData?: unknown;
}): Response =>
  ({
    ok: options.ok ?? true,
    json: jest.fn().mockResolvedValue(options.jsonData ?? {}),
  } as unknown as Response);

describe("happy path - logout flows", () => {
  beforeEach(() => {
    installTestEnv();
  });

  afterEach(() => {
    resetTestEnv();
  });

  it("handles external logout redirect", async () => {
    const client = new AuthServerOAuth2Client(createConfig());
    const fetchMock = jest.fn().mockResolvedValue(
      createFetchResponse({
        jsonData: {
          external_logout: true,
          logout_url: "https://idp.example.com/logout",
        },
      })
    );
    globalThis.fetch = fetchMock;

    await client.logout();

    expect({
      location: window.location.href,
      onLogoutCalls: (client.config.onLogout as jest.Mock).mock.calls.length,
    }).toMatchInlineSnapshot(`
      {
        "location": "http://localhost/",
        "onLogoutCalls": 0,
      }
    `);
  });

  it("includes Authorization header for cross-domain logout", async () => {
    const client = new AuthServerOAuth2Client(
      createConfig({ authServerUrl: "https://auth.telicent.io" })
    );
    sessionStorage.setItem("auth_session_id", "SESSION_123");
    const fetchMock = jest.fn().mockResolvedValue(
      createFetchResponse({ jsonData: {} })
    );
    globalThis.fetch = fetchMock;

    await client.logout();

    expect({
      headers: fetchMock.mock.calls[0][1]?.headers,
    }).toMatchInlineSnapshot(`
      {
        "headers": {
          "Accept": "application/json",
          "Authorization": "Bearer SESSION_123",
        },
      }
    `);
  });

  it("continues logout when response is not json", async () => {
    const onLogout = jest.fn();
    const client = new AuthServerOAuth2Client(createConfig({ onLogout }));
    const fetchMock = jest.fn().mockResolvedValue(
      ({
        ok: true,
        json: jest.fn().mockRejectedValue(new Error("bad json")),
      } as unknown as Response)
    );
    globalThis.fetch = fetchMock;

    await client.logout();

    expect({
      onLogoutCalls: onLogout.mock.calls.length,
      warnings: (console.warn as jest.Mock).mock.calls.map((call) => call[0]),
    }).toMatchInlineSnapshot(`
      {
        "onLogoutCalls": 1,
        "warnings": [
          "Logout response is not JSON, continuing with standard logout",
        ],
      }
    `);
  });

  it("continues logout when fetch throws", async () => {
    const onLogout = jest.fn();
    const client = new AuthServerOAuth2Client(createConfig({ onLogout }));
    globalThis.fetch = jest.fn().mockRejectedValue(new Error("network"));

    await client.logout();

    expect({
      onLogoutCalls: onLogout.mock.calls.length,
      errors: (console.error as jest.Mock).mock.calls.map((call) => call[0]),
    }).toMatchInlineSnapshot(`
      {
        "errors": [
          "Logout error (ignoring):",
        ],
        "onLogoutCalls": 1,
      }
    `);
  });

  it("calls onLogout on standard logout", async () => {
    const onLogout = jest.fn();
    const client = new AuthServerOAuth2Client(createConfig({ onLogout }));
    const fetchMock = jest.fn().mockResolvedValue(
      createFetchResponse({
        jsonData: {},
      })
    );
    globalThis.fetch = fetchMock;

    await client.logout();

    expect({
      onLogoutCalls: onLogout.mock.calls.length,
    }).toMatchInlineSnapshot(`
      {
        "onLogoutCalls": 1,
      }
    `);
  });
});
