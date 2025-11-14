/**
 * TypeScript definitions for AuthServerOAuth2Client
 *
 * OAuth2 Authorization Code + PKCE client for Telicent auth-server integration.
 * Supports both same-domain (cookie-based) and cross-domain (header-based) authentication.
 */

/**
 * Configuration options for AuthServerOAuth2Client
 */
export interface AuthServerOAuth2ClientConfig {
  /** OAuth2 client identifier registered with the auth server */
  clientId?: string;
  /** Base URL of the authentication server (e.g. "http://auth.telicent.localhost") */
  authServerUrl?: string;
  /** URI to redirect to after OAuth authorization (must be registered with auth server) */
  redirectUri?: string;
  /** Alternative redirect URI for popup-based authentication flows */
  popupRedirectUri?: string;
  /** OAuth2 scopes to request (e.g. "openid profile message.read") */
  scope?: string;
  /** Base URL for API requests (used for cross-domain detection) */
  apiUrl?: string;
  /** Callback function executed after successful logout */
  onLogout?: () => void;
}

/**
 * User information extracted from ID token or userinfo endpoint
 * Matches GetUserInfoSchema from schemas.js
 */
export interface UserInfo {
  // Core user identity (always present)
  /** Subject (unique user identifier) - Always present */
  sub: string;
  /** Email address - NOT NULL in DB */
  email: string;
  /** Preferred display name - NOT NULL in DB */
  preferred_name: string;

  // Standard OIDC claims (always present)
  /** Token issuer URL */
  iss: string;
  /** Token audience (client ID) */
  aud: string;
  /** Token expiration time (Unix timestamp) */
  exp: number;
  /** Token issued at time (Unix timestamp) */
  iat: number;
  /** JWT ID */
  jti: string;

  // Optional OIDC claims (conditional)
  /** Nonce for token validation - Only if sent in auth request */
  nonce?: string;
  /** Authentication timestamp */
  auth_time?: number;
  /** Session ID */
  sid?: string;
  /** Authorized party */
  azp?: string;

  // FE client additions
  /** Display name */
  name?: string;
  /** Whether the cached token is expired */
  token_expired?: boolean;
  /** Token expiration timestamp (ISO string) */
  token_expires_at?: string;
  /** Source of user info ('id_token' or 'oauth2_userinfo_api') */
  source?: string;
  /** External identity provider details */
  externalProvider?: Record<string, unknown>;
}

/**
 * Session data returned from authentication callback
 */
export interface SessionData {
  /** Session token for cross-domain authentication */
  sessionToken?: string;
  /** Whether this client is operating in cross-domain mode */
  isCrossDomain?: boolean;
  /** Session expiration timestamp */
  expiresAt?: string;
  /** Username or user identifier */
  user?: string;
  /** Whether the user is authenticated */
  authenticated?: boolean;
  /** Additional session properties */
  [key: string]: any;
}

/**
 * Options for authenticated HTTP requests
 */
export interface RequestOptions {
  /** HTTP method (GET, POST, etc.) */
  method?: string;
  /** Request headers */
  headers?: Record<string, string>;
  /** Request body */
  body?: any;
  /** If true, don't automatically logout on 401/403 responses */
  skipAutoLogout?: boolean;
  /** Additional fetch options */
  [key: string]: any;
}

/**
 * OAuth2 Authorization Code + PKCE client for Telicent auth-server integration.
 *
 * Handles complete OAuth2 flow including login, callback processing, session management,
 * and authenticated API requests. Automatically detects same-domain vs cross-domain
 * scenarios and uses appropriate authentication methods (cookies vs headers).
 *
 * @example
 * ```javascript
 * const authClient = new AuthServerOAuth2Client({
 *   authServerUrl: "http://auth.telicent.localhost",
 *   clientId: "spa-client",
 *   redirectUri: window.location.origin + "/callback.html",
 *   scope: "openid profile message.read message.write"
 * });
 *
 * // Check authentication status
 * const isAuth = await authClient.isAuthenticated();
 * if (!isAuth) {
 *   authClient.login(); // Redirect to auth server
 * }
 * ```
 */
declare class AuthServerOAuth2Client {
  /** Message type for successful OAuth completion in popup flows */
  static readonly OAUTH_SUCCESS: string;
  /** Message type for OAuth errors in popup flows */
  static readonly OAUTH_ERROR: string;

  /** Client configuration with defaults applied */
  config: Required<AuthServerOAuth2ClientConfig>;
  /** Whether this client operates in cross-domain mode */
  isCrossDomain: boolean;

