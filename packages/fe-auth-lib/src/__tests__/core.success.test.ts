import AuthServerOAuth2Client, {
  AuthServerOAuth2ClientConfig,
} from "../AuthServerOAuth2Client";
import {
  installTestEnv,
  mockPkceValues,
  resetTestEnv,
  setWindowLocation,
} from "./test-utils";

const createConfig = (
  overrides: Partial<AuthServerOAuth2ClientConfig> = {}
) => ({
  clientId: "client-1",
  authServerUrl: "http://auth.telicent.localhost",
  redirectUri: "http://app.telicent.localhost/callback",
  popupRedirectUri: "http://app.telicent.localhost/popup",
  scope: "openid profile",
  onLogout: jest.fn(),
  ...overrides,
});

describe("happy path - constructor, domain detection, pkce, and login", () => {
  beforeEach(() => {
    installTestEnv();
    setWindowLocation("http://app.telicent.localhost/home");
  });

  afterEach(() => {
    resetTestEnv();
  });

  it("constructs client and detects same-domain", () => {
    const client = new AuthServerOAuth2Client(createConfig());

    expect({
      clientId: client.config.clientId,
      isCrossDomain: client.isCrossDomain,
    }).toMatchInlineSnapshot(`
      {
        "clientId": "client-1",
        "isCrossDomain": false,
      }
    `);
  });

  it("detects domains across common cases", () => {
    const cases = [
      {
        current: "http://localhost",
        authServerUrl: "http://localhost",
      },
      {
        current: "http://app.telicent.localhost",
        authServerUrl: "http://auth.telicent.localhost",
      },
      {
        current: "http://localhost:3000",
        authServerUrl: "https://dev.telicent.io",
      },
    ];

    const results = cases.map((item) => {
      setWindowLocation(item.current);
      const client = new AuthServerOAuth2Client(
        createConfig({ authServerUrl: item.authServerUrl })
      );
      return {
        current: item.current,
        auth: item.authServerUrl,
        isCrossDomain: client.isCrossDomain,
      };
    });

    expect(results).toMatchInlineSnapshot(`
      [
        {
          "auth": "http://localhost",
          "current": "http://localhost",
          "isCrossDomain": false,
        },
        {
          "auth": "http://auth.telicent.localhost",
          "current": "http://app.telicent.localhost",
          "isCrossDomain": false,
        },
        {
          "auth": "https://dev.telicent.io",
          "current": "http://localhost:3000",
          "isCrossDomain": true,
        },
      ]
    `);
  });

  it("generates readable pkce values, state, and nonce", async () => {
    const client = new AuthServerOAuth2Client(createConfig());
    const values = mockPkceValues(client);
    const codeVerifier = client.generateCodeVerifier();
    const codeChallenge = await client.generateCodeChallenge(codeVerifier);
    const state = client.generateState();
    const nonce = client.generateNonce();

    expect({
      codeVerifier,
      codeChallenge,
      state,
      nonce,
    }).toMatchInlineSnapshot(`
      {
        "codeChallenge": "ABC_codeChallenge_ABC",
        "codeVerifier": "ABC_codeVerifier_ABC",
        "nonce": "ABC_nonce_ABC",
        "state": "ABC_state_ABC",
      }
    `);

    expect(values).toMatchInlineSnapshot(`
      {
        "codeChallenge": "ABC_codeChallenge_ABC",
        "codeVerifier": "ABC_codeVerifier_ABC",
        "nonce": "ABC_nonce_ABC",
        "state": "ABC_state_ABC",
      }
    `);
  });

  it("builds login redirect and stores pkce values", async () => {
    const client = new AuthServerOAuth2Client(createConfig());
    mockPkceValues(client);
    await client.login();

    const url = new URL(window.location.href);
    const params = Object.fromEntries(url.searchParams.entries());

    expect({
      href: window.location.href,
      params,
      storage: {
        state: sessionStorage.getItem("oauth_state"),
        nonce: sessionStorage.getItem("oauth_nonce"),
        codeVerifier: sessionStorage.getItem("oauth_code_verifier"),
        redirectUri: sessionStorage.getItem("oauth_redirect_uri"),
      },
    }).toMatchInlineSnapshot(`
      {
        "href": "http://auth.telicent.localhost/oauth2/authorize?response_type=code&client_id=client-1&redirect_uri=http%3A%2F%2Fapp.telicent.localhost%2Fcallback&scope=openid+profile&state=ABC_state_ABC.aHR0cDovL2FwcC50ZWxpY2VudC5sb2NhbGhvc3QvaG9tZQ&nonce=ABC_nonce_ABC&code_challenge=ABC_codeChallenge_ABC&code_challenge_method=S256",
        "params": {
          "client_id": "client-1",
          "code_challenge": "ABC_codeChallenge_ABC",
          "code_challenge_method": "S256",
          "nonce": "ABC_nonce_ABC",
          "redirect_uri": "http://app.telicent.localhost/callback",
          "response_type": "code",
          "scope": "openid profile",
          "state": "ABC_state_ABC.aHR0cDovL2FwcC50ZWxpY2VudC5sb2NhbGhvc3QvaG9tZQ",
        },
        "storage": {
          "codeVerifier": "ABC_codeVerifier_ABC",
          "nonce": "ABC_nonce_ABC",
          "redirectUri": "http://app.telicent.localhost/callback",
          "state": "ABC_state_ABC",
        },
      }
    `);
  });

  it("opens popup and starts flow", async () => {
    const client = new AuthServerOAuth2Client(createConfig());
    mockPkceValues(client);
    const popup = { close: jest.fn(), closed: false } as unknown as Window;
    const openSpy = jest.spyOn(window, "open").mockReturnValue(popup);
    const startSpy = jest.spyOn(client, "startPopupFlow");

    await client.loginWithPopup();

    expect({
      openArgs: openSpy.mock.calls[0],
      startCalls: startSpy.mock.calls.length,
      state: sessionStorage.getItem("oauth_state"),
    }).toMatchInlineSnapshot(`
      {
        "openArgs": [
          "http://auth.telicent.localhost/oauth2/authorize?response_type=code&client_id=client-1&redirect_uri=http%3A%2F%2Fapp.telicent.localhost%2Fpopup&scope=openid+profile&state=ABC_state_ABC&nonce=ABC_nonce_ABC&code_challenge=ABC_codeChallenge_ABC&code_challenge_method=S256",
          "_blank",
          "width=600,height=700,scrollbars=yes,resizable=yes",
        ],
        "startCalls": 1,
        "state": "ABC_state_ABC",
      }
    `);

    openSpy.mockRestore();
    startSpy.mockRestore();
  });
});
