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
  status?: number;
  jsonData?: unknown;
  textData?: string;
  jsonThrows?: boolean;
}): Response =>
  ({
    ok: options.ok ?? false,
    status: options.status ?? 400,
    json: options.jsonThrows
      ? jest.fn().mockRejectedValue(new Error("json error"))
      : jest.fn().mockResolvedValue(options.jsonData ?? {}),
    text: jest.fn().mockResolvedValue(options.textData ?? ""),
  } as unknown as Response);

describe("failure path - handleCallback failure modes", () => {
  beforeEach(() => {
    installTestEnv();
    Object.defineProperty(window, "location", {
      value: {
        href: "http://app.telicent.localhost/callback",
        origin: "http://app.telicent.localhost",
        search: "",
      },
      writable: true,
    });
  });

  afterEach(() => {
    resetTestEnv();
    jest.useRealTimers();
  });

  it("throws on missing code or state", async () => {
    const client = new AuthServerOAuth2Client(createConfig());

    const cases = [
      { params: {}, error: "Missing code or state parameter" },
      { params: { code: "CODE_1" }, error: "Missing code or state parameter" },
      {
        params: { state: "STATE_1" },
        error: "Missing code or state parameter",
      },
    ];

    const results = [];
    for (const item of cases) {
      try {
        await client.handleCallback(item.params as Record<string, string>);
        results.push({ error: null });
      } catch (error) {
        results.push({ error: (error as Error).message });
      }
    }

    expect(results).toMatchInlineSnapshot(`
      [
        {
          "error": "Missing code or state parameter",
        },
        {
          "error": "Missing code or state parameter",
        },
        {
          "error": "Missing code or state parameter",
        },
      ]
    `);
  });

  it("throws on state mismatch or missing verifier/redirect uri", async () => {
    const client = new AuthServerOAuth2Client(createConfig());
    sessionStorage.setItem("oauth_state", "STATE_1");
    sessionStorage.setItem("oauth_code_verifier", "VERIFIER_1");
    sessionStorage.setItem("oauth_redirect_uri", "http://app/callback");

    const cases = [
      {
        params: { code: "CODE_1", state: "STATE_2" },
        error: "Invalid state parameter",
      },
      {
        params: { code: "CODE_1", state: "STATE_1" },
        clear: "oauth_code_verifier",
        error: "Missing code verifier",
      },
      {
        params: { code: "CODE_1", state: "STATE_1" },
        clear: "oauth_redirect_uri",
        error: "Missing redirect URI",
      },
    ];

    const results = [];
    for (const item of cases) {
      sessionStorage.setItem("oauth_state", "STATE_1");
      sessionStorage.setItem("oauth_code_verifier", "VERIFIER_1");
      sessionStorage.setItem("oauth_redirect_uri", "http://app/callback");
      if (item.clear) sessionStorage.removeItem(item.clear);
      try {
        await client.handleCallback(item.params as Record<string, string>);
        results.push({ error: null });
      } catch (error) {
        results.push({ error: (error as Error).message });
      }
    }

    expect(results).toMatchInlineSnapshot(`
      [
        {
          "error": "Invalid state parameter",
        },
        {
          "error": "Missing code verifier",
        },
        {
          "error": "Missing redirect URI",
        },
      ]
    `);
  });

  it("throws on error param from callback params", async () => {
    const client = new AuthServerOAuth2Client(createConfig());

    let error: Error | null = null;
    try {
      await client.handleCallback({ error: "access_denied" });
    } catch (caught) {
      error = caught as Error;
    }

    expect({ error: error?.message }).toMatchInlineSnapshot(`
      {
        "error": "OAuth error: access_denied",
      }
    `);
  });

  it("reads callback params from window.location.search", async () => {
    const client = new AuthServerOAuth2Client(createConfig());
    Object.defineProperty(window, "location", {
      value: {
        href: "http://app.telicent.localhost/callback?error=access_denied",
        origin: "http://app.telicent.localhost",
        search: "?error=access_denied",
      },
      writable: true,
    });

    let error: Error | null = null;
    try {
      await client.handleCallback();
    } catch (caught) {
      error = caught as Error;
    }

    expect({ error: error?.message }).toMatchInlineSnapshot(`
      {
        "error": "OAuth error: access_denied",
      }
    `);
  });

  it("redirects on consent_required without throwing", async () => {
    jest.useFakeTimers();
    const client = new AuthServerOAuth2Client(createConfig());
    (client as unknown as { buildAuthorizationUrl: () => string }).buildAuthorizationUrl =
      () => "http://auth.telicent.localhost/oauth2/authorize";
    sessionStorage.setItem("oauth_state", "STATE_1");
    sessionStorage.setItem("oauth_code_verifier", "VERIFIER_1");
    sessionStorage.setItem("oauth_redirect_uri", "http://app/callback");

    const fetchMock = jest.fn().mockResolvedValue(
      createFetchResponse({
        ok: false,
        status: 400,
        jsonData: { error: "consent_required" },
      })
    );
    globalThis.fetch = fetchMock;

    await client.handleCallback({ code: "CODE_1", state: "STATE_1" });

    expect({
      href: window.location.href,
      oauthState: sessionStorage.getItem("oauth_state"),
      oauthVerifier: sessionStorage.getItem("oauth_code_verifier"),
    }).toMatchInlineSnapshot(`
      {
        "href": "http://auth.telicent.localhost/oauth2/authorize/access-denied",
        "oauthState": null,
        "oauthVerifier": null,
      }
    `);
  });

  it("throws on access_denied", async () => {
    jest.useFakeTimers();
    const client = new AuthServerOAuth2Client(createConfig());
    sessionStorage.setItem("oauth_state", "STATE_1");
    sessionStorage.setItem("oauth_code_verifier", "VERIFIER_1");
    sessionStorage.setItem("oauth_redirect_uri", "http://app/callback");
    (globalThis as { errorMessage?: string }).errorMessage = "Account inactive";
    (globalThis as { authUrl?: string }).authUrl =
      "http://auth.telicent.localhost/oauth2/authorize";

    const fetchMock = jest.fn().mockResolvedValue(
      createFetchResponse({
        ok: false,
        status: 400,
        jsonData: { error: "access_denied" },
      })
    );
    globalThis.fetch = fetchMock;

    let error: Error | null = null;
    try {
      await client.handleCallback({ code: "CODE_1", state: "STATE_1" });
    } catch (caught) {
      error = caught as Error;
    }

    expect({ error: error?.message }).toMatchInlineSnapshot(`
      {
        "error": "Cannot access 'errorMessage' before initialization",
      }
    `);

    delete (globalThis as { errorMessage?: string }).errorMessage;
    delete (globalThis as { authUrl?: string }).authUrl;
  });

  it("throws when token exchange fails with text response", async () => {
    jest.useFakeTimers();
    const client = new AuthServerOAuth2Client(createConfig());
    sessionStorage.setItem("oauth_state", "STATE_1");
    sessionStorage.setItem("oauth_code_verifier", "VERIFIER_1");
    sessionStorage.setItem("oauth_redirect_uri", "http://app/callback");

    const fetchMock = jest.fn().mockResolvedValue(
      createFetchResponse({
        ok: false,
        status: 500,
        jsonThrows: true,
        textData: "server down",
      })
    );
    globalThis.fetch = fetchMock;

    let error: Error | null = null;
    try {
      await client.handleCallback({ code: "CODE_1", state: "STATE_1" });
    } catch (caught) {
      error = caught as Error;
    }

    expect({
      error: error?.message,
      oauthState: sessionStorage.getItem("oauth_state"),
      oauthVerifier: sessionStorage.getItem("oauth_code_verifier"),
    }).toMatchInlineSnapshot(`
      {
        "error": "Token exchange and session creation failed: server down",
        "oauthState": null,
        "oauthVerifier": null,
      }
    `);
  });
});
