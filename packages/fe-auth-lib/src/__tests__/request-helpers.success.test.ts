import AuthServerOAuth2Client, {
  AuthServerOAuth2ClientConfig,
} from "../AuthServerOAuth2Client";
import { installTestEnv, resetTestEnv, setCookies } from "./test-utils";

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
  status?: number;
  ok?: boolean;
}): Response =>
  ({
    status: options.status ?? 200,
    ok: options.ok ?? true,
  } as unknown as Response);

describe("happy path - request helpers add auth headers", () => {
  beforeEach(() => {
    installTestEnv();
    Object.defineProperty(window, "location", {
      value: {
        href: "http://app.telicent.localhost/home",
        origin: "http://app.telicent.localhost",
        search: "",
      },
      writable: true,
    });
  });

  afterEach(() => {
    resetTestEnv();
  });

  it("adds Authorization header for cross-domain requests", async () => {
    const client = new AuthServerOAuth2Client(
      createConfig({ authServerUrl: "https://auth.telicent.io" })
    );
    sessionStorage.setItem("auth_session_id", "SESSION_123");
    const fetchMock = jest.fn().mockResolvedValue(createFetchResponse({}));
    globalThis.fetch = fetchMock;

    await client.makeAuthenticatedRequest("https://api.telicent.io/data");

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

  it("adds CSRF token for same-domain state-changing requests", async () => {
    const client = new AuthServerOAuth2Client(createConfig());
    setCookies("XSRF-TOKEN=csrf-123");
    const fetchMock = jest.fn().mockResolvedValue(createFetchResponse({}));
    globalThis.fetch = fetchMock;

    await client.makeAuthenticatedRequest(
      "http://auth.telicent.localhost/data",
      { method: "POST" }
    );

    expect({
      headers: fetchMock.mock.calls[0][1]?.headers,
    }).toMatchInlineSnapshot(`
      {
        "headers": {
          "Accept": "application/json",
          "X-XSRF-TOKEN": "csrf-123",
        },
      }
    `);
  });

  it("prepares request headers for cross-domain and same-domain", () => {
    const crossDomainClient = new AuthServerOAuth2Client(
      createConfig({ authServerUrl: "https://auth.telicent.io" })
    );
    const sameDomainClient = new AuthServerOAuth2Client(createConfig());
    sessionStorage.setItem("auth_session_id", "SESSION_ABC");
    setCookies("XSRF-TOKEN=csrf-456");

    const crossHeaders = crossDomainClient.beforeRequest().headers;
    const sameHeaders = sameDomainClient.beforeRequest({
      method: "DELETE",
    }).headers;

    expect({
      crossHeaders,
      sameHeaders,
    }).toMatchInlineSnapshot(`
      {
        "crossHeaders": {
          "Accept": "application/json",
          "Authorization": "Bearer SESSION_ABC",
        },
        "sameHeaders": {
          "Accept": "application/json",
          "X-XSRF-TOKEN": "csrf-456",
        },
      }
    `);
  });

  it("returns response from afterRequest on allowed 401", () => {
    const client = new AuthServerOAuth2Client(createConfig());
    const response = createFetchResponse({ status: 401, ok: false });

    const result = client.afterRequest(
      response,
      "http://auth.telicent.localhost/session/check"
    );

    expect({ result }).toMatchInlineSnapshot(`
      {
        "result": {
          "ok": false,
          "status": 401,
        },
      }
    `);
  });
});