  /**
   * Create a new OAuth2 client instance
   *
   * @param config - Client configuration options
   * @example
   * ```javascript
   * const authClient = new AuthServerOAuth2Client({
   *   authServerUrl: "http://auth.telicent.localhost",
   *   clientId: "spa-client",
   *   redirectUri: "http://localhost:3000/callback.html",
   *   scope: "openid profile"
   * });
   * ```
   */
  constructor(config?: AuthServerOAuth2ClientConfig);

  /**
   * Detect if this is a cross-domain client based on current origin vs auth server URL
   */
  detectCrossDomain(): boolean;

  /**
   * Generate code verifier for PKCE
   */
  generateCodeVerifier(): string;

  /**
   * Generate code challenge from verifier
   */
  generateCodeChallenge(codeVerifier: string): Promise<string>;

  /**
   * Base64 URL encoding
   */
  base64URLEncode(array: Uint8Array): string;

  /**
   * Generate random state
   */
  generateState(): string;

  /**
   * Generate random nonce for ID token binding
   */
  generateNonce(): string;

  /**
   * Start OAuth2 login by redirecting to the auth server
   *
   * Creates state, nonce, and PKCE parameters for secure OAuth2 flow.
   * Redirects user to auth server login page, then back to your redirect URI.
   *
   * @param redirectUri - Override redirect URI (must be registered with auth server)
   * @throws {Error} If client config is invalid
   * @example
   * ```javascript
   * // Basic login
   * authClient.login();
   *
   * // Login with custom redirect
   * authClient.login("http://localhost:3000/auth-complete");
   * ```
   */
  login(redirectUri?: string | null): Promise<void>;

  /**
   * Start OAuth2 login in popup window
   *
   * Opens auth server login in popup, processes callback via postMessage.
   * Better UX than full redirect - main app stays loaded.
   *
   * @param redirectUri - Override redirect URI for popup
   * @param features - Window features for popup (size, position, etc.)
   * @throws {Error} If popup blocked or auth fails
   * @example
   * ```javascript
   * // Basic popup login
   * await authClient.loginWithPopup();
   *
   * // Custom popup size
   * await authClient.loginWithPopup(null, "width=500,height=600");
   * ```
   */
  loginWithPopup(redirectUri?: string | null, features?: string): Promise<void>;

  /**
   * Process OAuth callback and create session
   *
   * Exchanges authorization code for session via auth server.
   * Validates ID token with nonce check. Call this in your redirect URI page.
   *
   * @param callbackParams - Override URL search params (defaults to current page)
   * @returns Session data including user info and authentication status
   * @throws {Error} If callback invalid, nonce fails, or session creation fails
   * @example
   * ```javascript
   * // In callback.html
   * authClient.handleCallback()
   *   .then((sessionData) => {
   *     console.log("Login success:", sessionData.user);
   *     window.location.href = "/dashboard";
   *   })
   *   .catch((error) => {
   *     console.error("Login failed:", error);
   *   });
   * ```
   */
  handleCallback(callbackParams?: string | null): Promise<SessionData>;

  /**
   * Check if user has valid session
   *
   * Verifies session with auth server. Use this before showing protected content
   * or making API calls. Returns true if session is valid, false otherwise.
   *
   * @returns Promise resolving to authentication status
   * @example
   * ```javascript
   * const isAuth = await authClient.isAuthenticated();
   * if (isAuth) {
   *   showDashboard();
   * } else {
   *   showLoginButton();
   * }
   * ```
   */
  isAuthenticated(signal?: AbortSignal): Promise<boolean>;

  /**
   * Decode JWT token payload
   *
   * Decodes JWT payload without signature verification (client-side only).
   * Use for inspecting token contents. Does not validate token security.
   *
   * @param token - JWT token string
   * @returns Decoded token payload or null if invalid format
   * @example
   * ```javascript
   * const token = authClient.getRawIdToken();
   * const payload = authClient.decodeJWT(token);
   * console.log("Token expires at:", new Date(payload.exp * 1000));
   * ```
   */
  decodeJWT(token: string): any | null;

  /**
   * Validate ID token for session recovery (without nonce)
   */
  validateIdTokenForRecovery(idToken: string): boolean;

  /**
   * Validate ID token with security checks
   *
   * Validates ID token against stored nonce, expiration, audience, and timing.
   * Use during callback processing to ensure token security.
   *
   * @param idToken - JWT ID token to validate
   * @returns true if token passes all security checks
   * @example
   * ```javascript
   * const idToken = getTokenFromCallback();
   * if (authClient.validateIdToken(idToken)) {
   *   console.log("Token is valid and secure");
   * } else {
   *   console.error("Token validation failed - possible security issue");
   * }
   * ```
   */
  validateIdToken(idToken: string): boolean;

