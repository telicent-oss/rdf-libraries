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

const createPopup = (): Window =>
  ({
    close: jest.fn(),
    closed: false,
  } as unknown as Window);

describe("happy path - popup flow and callbacks", () => {
  beforeEach(() => {
    installTestEnv();
  });

  afterEach(() => {
    resetTestEnv();
    jest.useRealTimers();
  });

  it("dispatches oauth-success and closes popup", () => {
    jest.useFakeTimers();
    const client = new AuthServerOAuth2Client(createConfig());
    const popup = createPopup();
    const dispatchSpy = jest.spyOn(window, "dispatchEvent");
    const removeSpy = jest.spyOn(window, "removeEventListener");

    client.startPopupFlow(popup);
    window.dispatchEvent(
      new MessageEvent("message", {
        data: { type: "oauth-success", clientId: "client-1" },
      })
    );

    expect({
      closeCalls: (popup.close as jest.Mock).mock.calls.length,
      removeCalls: removeSpy.mock.calls.length,
      dispatched: dispatchSpy.mock.calls.map((call) => ({
        type: call[0].type,
        detail: (call[0] as CustomEvent).detail,
      })),
    }).toMatchInlineSnapshot(`
      {
        "closeCalls": 1,
        "dispatched": [
          {
            "detail": undefined,
            "type": "message",
          },
          {
            "detail": {
              "clientId": "client-1",
              "type": "oauth-success",
            },
            "type": "oauth-success",
          },
        ],
        "removeCalls": 1,
      }
    `);
  });

  it("dispatches oauth-error and closes popup", () => {
    jest.useFakeTimers();
    const client = new AuthServerOAuth2Client(createConfig());
    const popup = createPopup();
    const dispatchSpy = jest.spyOn(window, "dispatchEvent");

    client.startPopupFlow(popup);
    window.dispatchEvent(
      new MessageEvent("message", {
        data: { type: "oauth-error", clientId: "client-1", message: "fail" },
      })
    );

    expect({
      closeCalls: (popup.close as jest.Mock).mock.calls.length,
      dispatched: dispatchSpy.mock.calls.map((call) => ({
        type: call[0].type,
        detail: (call[0] as CustomEvent).detail,
      })),
    }).toMatchInlineSnapshot(`
      {
        "closeCalls": 1,
        "dispatched": [
          {
            "detail": undefined,
            "type": "message",
          },
          {
            "detail": {
              "clientId": "client-1",
              "type": "oauth-success",
            },
            "type": "oauth-success",
          },
          {
            "detail": undefined,
            "type": "message",
          },
          {
            "detail": {
              "clientId": "client-1",
              "message": "fail",
              "type": "oauth-error",
            },
            "type": "oauth-error",
          },
        ],
      }
    `);
  });

  it("ignores messages from other clients", () => {
    jest.useFakeTimers();
    const client = new AuthServerOAuth2Client(createConfig());
    const popup = createPopup();
    const dispatchSpy = jest.spyOn(window, "dispatchEvent");

    client.startPopupFlow(popup);
    window.dispatchEvent(
      new MessageEvent("message", {
        data: { type: "oauth-success", clientId: "other-client" },
      })
    );

    expect({
      closeCalls: (popup.close as jest.Mock).mock.calls.length,
      dispatchCalls: dispatchSpy.mock.calls.length,
    }).toMatchInlineSnapshot(`
      {
        "closeCalls": 0,
        "dispatchCalls": 5,
      }
    `);
  });

  it("dispatches oauth-callback and closes popup", () => {
    jest.useFakeTimers();
    const client = new AuthServerOAuth2Client(createConfig());
    const popup = createPopup();
    const dispatchSpy = jest.spyOn(window, "dispatchEvent");

    client.startPopupFlow(popup);
    window.dispatchEvent(
      new MessageEvent("message", {
        data: {
          type: "oauth-callback",
          clientId: "client-1",
          callbackUrl: "http://app.telicent.localhost/callback?code=1",
        },
      })
    );

    expect({
      closeCalls: (popup.close as jest.Mock).mock.calls.length,
      dispatched: dispatchSpy.mock.calls.map((call) => ({
        type: call[0].type,
        detail: (call[0] as CustomEvent).detail,
      })),
    }).toMatchInlineSnapshot(`
      {
        "closeCalls": 1,
        "dispatched": [
          {
            "detail": undefined,
            "type": "message",
          },
          {
            "detail": {
              "clientId": "client-1",
              "type": "oauth-success",
            },
            "type": "oauth-success",
          },
          {
            "detail": undefined,
            "type": "message",
          },
          {
            "detail": {
              "clientId": "client-1",
              "message": "fail",
              "type": "oauth-error",
            },
            "type": "oauth-error",
          },
          {
            "detail": undefined,
            "type": "message",
          },
          {
            "detail": undefined,
            "type": "message",
          },
          {
            "detail": {
              "callbackUrl": "http://app.telicent.localhost/callback?code=1",
              "clientId": "client-1",
              "type": "oauth-callback",
            },
            "type": "oauth-callback",
          },
          {
            "detail": {
              "callbackUrl": "http://app.telicent.localhost/callback?code=1",
              "clientId": "client-1",
              "type": "oauth-callback",
            },
            "type": "oauth-callback",
          },
        ],
      }
    `);
  });

  it("posts callback data to opener", () => {
    const client = new AuthServerOAuth2Client(createConfig());
    const postMessage = jest.fn();
    Object.defineProperty(window, "opener", {
      value: { postMessage },
      writable: true,
    });
    Object.defineProperty(window, "location", {
      value: { href: "http://app.telicent.localhost/callback?code=123" },
      writable: true,
    });

    client.finishPopupFlow();

    expect({ postMessageArgs: postMessage.mock.calls[0] })
      .toMatchInlineSnapshot(`
      {
        "postMessageArgs": [
          {
            "callbackUrl": "http://app.telicent.localhost/callback?code=123",
            "clientId": "client-1",
            "type": "oauth-callback",
          },
          "*",
        ],
      }
    `);
  });

  it("cleans up listeners when popup closes", () => {
    jest.useFakeTimers();
    const client = new AuthServerOAuth2Client(createConfig());
    const popup = createPopup() as Window & { closed: boolean };
    const removeSpy = jest.spyOn(window, "removeEventListener");

    client.startPopupFlow(popup);
    popup.closed = true;
    jest.advanceTimersByTime(1000);

    expect({
      removeCalls: removeSpy.mock.calls.length,
    }).toMatchInlineSnapshot(`
      {
        "removeCalls": 5,
      }
    `);
  });
});
