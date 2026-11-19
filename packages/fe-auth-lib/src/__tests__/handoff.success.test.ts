import AuthServerOAuth2Client, {
  AuthServerOAuth2ClientConfig,
} from "../AuthServerOAuth2Client";
import { installTestEnv, resetTestEnv } from "./test-utils";

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

const dispatchPageTransition = (
  type: "pagehide" | "pageshow",
  persisted: boolean
): void => {
  const event = new Event(type);
  Object.defineProperty(event, "persisted", { value: persisted });
  window.dispatchEvent(event);
};

describe("happy path - access token reload handoff", () => {
  beforeEach(() => {
    installTestEnv();
  });

  afterEach(() => {
    resetTestEnv();
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
});
