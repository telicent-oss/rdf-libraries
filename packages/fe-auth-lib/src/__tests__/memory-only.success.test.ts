import AuthServerOAuth2Client, {
  AuthServerOAuth2ClientConfig,
} from "../AuthServerOAuth2Client";
import { installTestEnv, resetTestEnv, signIn } from "./test-utils";

const createConfig = (
  overrides: Partial<AuthServerOAuth2ClientConfig> = {}
): AuthServerOAuth2ClientConfig => ({
  clientId: "client-1",
  authServerUrl: "https://auth.telicent.io",
  redirectUri: "http://app.telicent.localhost/callback",
  popupRedirectUri: "http://app.telicent.localhost/popup",
  scope: "openid profile",
  onLogout: jest.fn(),
  ...overrides,
});

const createFetchResponse = (jsonData: unknown): Response =>
  ({
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValue(jsonData),
  } as unknown as Response);

const sessionStorageValues = (): string =>
  JSON.stringify(Object.values(sessionStorage));

const allConsoleOutput = (): string =>
  JSON.stringify(
    (["log", "info", "warn", "error"] as const).map(
      (method) => (console[method] as jest.Mock).mock.calls
    )
  );

describe("happy path - access token held in memory only", () => {
  beforeEach(() => {
    installTestEnv();
  });

  afterEach(() => {
    resetTestEnv();
    jest.restoreAllMocks();
  });

  it("holds the login token in memory and never writes or logs it", async () => {
    const client = new AuthServerOAuth2Client(createConfig());

    await signIn(client, "SECRET_ACCESS_TOKEN");
    window.dispatchEvent(new Event("pagehide"));

    const consoleOutput = allConsoleOutput();
    expect({
      headers: client.beforeRequest().headers,
      storageHasToken: sessionStorageValues().includes("SECRET_ACCESS_TOKEN"),
      consoleHasToken: consoleOutput.includes("SECRET_ACCESS_TOKEN"),
    }).toMatchInlineSnapshot(`
      {
        "consoleHasToken": false,
        "headers": {
          "Accept": "application/json",
          "Authorization": "Bearer SECRET_ACCESS_TOKEN",
        },
        "storageHasToken": false,
      }
    `);
  });

  it("loses the token on reload and clears the legacy auth_session_id", async () => {
    sessionStorage.setItem("auth_session_id", "LEGACY_TOKEN");
    const before = new AuthServerOAuth2Client(createConfig());
    await signIn(before, "TOKEN_BEFORE_RELOAD");

    window.dispatchEvent(new Event("pagehide"));
    const after = new AuthServerOAuth2Client(createConfig());

    expect({
      headers: after.beforeRequest().headers,
      legacy: sessionStorage.getItem("auth_session_id"),
    }).toMatchInlineSnapshot(`
      {
        "headers": {
          "Accept": "application/json",
        },
        "legacy": null,
      }
    `);
  });

  it("forgets the token on logout", async () => {
    const client = new AuthServerOAuth2Client(createConfig());
    await signIn(client, "TOKEN_LOGOUT");
    globalThis.fetch = jest.fn().mockResolvedValue(createFetchResponse({}));

    await client.logout();

    expect(client.beforeRequest().headers).toMatchInlineSnapshot(`
      {
        "Accept": "application/json",
      }
    `);
  });
});