  /**
   * Check if ID token is expired
   */
  isIdTokenExpired(): boolean;

  /**
   * Get user info from stored ID token
   *
   * Returns cached user data from ID token without making API calls.
   * Fast and works offline. Returns null if not authenticated or token expired.
   *
   * @returns User information or null if not available
   * @example
   * ```javascript
   * const userInfo = authClient.getUserInfo();
   * if (userInfo) {
   *   console.log("Welcome,", userInfo.name);
   *   console.log("Email:", userInfo.email);
   *   console.log("Roles:", userInfo.roles);
   * }
   * ```
   */
  getUserInfo(): UserInfo | null;

  /**
   * Get fresh user info from OAuth2 userinfo endpoint
   *
   * Fetches current user data from auth server. Slower than getUserInfo() but
   * guarantees fresh data. Use when you need up-to-date user information.
   *
   * @returns Promise resolving to fresh user information
   * @throws {Error} If request fails or session invalid
   * @example
   * ```javascript
   * try {
   *   const freshUserInfo = await authClient.getUserInfoFromAPI();
   *   console.log("Fresh user data:", freshUserInfo);
   * } catch (error) {
   *   console.error("Failed to get fresh user info:", error);
   * }
   * ```
   */
  getUserInfoFromAPI(): Promise<UserInfo | null>;

  /**
   * Get raw JWT ID token from storage
   *
   * Returns the stored ID token as a JWT string. Useful for manual token
   * inspection or sending to other systems that need the raw token.
   *
   * @returns JWT ID token string or null if not available
   * @example
   * ```javascript
   * const rawToken = authClient.getRawIdToken();
   * if (rawToken) {
   *   console.log("Raw JWT:", rawToken);
   *   // Send to another system or decode manually
   * }
   * ```
   */
  getRawIdToken(): string | null;

  /**
   * Get CSRF token from cookie (same-domain only)
   */
  getCsrfToken(): string | null;

  /**
   * Make authenticated HTTP request
   *
   * Automatically adds authentication (cookies or headers) based on domain setup.
   * Handles 401/403 responses by redirecting to login unless skipAutoLogout is true.
   *
   * @param url - Target URL for the request
   * @param options - Request options (method, headers, body, etc.)
   * @returns Promise resolving to fetch Response
   * @throws {Error} If request fails or authentication required
   * @example
   * ```javascript
   * // GET request
   * const response = await authClient.makeAuthenticatedRequest(
   *   "http://api.telicent.localhost/data"
   * );
   * const data = await response.json();
   *
   * // POST request
   * const response = await authClient.makeAuthenticatedRequest(
   *   "http://api.telicent.localhost/save",
   *   {
   *     method: "POST",
   *     headers: { "Content-Type": "application/json" },
   *     body: JSON.stringify({ message: "Hello" })
   *   }
   * );
   * ```
   */
  makeAuthenticatedRequest(
    url: string,
    options?: RequestOptions
  ): Promise<Response>;

  /**
   * Logout user and destroy session
   *
   * Destroys session on auth server and cleans up local storage.
   * Supports Single Logout with external identity providers.
   * Calls onLogout callback if configured.
   *
   * @returns Promise resolving when logout complete
   * @example
   * ```javascript
   * await authClient.logout();
   * console.log("User logged out");
   * // Will automatically redirect or call onLogout callback
   * ```
   */
  logout(): Promise<void>;

  /**
   * Track popup window and listen for OAuth callback messages
   */
  trackPopup(popup: Window): void;

  /**
   * Complete popup OAuth flow
   *
   * Call this in your popup redirect page to send callback data to parent window.
   * Works with loginWithPopup() to complete authentication without full page redirect.
   *
   * @example
   * ```javascript
   * // In popup-callback.html
   * const authClient = new AuthServerOAuth2Client({...});
   * authClient.finishPopupFlow();
   * // Popup will close and parent window will process the callback
   * ```
   */
  finishPopupFlow(): void;

  /**
   * Start popup flow tracking with message handling
   */
  startPopupFlow(popup: Window): void;

  /**
   * Prepare request options with authentication headers
   */
  beforeRequest(options?: RequestOptions): RequestOptions;

  /**
   * Process response and handle authentication errors
   */
  afterRequest(
    response: Response,
    url: string,
    options?: RequestOptions
  ): Response;

  /**
   * Helper method to clear all auth-related storage
   */
  clearLocalStorage(): void;
}

// ES module exports
export default AuthServerOAuth2Client;
export { AuthServerOAuth2Client };

