import AuthServerOAuth2Client, {
  AuthServerOAuth2ClientConfig,
} from "../AuthServerOAuth2Client";
import {
  holdIdToken,
  installTestEnv,
  resetTestEnv,
  signIn,
} from "./test-utils";

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

  it("holds both tokens in memory and never writes, logs or returns them", async () => {
    const client = new AuthServerOAuth2Client(createConfig());

    const callbackResult = await signIn(client, "SECRET_ACCESS_TOKEN");
    await holdIdToken(client, "SECRET_ID_TOKEN");
    window.dispatchEvent(new Event("pagehide"));

    const storage = sessionStorageValues();
    const consoleOutput = allConsoleOutput();
    expect({
      headers: client.beforeRequest().headers,
      idToken: client.getRawIdToken(),
      callbackResult,
      storageHasAccessToken: storage.includes("SECRET_ACCESS_TOKEN"),
      storageHasIdToken: storage.includes("SECRET_ID_TOKEN"),
      consoleHasAccessToken: consoleOutput.includes("SECRET_ACCESS_TOKEN"),
    }).toMatchInlineSnapshot(`
      {
        "callbackResult": {
          "isCrossDomain": true,
        },
        "consoleHasAccessToken": false,
        "headers": {
          "Accept": "application/json",
          "Authorization": "Bearer SECRET_ACCESS_TOKEN",
        },
        "idToken": "SECRET_ID_TOKEN",
        "storageHasAccessToken": false,
        "storageHasIdToken": false,
      }
    `);
  });

  it("loses both tokens on reload and clears the legacy storage keys", async () => {
    sessionStorage.setItem("auth_session_id", "LEGACY_TOKEN");
    sessionStorage.setItem("auth_id_token", "LEGACY_ID_TOKEN");
    const before = new AuthServerOAuth2Client(createConfig());
    await signIn(before, "TOKEN_BEFORE_RELOAD");
    await holdIdToken(before, "ID_TOKEN_BEFORE_RELOAD");

    window.dispatchEvent(new Event("pagehide"));
    const after = new AuthServerOAuth2Client(createConfig());

    expect({
      headers: after.beforeRequest().headers,
      idToken: after.getRawIdToken(),
      legacySessionId: sessionStorage.getItem("auth_session_id"),
      legacyIdToken: sessionStorage.getItem("auth_id_token"),
    }).toMatchInlineSnapshot(`
      {
        "headers": {
          "Accept": "application/json",
        },
        "idToken": null,
        "legacyIdToken": null,
        "legacySessionId": null,
      }
    `);
  });

  it("forgets both tokens on logout", async () => {
    const client = new AuthServerOAuth2Client(createConfig());
    await signIn(client, "TOKEN_LOGOUT");
    await holdIdToken(client, "ID_TOKEN_LOGOUT");
    globalThis.fetch = jest.fn().mockResolvedValue(createFetchResponse({}));

    await client.logout();

    expect({
      headers: client.beforeRequest().headers,
      idToken: client.getRawIdToken(),
    }).toMatchInlineSnapshot(`
      {
        "headers": {
          "Accept": "application/json",
        },
        "idToken": null,
      }
    `);
  });
});
