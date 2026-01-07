import { TextEncoder as NodeTextEncoder } from "util";

type JwtPayload = Record<string, unknown>;
type JwtHeader = Record<string, unknown>;

const defaultHeader: JwtHeader = { alg: "none", typ: "JWT" };

const base64UrlEncode = (input: string): string =>
  Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

const base64UrlDecode = (input: string): string => {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "="
  );
  return Buffer.from(padded, "base64").toString("utf8");
};

export const buildJwt = (
  payload: JwtPayload,
  header: JwtHeader = defaultHeader
): string => {
  const headerPart = base64UrlEncode(JSON.stringify(header));
  const payloadPart = base64UrlEncode(JSON.stringify(payload));
  return `${headerPart}.${payloadPart}.`;
};

export const decodeJwtPayload = (token: string): JwtPayload | null => {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return null;
    return JSON.parse(base64UrlDecode(payloadPart)) as JwtPayload;
  } catch {
    return null;
  }
};

export const installTextEncoder = (): void => {
  if (typeof globalThis.TextEncoder === "undefined") {
    globalThis.TextEncoder = NodeTextEncoder as typeof TextEncoder;
  }
};

export const installBase64 = (): void => {
  if (typeof globalThis.btoa === "undefined") {
    globalThis.btoa = (input: string): string =>
      Buffer.from(input, "binary").toString("base64");
  }
  if (typeof globalThis.atob === "undefined") {
    globalThis.atob = (input: string): string =>
      Buffer.from(input, "base64").toString("binary");
  }
};

let consoleMocks:
  | {
      log: jest.SpyInstance;
      warn: jest.SpyInstance;
      error: jest.SpyInstance;
      info: jest.SpyInstance;
    }
  | undefined;

export const installConsoleMocks = (): void => {
  if (consoleMocks) return;
  consoleMocks = {
    log: jest.spyOn(console, "log").mockImplementation(() => {}),
    warn: jest.spyOn(console, "warn").mockImplementation(() => {}),
    error: jest.spyOn(console, "error").mockImplementation(() => {}),
    info: jest.spyOn(console, "info").mockImplementation(() => {}),
  };
};

export const restoreConsoleMocks = (): void => {
  if (!consoleMocks) return;
  consoleMocks.log.mockRestore();
  consoleMocks.warn.mockRestore();
  consoleMocks.error.mockRestore();
  consoleMocks.info.mockRestore();
  consoleMocks = undefined;
};

export const installCryptoMock = (options?: {
  fillByte?: number;
  digestBytes?: number[];
}): { mockDigest: jest.Mock } => {
  const fillByte = options?.fillByte ?? 1;
  const digestBytes = options?.digestBytes ?? [1, 2, 3];
  const mockDigest = jest
    .fn()
    .mockResolvedValue(new Uint8Array(digestBytes).buffer);

  Object.defineProperty(globalThis, "crypto", {
    value: {
      getRandomValues: <T extends ArrayBufferView>(arr: T): T => {
        const bytes = new Uint8Array(arr.buffer);
        bytes.fill(fillByte);
        return arr;
      },
      subtle: { digest: mockDigest },
    },
    configurable: true,
  });

  return { mockDigest };
};

export const resetSessionStorage = (): void => {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.clear();
};

export const resetCookies = (): void => {
  if (typeof document === "undefined") return;
  const cookies = document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .filter(Boolean);
  for (const cookie of cookies) {
    const name = cookie.split("=")[0];
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  }
};

export const setCookies = (cookieString: string): void => {
  if (typeof document === "undefined") return;
  const parts = cookieString
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return;
  document.cookie = parts.join("; ");
};

export const installTestEnv = (): { mockDigest: jest.Mock } => {
  installTextEncoder();
  installBase64();
  installConsoleMocks();
  Object.defineProperty(window, "top", { value: window, writable: true });
  resetSessionStorage();
  resetCookies();
  return installCryptoMock();
};

export const setWindowLocation = (href: string): void => {
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

export const resetTestEnv = (): void => {
  resetSessionStorage();
  resetCookies();
  restoreConsoleMocks();
};

export const mockPkceValues = (
  client: {
    generateCodeVerifier: () => string;
    generateCodeChallenge: (value: string) => Promise<string>;
    generateState: () => string;
    generateNonce: () => string;
  },
  overrides?: Partial<{
    codeVerifier: string;
    codeChallenge: string;
    state: string;
    nonce: string;
  }>
): {
  codeVerifier: string;
  codeChallenge: string;
  state: string;
  nonce: string;
} => {
  const values = {
    codeVerifier: "ABC_codeVerifier_ABC",
    codeChallenge: "ABC_codeChallenge_ABC",
    state: "ABC_state_ABC",
    nonce: "ABC_nonce_ABC",
    ...overrides,
  };

  jest.spyOn(client, "generateCodeVerifier").mockReturnValue(values.codeVerifier);
  jest
    .spyOn(client, "generateCodeChallenge")
    .mockResolvedValue(values.codeChallenge);
  jest.spyOn(client, "generateState").mockReturnValue(values.state);
  jest.spyOn(client, "generateNonce").mockReturnValue(values.nonce);

  return values;
};
