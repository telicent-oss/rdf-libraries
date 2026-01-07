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
  status?: number;
  ok?: boolean;
}): Response =>
  ({
    status: options.status ?? 401,
    ok: options.ok ?? false,
  } as unknown as Response);

describe("failure path - request helpers on 401", () => {
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

  it("logs out and throws on 401 for makeAuthenticatedRequest", async () => {
    const client = new AuthServerOAuth2Client(createConfig());
    const fetchMock = jest.fn().mockResolvedValue(createFetchResponse({}));
    globalThis.fetch = fetchMock;
    jest.spyOn(client, "login").mockResolvedValue();
    const clearSpy = jest.spyOn(client, "clearLocalStorage");

    let error: Error | null = null;
    try {
      await client.makeAuthenticatedRequest("http://app.telicent.localhost/data");
    } catch (caught) {
      error = caught as Error;
    }

    expect({
      error: error?.message,
      clearCalls: clearSpy.mock.calls.length,
      loginCalls: (client.login as jest.Mock).mock.calls.length,
    }).toMatchInlineSnapshot(`
      {
        "clearCalls": 1,
        "error": "Session expired",
        "loginCalls": 1,
      }
    `);
  });

  it("warns and does not logout when skipAutoLogout is true", async () => {
    const client = new AuthServerOAuth2Client(createConfig());
    const fetchMock = jest.fn().mockResolvedValue(createFetchResponse({}));
    globalThis.fetch = fetchMock;

    const response = await client.makeAuthenticatedRequest(
      "http://app.telicent.localhost/data",
      { skipAutoLogout: true }
    );

    expect({
      status: response.status,
      warnings: (console.warn as jest.Mock).mock.calls.map((call) => call[0]),
    }).toMatchInlineSnapshot(`
      {
        "status": 401,
        "warnings": [
          "401 response during protected operation, not auto-logging out to prevent loops",
        ],
      }
    `);
  });

  it("throws on 401 for afterRequest and triggers login", () => {
    const client = new AuthServerOAuth2Client(createConfig());
    jest.spyOn(client, "login").mockResolvedValue();
    const clearSpy = jest.spyOn(client, "clearLocalStorage");
    const response = createFetchResponse({});

    let error: Error | null = null;
    try {
      client.afterRequest(
        response,
        "http://app.telicent.localhost/data"
      );
    } catch (caught) {
      error = caught as Error;
    }

    expect({
      error: error?.message,
      clearCalls: clearSpy.mock.calls.length,
      loginCalls: (client.login as jest.Mock).mock.calls.length,
    }).toMatchInlineSnapshot(`
      {
        "clearCalls": 1,
        "error": "Session expired",
        "loginCalls": 1,
      }
    `);
  });

  it("warns and does not logout when afterRequest skipAutoLogout is true", () => {
    const client = new AuthServerOAuth2Client(createConfig());
    const response = createFetchResponse({});

    const result = client.afterRequest(response, "http://app/data", {
      skipAutoLogout: true,
    });

    expect({
      status: result.status,
      warnings: (console.warn as jest.Mock).mock.calls.map((call) => call[0]),
    }).toMatchInlineSnapshot(`
      {
        "status": 401,
        "warnings": [
          "401 response during protected operation, not auto-logging out to prevent loops",
        ],
      }
    `);
  });
});
