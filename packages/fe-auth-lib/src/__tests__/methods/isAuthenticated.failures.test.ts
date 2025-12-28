import AuthServerOAuth2Client, {
  AuthServerOAuth2ClientConfig,
} from "../../AuthServerOAuth2Client";
import { installTestEnv, resetTestEnv } from "../test-utils";

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

const setWindowLocation = (href: string): void => {
  const url = new URL(href);
  Object.defineProperty(window, "location", {
    value: {
      href,
      origin: url.origin,
      search: url.search,
    },
    writable: true,
  });
};

const createFetchResponse = (options: { ok?: boolean }): Response =>
  ({
    ok: options.ok ?? false,
    json: jest.fn().mockResolvedValue({}),
  } as unknown as Response);

describe("failure path - isAuthenticated errors", () => {
  beforeEach(() => {
    installTestEnv();
    setWindowLocation("http://app.telicent.localhost/home");
  });

  afterEach(() => {
    resetTestEnv();
  });

  it("returns false when response is not ok", async () => {
    const client = new AuthServerOAuth2Client(createConfig());
    const fetchMock = jest.fn().mockResolvedValue(
      createFetchResponse({ ok: false })
    );
    globalThis.fetch = fetchMock;

    const result = await client.isAuthenticated();

    expect({ result }).toMatchInlineSnapshot(`
      {
        "result": false,
      }
    `);
  });

  it("returns false when fetch throws", async () => {
    const client = new AuthServerOAuth2Client(createConfig());
    globalThis.fetch = jest.fn().mockRejectedValue(new Error("network"));

    const result = await client.isAuthenticated();

    expect({ result }).toMatchInlineSnapshot(`
      {
        "result": false,
      }
    `);
  });
});
