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

const createFetchResponse = (options: {
  ok?: boolean;
  jsonData?: unknown;
}): Response =>
  ({
    ok: options.ok ?? true,
    json: jest.fn().mockResolvedValue(options.jsonData ?? {}),
  } as unknown as Response);

describe("happy path - isAuthenticated succeeds", () => {
  beforeEach(() => {
    installTestEnv();
    setWindowLocation("http://app.telicent.localhost/home");
  });

  afterEach(() => {
    resetTestEnv();
  });

  it("returns true and stores id token", async () => {
    const client = new AuthServerOAuth2Client(createConfig());
    const fetchMock = jest.fn().mockResolvedValue(
      createFetchResponse({ jsonData: { id_token: "ID_TOKEN_1" } })
    );
    globalThis.fetch = fetchMock;

    const result = await client.isAuthenticated();

    expect({
      result,
      authIdToken: sessionStorage.getItem("auth_id_token"),
      fetchUrl: fetchMock.mock.calls[0][0],
    }).toMatchInlineSnapshot(`
      {
        "authIdToken": "ID_TOKEN_1",
        "fetchUrl": "http://auth.telicent.localhost/session/check",
        "result": true,
      }
    `);
  });

  it("sends Authorization header for cross-domain session", async () => {
    const client = new AuthServerOAuth2Client(
      createConfig({ authServerUrl: "https://auth.telicent.io" })
    );
    sessionStorage.setItem("auth_session_id", "SESSION_ABC");
    const fetchMock = jest.fn().mockResolvedValue(
      createFetchResponse({ jsonData: { id_token: "ID_TOKEN_2" } })
    );
    globalThis.fetch = fetchMock;

    const result = await client.isAuthenticated();

    expect({
      result,
      headers: fetchMock.mock.calls[0][1]?.headers,
    }).toMatchInlineSnapshot(`
      {
        "headers": {
          "Accept": "application/json",
          "Authorization": "Bearer SESSION_ABC",
        },
        "result": true,
      }
    `);
  });
});
