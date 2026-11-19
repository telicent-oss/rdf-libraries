import AuthServerOAuth2Client, {
  AuthServerOAuth2ClientConfig,
} from "../AuthServerOAuth2Client";
import {
  buildJwt,
  installTestEnv,
  mockPkceValues,
  resetTestEnv,
} from "./test-utils";

const HANDOFF_KEY = "auth_access_token_handoff";

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

const dispatchPageTransition = (
  type: "pagehide" | "pageshow",
  persisted: boolean
): void => {
  const event = new Event(type);
  Object.defineProperty(event, "persisted", { value: persisted });
  window.dispatchEvent(event);
};

const allConsoleOutput = (): string =>
  JSON.stringify(
    (["log", "info", "warn", "error"] as const).map(
      (method) => (console[method] as jest.Mock).mock.calls
    )
  );

describe("happy path - access token reload handoff", () => {
  beforeEach(() => {
    installTestEnv();
  });

  afterEach(() => {
    resetTestEnv();
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it("takes over the handoff token and leaves no credential in sessionStorage", () => {
    sessionStorage.setItem(HANDOFF_KEY, "TOKEN_RELOAD");
    sessionStorage.setItem("auth_session_id", "LEGACY_TOKEN");

    const client = new AuthServerOAuth2Client(createConfig());

    expect({
      handoff: sessionStorage.getItem(HANDOFF_KEY),
      legacy: sessionStorage.getItem("auth_session_id"),
      headers: client.beforeRequest().headers,
    }).toMatchInlineSnapshot(`
      {
        "handoff": null,
        "headers": {
          "Accept": "application/json",
          "Authorization": "Bearer TOKEN_RELOAD",
        },
        "legacy": null,
      }
    `);
  });

  it("writes the handoff key on pagehide", () => {
    sessionStorage.setItem(HANDOFF_KEY, "TOKEN_PAGEHIDE");
    new AuthServerOAuth2Client(createConfig());
    const beforePagehide = sessionStorage.getItem(HANDOFF_KEY);

    dispatchPageTransition("pagehide", false);

    expect({
      beforePagehide,
      afterPagehide: sessionStorage.getItem(HANDOFF_KEY),
    }).toMatchInlineSnapshot(`
      {
        "afterPagehide": "TOKEN_PAGEHIDE",
        "beforePagehide": null,
      }
    `);
  });

  it("drops the handoff copy when the page is restored from the back/forward cache", () => {
    sessionStorage.setItem(HANDOFF_KEY, "TOKEN_BFCACHE");
    const client = new AuthServerOAuth2Client(createConfig());

    dispatchPageTransition("pagehide", true);
    const afterPagehide = sessionStorage.getItem(HANDOFF_KEY);
    dispatchPageTransition("pageshow", true);

    expect({
      afterPagehide,
      afterPageshow: sessionStorage.getItem(HANDOFF_KEY),
      headers: client.beforeRequest().headers,
    }).toMatchInlineSnapshot(`
      {
        "afterPagehide": "TOKEN_BFCACHE",
        "afterPageshow": null,
        "headers": {
          "Accept": "application/json",
          "Authorization": "Bearer TOKEN_BFCACHE",
        },
      }
    `);
  });

  it("forgets the token on logout so pagehide hands nothing on", async () => {
    sessionStorage.setItem(HANDOFF_KEY, "TOKEN_LOGOUT");
    const client = new AuthServerOAuth2Client(createConfig());
    globalThis.fetch = jest.fn().mockResolvedValue(createFetchResponse({}));

    await client.logout();
    dispatchPageTransition("pagehide", false);

    expect({
      handoff: sessionStorage.getItem(HANDOFF_KEY),
      headers: client.beforeRequest().headers,
    }).toMatchInlineSnapshot(`
      {
        "handoff": null,
        "headers": {
          "Accept": "application/json",
        },
      }
    `);
  });

  it("holds the login token in memory, preferring access_token, and never logs it", async () => {
    jest.useFakeTimers();
    const now = 1_700_000_000_000;
    jest.spyOn(Date, "now").mockReturnValue(now);

    const client = new AuthServerOAuth2Client(createConfig());
    mockPkceValues(client, {
      state: "ABC_state_ABC",
      nonce: "ABC_nonce_ABC",
      codeVerifier: "ABC_codeVerifier_ABC",
    });
    sessionStorage.setItem("oauth_state", "ABC_state_ABC");
    sessionStorage.setItem("oauth_nonce", "ABC_nonce_ABC");
    sessionStorage.setItem("oauth_code_verifier", "ABC_codeVerifier_ABC");
    sessionStorage.setItem(
      "oauth_redirect_uri",
      "http://app.telicent.localhost/callback"
    );

    const idToken = buildJwt({
      sub: "user-1",
      aud: "client-1",
      exp: Math.floor(now / 1000) + 300,
      iat: Math.floor(now / 1000),
      nonce: "ABC_nonce_ABC",
      iss: "https://auth.telicent.io",
      jti: "id-1",
    });
    globalThis.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        createFetchResponse({
          isCrossDomain: true,
          access_token: "SECRET_ACCESS_TOKEN",
          sessionToken: "SECRET_SESSION_TOKEN",
        })
      )
      .mockResolvedValueOnce(createFetchResponse({ id_token: idToken }));

    const promise = client.handleCallback({
      code: "CODE_123",
      state: "ABC_state_ABC",
    });
    await jest.advanceTimersByTimeAsync(100);
    await promise;

    const consoleOutput = allConsoleOutput();
    expect({
      headers: client.beforeRequest().headers,
      storedKeys: Object.keys(sessionStorage),
      consoleHasAccessToken: consoleOutput.includes("SECRET_ACCESS_TOKEN"),
      consoleHasSessionToken: consoleOutput.includes("SECRET_SESSION_TOKEN"),
    }).toMatchInlineSnapshot(`
      {
        "consoleHasAccessToken": false,
        "consoleHasSessionToken": false,
        "headers": {
          "Accept": "application/json",
          "Authorization": "Bearer SECRET_ACCESS_TOKEN",
        },
        "storedKeys": [
          "oauth_redirect_uri",
          "auth_id_token",
        ],
      }
    `);
  });
});
