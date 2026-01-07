import {
  buildJwt,
  decodeJwtPayload,
  installTestEnv,
  installBase64,
  installConsoleMocks,
  resetCookies,
  resetSessionStorage,
  restoreConsoleMocks,
  resetTestEnv,
  setCookies,
} from "./test-utils";

describe("happy path - test utilities", () => {
  beforeEach(() => {
    installTestEnv();
  });

  afterEach(() => {
    resetTestEnv();
  });

  it("builds and decodes jwt payloads", () => {
    const payload = { sub: "user-1", exp: 123, aud: "client-1" };
    const token = buildJwt(payload);
    const decoded = decodeJwtPayload(token);

    expect({ token, decoded }).toMatchInlineSnapshot(`
      {
        "decoded": {
          "aud": "client-1",
          "exp": 123,
          "sub": "user-1",
        },
        "token": "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ1c2VyLTEiLCJleHAiOjEyMywiYXVkIjoiY2xpZW50LTEifQ.",
      }
    `);
  });

  it("returns null when jwt payload decoding fails", () => {
    const payload = decodeJwtPayload("not-a-jwt");

    expect({ payload }).toMatchInlineSnapshot(`
      {
        "payload": null,
      }
    `);
  });

  it("returns null when jwt payload is not valid json", () => {
    const payload = decodeJwtPayload("header.bm90LWpzb24.signature");

    expect({ payload }).toMatchInlineSnapshot(`
      {
        "payload": null,
      }
    `);
  });

  it("installs base64 helpers when missing", () => {
    const originalBtoa = globalThis.btoa;
    const originalAtob = globalThis.atob;
    delete (globalThis as { btoa?: typeof btoa }).btoa;
    delete (globalThis as { atob?: typeof atob }).atob;

    installBase64();

    const encoded = globalThis.btoa?.("hi");
    const decoded = globalThis.atob?.(encoded ?? "");

    expect({
      encoded,
      decoded,
      hasBtoa: typeof globalThis.btoa !== "undefined",
      hasAtob: typeof globalThis.atob !== "undefined",
    }).toMatchInlineSnapshot(`
      {
        "decoded": "hi",
        "encoded": "aGk=",
        "hasAtob": true,
        "hasBtoa": true,
      }
    `);

    if (originalBtoa) globalThis.btoa = originalBtoa;
    if (originalAtob) globalThis.atob = originalAtob;
  });

  it("manages console mock lifecycle", () => {
    installConsoleMocks();
    installConsoleMocks();
    const beforeRestore = {
      log: jest.isMockFunction(console.log),
      warn: jest.isMockFunction(console.warn),
      error: jest.isMockFunction(console.error),
      info: jest.isMockFunction(console.info),
    };
    restoreConsoleMocks();
    restoreConsoleMocks();
    const afterRestore = {
      log: jest.isMockFunction(console.log),
      warn: jest.isMockFunction(console.warn),
      error: jest.isMockFunction(console.error),
      info: jest.isMockFunction(console.info),
    };

    expect({ beforeRestore, afterRestore }).toMatchInlineSnapshot(`
      {
        "afterRestore": {
          "error": false,
          "info": false,
          "log": false,
          "warn": false,
        },
        "beforeRestore": {
          "error": true,
          "info": true,
          "log": true,
          "warn": true,
        },
      }
    `);
  });

  it("ignores empty cookie input", () => {
    resetCookies();
    setCookies("");

    expect({ cookie: document.cookie }).toMatchInlineSnapshot(`
      {
        "cookie": "",
      }
    `);
  });

  it("installs runtime/browser mocks", async () => {
    const randomBytes = new Uint8Array(4);
    crypto.getRandomValues(randomBytes);
    const digest = await crypto.subtle.digest("SHA-256", new Uint8Array([1]));

    expect({
      hasTextEncoder: typeof TextEncoder !== "undefined",
      hasBtoa: typeof btoa !== "undefined",
      hasAtob: typeof atob !== "undefined",
      hasConsoleMocks: {
        log: jest.isMockFunction(console.log),
        warn: jest.isMockFunction(console.warn),
        error: jest.isMockFunction(console.error),
        info: jest.isMockFunction(console.info),
      },
      randomBytes: Array.from(randomBytes),
      digestBytes: Array.from(new Uint8Array(digest)),
    }).toMatchInlineSnapshot(`
      {
        "digestBytes": [
          1,
          2,
          3,
        ],
        "hasAtob": true,
        "hasBtoa": true,
        "hasConsoleMocks": {
          "error": true,
          "info": true,
          "log": true,
          "warn": true,
        },
        "hasTextEncoder": true,
        "randomBytes": [
          1,
          1,
          1,
          1,
        ],
      }
    `);
  });

  it("sets cookies", () => {
    setCookies("XSRF-TOKEN=abc123");

    expect({ cookie: document.cookie }).toMatchInlineSnapshot(`
      {
        "cookie": "XSRF-TOKEN=abc123",
      }
    `);
  });
});
