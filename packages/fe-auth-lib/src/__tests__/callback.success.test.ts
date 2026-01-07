import AuthServerOAuth2Client, {
  AuthServerOAuth2ClientConfig,
} from "../AuthServerOAuth2Client";
import {
  buildJwt,
  installTestEnv,
  mockPkceValues,
  resetTestEnv,
  setWindowLocation,
} from "./test-utils";

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
}): Response =>
  ({
    ok: options.ok ?? true,
    status: options.status ?? 200,
    json: jest.fn().mockResolvedValue(options.jsonData ?? {}),
    text: jest.fn().mockResolvedValue(options.textData ?? ""),
  } as unknown as Response);

const matchedNonce = "✅ MATCHED nonce";
const mismatchedNonces = {
  stored: "❌ 🍎 MIS-matched nonce",
  token: "❌ 🍌 MIS-matched nonce",
};

describe("happy path - handleCallback stores session and id token", () => {
  beforeEach(() => {
    installTestEnv();
    setWindowLocation("http://app.telicent.localhost/home");
  });

  afterEach(() => {
    resetTestEnv();
    jest.useRealTimers();
  });

  it("stores session and id token for cross-domain session", async () => {
    jest.useFakeTimers();
    const now = 1_700_000_000_000;
    jest.spyOn(Date, "now").mockReturnValue(now);

    const client = new AuthServerOAuth2Client(
      createConfig({ authServerUrl: "https://auth.telicent.io" })
    );
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
      email: "user@example.com",
      preferred_name: "User One",
      iss: "https://auth.telicent.io",
      jti: "id-1",
    });

    const fetchMock = jest.fn();
    fetchMock
      .mockResolvedValueOnce(
        createFetchResponse({
          jsonData: {
            isCrossDomain: true,
            sessionToken: "SESSION_123",
            user: "user-1",
          },
        })
      )
      .mockResolvedValueOnce(
        createFetchResponse({
          jsonData: { id_token: idToken },
        })
      );

    globalThis.fetch = fetchMock;

    const promise = client.handleCallback({
      code: "CODE_123",
      state: "ABC_state_ABC",
    });
    await jest.advanceTimersByTimeAsync(100);
    const sessionData = await promise;

    expect({
      sessionData,
      storage: {
        authSessionId: sessionStorage.getItem("auth_session_id"),
        authIdToken: sessionStorage.getItem("auth_id_token"),
        oauthState: sessionStorage.getItem("oauth_state"),
        oauthCodeVerifier: sessionStorage.getItem("oauth_code_verifier"),
        oauthNonce: sessionStorage.getItem("oauth_nonce"),
      },
      fetchCalls: fetchMock.mock.calls.map((call) => call[0]),
    }).toMatchInlineSnapshot(`
      {
        "fetchCalls": [
          "https://auth.telicent.io/oauth2/token",
          "https://auth.telicent.io/session/idtoken",
        ],
        "sessionData": {
          "isCrossDomain": true,
          "sessionToken": "SESSION_123",
          "user": "user-1",
        },
        "storage": {
          "authIdToken": "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ1c2VyLTEiLCJhdWQiOiJjbGllbnQtMSIsImV4cCI6MTcwMDAwMDMwMCwiaWF0IjoxNzAwMDAwMDAwLCJub25jZSI6IkFCQ19ub25jZV9BQkMiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJwcmVmZXJyZWRfbmFtZSI6IlVzZXIgT25lIiwiaXNzIjoiaHR0cHM6Ly9hdXRoLnRlbGljZW50LmlvIiwianRpIjoiaWQtMSJ9.",
          "authSessionId": "SESSION_123",
          "oauthCodeVerifier": null,
          "oauthNonce": null,
          "oauthState": null,
        },
      }
    `);

    (Date.now as jest.Mock).mockRestore();
  });

  it("completes callback when id token response is not ok (500 status)", async () => {
    jest.useFakeTimers();

    const client = new AuthServerOAuth2Client(createConfig());

    mockPkceValues(client, {
      state: "ABC_state_ABC",
      nonce: matchedNonce,
      codeVerifier: "ABC_codeVerifier_ABC",
    });

    sessionStorage.setItem("oauth_state", "ABC_state_ABC");
    sessionStorage.setItem("oauth_nonce", matchedNonce);
    sessionStorage.setItem("oauth_code_verifier", "ABC_codeVerifier_ABC");
    sessionStorage.setItem(
      "oauth_redirect_uri",
      "http://app.telicent.localhost/callback"
    );

    const fetchMock = jest.fn();
    fetchMock
      .mockResolvedValueOnce(
        createFetchResponse({
          jsonData: { isCrossDomain: false, user: "user-1" },
        })
      )
      .mockResolvedValueOnce(
        createFetchResponse({
          ok: false,
          status: 500,
          jsonData: { error: "server_error" },
        })
      );
    globalThis.fetch = fetchMock;

    const promise = client.handleCallback({
      code: "CODE_123",
      state: "ABC_state_ABC",
    });
    await jest.advanceTimersByTimeAsync(100);
    const sessionData = await promise;

    expect({
      sessionData,
      storage: {
        authSessionId: sessionStorage.getItem("auth_session_id"),
        authIdToken: sessionStorage.getItem("auth_id_token"),
        oauthState: sessionStorage.getItem("oauth_state"),
        oauthCodeVerifier: sessionStorage.getItem("oauth_code_verifier"),
        oauthNonce: sessionStorage.getItem("oauth_nonce"),
      },
    }).toMatchInlineSnapshot(`
      {
        "sessionData": {
          "isCrossDomain": false,
          "user": "user-1",
        },
        "storage": {
          "authIdToken": null,
          "authSessionId": null,
          "oauthCodeVerifier": null,
          "oauthNonce": "✅ MATCHED nonce",
          "oauthState": null,
        },
      }
    `);
  });

  it("stores id token without cross-domain session id", async () => {
    jest.useFakeTimers();
    const now = 1_700_000_100_000;
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
      sub: "user-2",
      aud: "client-1",
      exp: Math.floor(now / 1000) + 300,
      iat: Math.floor(now / 1000),
      nonce: "ABC_nonce_ABC",
      email: "user2@example.com",
      preferred_name: "User Two",
      iss: "http://auth.telicent.localhost",
      jti: "id-2",
    });

    const fetchMock = jest.fn();
    fetchMock
      .mockResolvedValueOnce(
        createFetchResponse({
          jsonData: {
            isCrossDomain: true,
            sessionToken: "SESSION_456",
            user: "user-2",
          },
        })
      )
      .mockResolvedValueOnce(
        createFetchResponse({
          jsonData: { id_token: idToken },
        })
      );
    globalThis.fetch = fetchMock;

    const promise = client.handleCallback({
      code: "CODE_456",
      state: "ABC_state_ABC",
    });
    await jest.advanceTimersByTimeAsync(100);
    const sessionData = await promise;

    expect({
      sessionData,
      storage: {
        authSessionId: sessionStorage.getItem("auth_session_id"),
        authIdToken: sessionStorage.getItem("auth_id_token"),
      },
    }).toMatchInlineSnapshot(`
      {
        "sessionData": {
          "isCrossDomain": true,
          "sessionToken": "SESSION_456",
          "user": "user-2",
        },
        "storage": {
          "authIdToken": "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ1c2VyLTIiLCJhdWQiOiJjbGllbnQtMSIsImV4cCI6MTcwMDAwMDQwMCwiaWF0IjoxNzAwMDAwMTAwLCJub25jZSI6IkFCQ19ub25jZV9BQkMiLCJlbWFpbCI6InVzZXIyQGV4YW1wbGUuY29tIiwicHJlZmVycmVkX25hbWUiOiJVc2VyIFR3byIsImlzcyI6Imh0dHA6Ly9hdXRoLnRlbGljZW50LmxvY2FsaG9zdCIsImp0aSI6ImlkLTIifQ.",
          "authSessionId": null,
        },
      }
    `);

    (Date.now as jest.Mock).mockRestore();
  });

  it("warns when id token validation fails (nonce mismatch)", async () => {
    jest.useFakeTimers();
    const now = 1_700_000_200_000;
    jest.spyOn(Date, "now").mockReturnValue(now);

    const client = new AuthServerOAuth2Client(createConfig());
    mockPkceValues(client, {
      state: "ABC_state_ABC",
      nonce: mismatchedNonces.stored,
      codeVerifier: "ABC_codeVerifier_ABC",
    });

    sessionStorage.setItem("oauth_state", "ABC_state_ABC");
    sessionStorage.setItem("oauth_nonce", mismatchedNonces.stored);
    sessionStorage.setItem("oauth_code_verifier", "ABC_codeVerifier_ABC");
    sessionStorage.setItem(
      "oauth_redirect_uri",
      "http://app.telicent.localhost/callback"
    );

    const nonceMismatchIdToken = buildJwt({
      sub: "user-3",
      aud: "client-1",
      exp: Math.floor(now / 1000) + 300,
      iat: Math.floor(now / 1000),
      nonce: mismatchedNonces.token,
      email: "user3@example.com",
      preferred_name: "User Three",
      iss: "http://auth.telicent.localhost",
      jti: "id-3",
    });

    const fetchMock = jest.fn().mockResolvedValue(
      createFetchResponse({
        jsonData: { isCrossDomain: false, user: "user-3" },
      })
    );
    globalThis.fetch = fetchMock;
    jest
      .spyOn(client, "makeAuthenticatedRequest")
      .mockResolvedValue(
        createFetchResponse({ jsonData: { id_token: nonceMismatchIdToken } })
      );

    const promise = client.handleCallback({
      code: "CODE_789",
      state: "ABC_state_ABC",
    });
    await jest.advanceTimersByTimeAsync(100);
    await promise;

    expect({
      reason: mismatchedNonces,
      warnings: (console.warn as jest.Mock).mock.calls.map((call) => call[0]),
    }).toMatchInlineSnapshot(`
      {
        "reason": {
          "stored": "❌ 🍎 MIS-matched nonce",
          "token": "❌ 🍌 MIS-matched nonce",
        },
        "warnings": [
          "ID token validation failed, but continuing with callback",
        ],
      }
    `);

    (Date.now as jest.Mock).mockRestore();
  });

  it("warns when id token retrieval throws", async () => {
    jest.useFakeTimers();

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

    const fetchMock = jest.fn().mockResolvedValue(
      createFetchResponse({
        jsonData: { isCrossDomain: false, user: "user-4" },
      })
    );
    globalThis.fetch = fetchMock;
    jest
      .spyOn(client, "makeAuthenticatedRequest")
      .mockRejectedValue(new Error("id token fetch failed"));

    const promise = client.handleCallback({
      code: "CODE_456",
      state: "ABC_state_ABC",
    });
    await jest.advanceTimersByTimeAsync(100);
    await promise;

    expect({
      warnings: (console.warn as jest.Mock).mock.calls.map((call) => call[0]),
    }).toMatchInlineSnapshot(`
      {
        "warnings": [
          "Error retrieving ID token during callback, but continuing:",
        ],
      }
    `);
  });
});
