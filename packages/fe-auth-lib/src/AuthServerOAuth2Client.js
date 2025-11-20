// Import schemas for validation (Node.js/bundler environments)
let GetUserInfoSchema;
let AuthServerOAuth2ClientConfigSchema;
if (typeof require !== "undefined") {
  try {
    const schemas = require("./schemas.js");
    GetUserInfoSchema = schemas.GetUserInfoSchema;
    AuthServerOAuth2ClientConfigSchema =
      schemas.AuthServerOAuth2ClientConfigSchema;
  } catch (e) {
    console.warn(
      "Zod schema not available, validation will be skipped:",
      e.message
    );
  }
}

// Unified OAuth2 Client Implementation using Auth Server Session Management
// Works for both same-domain and cross-domain scenarios with automatic detection
class AuthServerOAuth2Client {
  // Event constants for popup communication
  static OAUTH_SUCCESS = "oauth-success";
  static OAUTH_ERROR = "oauth-error";
  constructor(config) {
    if (AuthServerOAuth2ClientConfigSchema && config) {
      try {
        AuthServerOAuth2ClientConfigSchema.parse(config);
      } catch (error) {
        console.error(
          "❌ Invalid AuthServerOAuth2Client configuration:",
          error.errors || error.message
        );
        throw new Error(
          `Invalid AuthServerOAuth2Client configuration: ${error.message}`
        );
      }
    }

    this.config = {
      clientId: "spa-client", // Default - should be overridden
      authServerUrl: "http://auth.telicent.localhost",
      redirectUri: "http://demo.telicent.localhost/callback.html", // Default - should be overridden
      popupRedirectUri: null, // Must be provided for popup flows
      scope: "openid email profile offline_access",
      apiUrl: "http://api.telicent.localhost",
      onLogout: () => {
        window.alert("You are now logged out. Redirecting to /");
        window.location.href = "/";
      },
      ...config,
    };

    // Auto-detect if this is a cross-domain client
    this.isCrossDomain = this.detectCrossDomain();
    console.log(
      `🔧 Initialized ${
        this.isCrossDomain ? "cross-domain" : "same-domain"
      } OAuth2 client`
    );
    console.log(`🔧 Client config:`, {
      clientId: this.config.clientId,
      redirectUri: this.config.redirectUri,
      authServerUrl: this.config.authServerUrl,
      currentOrigin: window.location.origin,
    });
  }

  // Detect if this is a cross-domain client based on current origin vs auth server URL
  detectCrossDomain() {
    try {
      const currentOrigin = window.location.origin;
      const authServerUrl = new URL(this.config.authServerUrl);
      const authServerOrigin = authServerUrl.origin;

      const currentHost = new URL(currentOrigin).hostname;
      const authServerHost = authServerUrl.hostname;

      // Check if domains are different or if they don't share a common parent domain
      const isSameDomain =
        currentHost === authServerHost ||
        (currentHost.endsWith(".telicent.localhost") &&
          authServerHost.endsWith(".telicent.localhost"));

      console.log(
        `🌐 Domain detection: current=${currentHost}, auth=${authServerHost}, sameDomain=${isSameDomain}`
      );
      return !isSameDomain;
    } catch (error) {
      console.warn(
        "Error detecting domain context, defaulting to cross-domain:",
        error
      );
      return true; // Default to cross-domain for safety
    }
  }

  // Generate code verifier for PKCE
  generateCodeVerifier() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this.base64URLEncode(array);
  }

  // Generate code challenge from verifier
  async generateCodeChallenge(codeVerifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return this.base64URLEncode(new Uint8Array(digest));
  }

  // Base64 URL encoding
  base64URLEncode(array) {
    return btoa(String.fromCharCode.apply(null, array))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }

  // Generate random state
  generateState() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return this.base64URLEncode(array);
  }

  // Generate random nonce for ID token binding
  generateNonce() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return this.base64URLEncode(array);
  }

  // Start OAuth2 login flow (redirects current window)
  async login(redirectUri = null) {
    const state = this.generateState();
    const nonce = this.generateNonce();
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);

    // Use provided redirectUri or fall back to config default
    const finalRedirectUri = redirectUri || this.config.redirectUri;

    // Store PKCE values, nonce, and redirectUri in sessionStorage (temporary)
    sessionStorage.setItem("oauth_state", state);
    sessionStorage.setItem("oauth_nonce", nonce);
    sessionStorage.setItem("oauth_code_verifier", codeVerifier);
    sessionStorage.setItem("oauth_redirect_uri", finalRedirectUri);

    console.log("params --", {
      response_type: "code",
      client_id: this.config.clientId,
      redirect_uri: finalRedirectUri,
      state: state,
      nonce: nonce,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    // Build authorization URL
    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.config.clientId,
      redirect_uri: finalRedirectUri,
      return_to: window.location.href,
      scope: this.config.scope,
      state: state,
      nonce: nonce,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    const authUrl = `${
      this.config.authServerUrl
    }/oauth2/authorize?${params.toString()}`;
    console.log("Redirecting current window to:", authUrl);

    // Always redirect current window
    window.location.href = authUrl;
  }

  // Start OAuth2 login flow in popup window
  async loginWithPopup(
    redirectUri = null,
    features = "width=600,height=700,scrollbars=yes,resizable=yes"
  ) {
    // Use provided redirectUri or fall back to config popupRedirectUri
    const finalRedirectUri = redirectUri || this.config.popupRedirectUri;

    if (!finalRedirectUri) {
      throw new Error(
        "redirectUri is required for popup login. Either provide it as a parameter or configure popupRedirectUri in the client config."
      );
    }

    const state = this.generateState();
    const nonce = this.generateNonce();
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);

    // Store PKCE values, nonce, and redirectUri in sessionStorage (temporary)
    sessionStorage.setItem("oauth_state", state);
    sessionStorage.setItem("oauth_nonce", nonce);
    sessionStorage.setItem("oauth_code_verifier", codeVerifier);
    sessionStorage.setItem("oauth_redirect_uri", finalRedirectUri);

    // Build authorization URL
    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.config.clientId,
      redirect_uri: `${finalRedirectUri}?redirect_to=${window.location.href}`,
      scope: this.config.scope,
      state: state,
      nonce: nonce,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    const authUrl = `${
      this.config.authServerUrl
    }/oauth2/authorize?${params.toString()}`;
    console.log("Opening popup with URL:", authUrl);
    console.log("Popup features:", features);

    // Use window.top to break out of iframe context (e.g., Storybook)
    const targetWindow = window.top || window;
    const popup = targetWindow.open(authUrl, "_blank", features);
    console.log("Popup opened:", popup ? "Success" : "Blocked or failed");

    // Start popup flow and listen for messages
    if (popup) {
      this.startPopupFlow(popup);
    }
  }

  // Handle callback after authorization - creates session via auth-server
  async handleCallback(callbackParams = null) {
    let urlParams;
    if (callbackParams) {
      // Use provided parameters directly
      urlParams = new URLSearchParams(callbackParams);
    } else {
      // Fall back to reading from current URL
      urlParams = new URLSearchParams(window.location.search);
    }
    const code = urlParams.get("code");
    const state = urlParams.get("state");
    const error = urlParams.get("error");

    if (error) {
      throw new Error(`OAuth error: ${error}`);
    }

    if (!code || !state) {
      throw new Error("Missing code or state parameter");
    }

    const storedState = sessionStorage.getItem("oauth_state");
    if (state !== storedState) {
      throw new Error("Invalid state parameter");
    }

    const codeVerifier = sessionStorage.getItem("oauth_code_verifier");
    if (!codeVerifier) {
      throw new Error("Missing code verifier");
    }

    const redirectUri = sessionStorage.getItem("oauth_redirect_uri");
    if (!redirectUri) {
      throw new Error("Missing redirect URI");
    }

    // Exchange authorization code for session (secure - access token never exposed to client)
    const tokenResponse = await fetch(
      `${this.config.authServerUrl}/oauth2/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        credentials: "include", // Include cookies for session
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: this.config.clientId,
          code: code,
          redirect_uri: redirectUri,
          code_verifier: codeVerifier,
        }),
      }
    );

    if (!tokenResponse.ok) {
      let errorDetails;
      try {
        // Try to parse JSON error response first
        errorDetails = await tokenResponse.json();
      } catch (e) {
        // Fallback to text if not JSON
        const errorText = await tokenResponse.text();
        errorDetails = { error: "unknown", error_description: errorText };
      }

      // Handle specific consent_required error
      if (errorDetails.error === "consent_required") {
        console.log("Consent required - redirecting to proper OAuth2 flow");

        // The SPA should not directly call /oauth2/session without consent
        // Instead, redirect to start the proper OAuth2 authorization flow
        // which will handle consent properly through OAuth2AuthenticationSuccessHandler
        const authUrl = this.buildAuthorizationUrl();
        console.log("Redirecting to OAuth2 authorization flow:", authUrl);
        window.location.href = authUrl;
        return; // Don't throw error, we're redirecting
      }

      // For other errors, throw as before
      const errorMessage =
        errorDetails.error_description || errorDetails.error || "Unknown error";
      throw new Error(
        `Token exchange and session creation failed: ${errorMessage}`
      );
    }

    const sessionData = await tokenResponse.json();
    console.log(
      "🎉 Session created securely via domain cookies (access token never exposed)"
    );
    console.log("📊 Session data:", sessionData);

    // For cross-domain clients, store session ID for Authorization header use
    // since cookies won't work across different domains
    console.log("🔍 Cross-domain check:", {
      isCrossDomain: this.isCrossDomain,
      sessionIsCrossDomain: sessionData.isCrossDomain,
      hasSessionToken: !!sessionData.sessionToken,
      sessionToken: sessionData.sessionToken,
    });
    if (
      this.isCrossDomain &&
      sessionData.isCrossDomain &&
      sessionData.sessionToken
    ) {
      sessionStorage.setItem("auth_session_id", sessionData.sessionToken);
      console.log(
        "🔑 Cross-domain client: Session ID stored for Authorization header use"
      );
    } else {
      console.log(
        "❌ Cross-domain session storage skipped - conditions not met"
      );
    }

    // Step 2: Retrieve ID token separately for enhanced security
    // All clients now use session-based authentication for maximum security
    try {
      // Add a small delay to ensure session is fully propagated
      await new Promise((resolve) => setTimeout(resolve, 100));

      const idTokenResponse = await this.makeAuthenticatedRequest(
        `${this.config.authServerUrl}/session/idtoken`,
        { skipAutoLogout: true }
      );

      if (!idTokenResponse.ok) {
        console.warn(
          "Failed to retrieve ID token, but continuing with callback completion"
        );
        // Don't throw - allow callback to complete without ID token
      } else {
        const idTokenData = await idTokenResponse.json();
        console.log(
          "ID token retrieved in separate call for enhanced security"
        );

        // Store ID token for offline user information access
        if (idTokenData.id_token) {
          // Validate ID token with nonce before storing
          if (!this.validateIdToken(idTokenData.id_token)) {
            console.warn(
              "ID token validation failed, but continuing with callback"
            );
          } else {
            sessionStorage.setItem("auth_id_token", idTokenData.id_token);
            console.log("ID token validated and stored in sessionStorage");
          }
        }
      }
    } catch (error) {
      console.warn(
        "Error retrieving ID token during callback, but continuing:",
        error
      );
      // Don't throw - allow callback to complete even if ID token retrieval fails
    }

    // Clean up PKCE values
    sessionStorage.removeItem("oauth_state");
    sessionStorage.removeItem("oauth_code_verifier");
    // Note: oauth_nonce is removed in validateIdToken after successful validation

    return sessionData;
  }

  // Check if user is authenticated by checking session via auth-server
  async isAuthenticated() {
    try {
      const headers = {
        Accept: "application/json",
      };

      // For cross-domain clients, include session ID in Authorization header
      // For same-domain clients, cookies are included automatically
      const sessionId = sessionStorage.getItem("auth_session_id");
      if (this.isCrossDomain && sessionId) {
        headers["Authorization"] = `Bearer ${sessionId}`;
        console.log(
          "🔍 Using session ID in Authorization header for authentication check"
        );
      }

      const response = await fetch(
        `${this.config.authServerUrl}/session/check`,
        {
          method: "GET",
          headers: headers,
          credentials: "include", // Include cookies for same-domain fallback
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log(result);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Authentication check error:", error);
      return false;
    }
  }

  // Helper function to decode JWT token payload
  decodeJWT(token) {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Error decoding JWT:", error);
      return null;
    }
  }

  // Validate ID token for session recovery (without nonce)
  validateIdTokenForRecovery(idToken) {
    try {
      const payload = this.decodeJWT(idToken);
      if (!payload) {
        console.error("Failed to decode ID token payload");
        return false;
      }

      // Validate audience (client ID)
      if (payload.aud !== this.config.clientId) {
        console.error("Audience validation failed", {
          expected: this.config.clientId,
          actual: payload.aud,
        });
        return false;
      }

      // Validate expiration
      if (!payload.exp || payload.exp * 1000 < Date.now()) {
        console.error("Token expired", {
          exp: payload.exp,
          now: Math.floor(Date.now() / 1000),
        });
        return false;
      }

      // Validate issued at time (not too old)
      if (payload.iat && payload.iat * 1000 < Date.now() - 60 * 60 * 1000) {
        // 1 hour max age
        console.error("Token issued too long ago", {
          iat: payload.iat,
          maxAge: "1 hour",
        });
        return false;
      }

      console.log(
        "ID token validation for recovery successful (no nonce check)"
      );
      return true;
    } catch (error) {
      console.error("ID token validation error:", error);
      return false;
    }
  }

  // Validate ID token with nonce and other security checks
  validateIdToken(idToken) {
    try {
      const payload = this.decodeJWT(idToken);
      if (!payload) {
        console.error("Failed to decode ID token payload");
        return false;
      }

      // Validate nonce
      const storedNonce = sessionStorage.getItem("oauth_nonce");
      if (!storedNonce) {
        console.error("No stored nonce found for validation");
        return false;
      }

      if (!payload.nonce || payload.nonce !== storedNonce) {
        console.error("Nonce validation failed", {
          stored: storedNonce,
          token: payload.nonce,
        });
        return false;
      }

      // Validate audience (client ID)
      if (payload.aud !== this.config.clientId) {
        console.error("Audience validation failed", {
          expected: this.config.clientId,
          actual: payload.aud,
        });
        return false;
      }

      // Validate expiration
      if (!payload.exp || payload.exp * 1000 < Date.now()) {
        console.error("Token expired", {
          exp: payload.exp,
          now: Math.floor(Date.now() / 1000),
        });
        return false;
      }

      // Validate issued at time (not too old)
      if (payload.iat && payload.iat * 1000 < Date.now() - 5 * 60 * 1000) {
        console.error("Token issued too long ago", {
          iat: payload.iat,
          maxAge: "5 minutes",
        });
        return false;
      }

      // Clean up nonce after successful validation
      sessionStorage.removeItem("oauth_nonce");
      console.log("ID token validation successful");
      return true;
    } catch (error) {
      console.error("ID token validation error:", error);
      return false;
    }
  }

  // Check if ID token is expired
  isIdTokenExpired() {
    try {
      const idToken = sessionStorage.getItem("auth_id_token");
      if (!idToken) return true;

      const payload = this.decodeJWT(idToken);
      if (!payload || !payload.exp) return true;

      // Check if token is expired (with 30 second buffer)
      const now = Math.floor(Date.now() / 1000);
      return payload.exp < now + 30;
    } catch (error) {
      console.error("Error checking ID token expiration:", error);
      return true;
    }
  }

  // Get user info from ID token (offline method)
  getUserInfo() {
    try {
      const idToken = sessionStorage.getItem("auth_id_token");
      if (!idToken) {
        console.log("No ID token found in storage");
        return null;
      }

      const payload = this.decodeJWT(idToken);
      if (!payload) {
        console.log("Failed to decode ID token");
        return null;
      }

      // Check if token is expired
      if (this.isIdTokenExpired()) {
        console.log("ID token is expired");
        return null;
      }

      // Build user info object from token payload
      const userInfo = {
        sub: payload.sub,
        email: payload.email,
        preferred_name: payload.preferred_name,
        iss: payload.iss,
        aud: payload.aud,
        exp: payload.exp,
        iat: payload.iat,
        jti: payload.jti,
        // Optional OIDC claims
        nonce: payload.nonce,
        auth_time: payload.auth_time,
        sid: payload.sid,
        azp: payload.azp,
        // FE client additions
        name: payload.preferred_name || payload.name || payload.sub,
        token_expired: false,
        token_expires_at: new Date(payload.exp * 1000).toISOString(),
        source: "id_token",
        externalProvider: payload,
      };

      // Validate against schema if available
      if (GetUserInfoSchema) {
        try {
          const validated = GetUserInfoSchema.parse(userInfo);
          console.log("User info validated successfully against schema");
          return validated;
        } catch (validationError) {
          console.error("User info validation failed:", validationError);
          // Return unvalidated data but log the error
          console.warn(
            "Returning unvalidated user info. Validation errors:",
            validationError.errors
          );
          return userInfo;
        }
      }

      // Return without validation if schema not available
      return userInfo;
    } catch (error) {
      console.error("Error getting user info from ID token:", error);
      return null;
    }
  }

  // Get fresh user info from OAuth2 userinfo endpoint (UNIFIED ENDPOINT)
  async getUserInfoFromAPI() {
    try {
      const response = await this.makeAuthenticatedRequest(
        `${this.config.authServerUrl}/userinfo`
      );

      if (response.ok) {
        const data = await response.json();
        return {
          ...data,
          source: this.isCrossDomain
            ? "oauth2_userinfo_api_cross_domain"
            : "oauth2_userinfo_api_same_domain",
        };
      }
      return null;
    } catch (error) {
      console.error("Error getting user info from OAuth2 API:", error);
      return null;
    }
  }

  // Get raw ID token from storage
  getRawIdToken() {
    return sessionStorage.getItem("auth_id_token");
  }

  // Get CSRF token from cookie (same-domain only)
  getCsrfToken() {
    if (this.isCrossDomain) {
      return null; // Cross-domain clients don't use CSRF tokens
    }

    const cookies = document.cookie.split(";");
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split("=");
      if (name === "XSRF-TOKEN") {
        return decodeURIComponent(value);
      }
    }
    return null;
  }

  // Make authenticated API request using appropriate authentication method
  async makeAuthenticatedRequest(url, options = {}) {
    const headers = {
      Accept: "application/json",
      ...options.headers,
    };

    // Choose authentication method based on domain context
    if (this.isCrossDomain) {
      // Cross-domain: Use session ID in Authorization header
      const sessionId = sessionStorage.getItem("auth_session_id");
      if (sessionId) {
        headers["Authorization"] = `Bearer ${sessionId}`;
        console.log(
          "Using session ID in Authorization header for cross-domain request to:",
          url
        );
      }
    } else {
      // Same-domain: Add CSRF token for state-changing requests
      if (
        options.method &&
        ["POST", "PUT", "DELETE"].includes(options.method.toUpperCase())
      ) {
        const csrfToken = this.getCsrfToken();
        if (csrfToken) {
          headers["X-XSRF-TOKEN"] = csrfToken;
        }
      }
    }

    const requestOptions = {
      ...options,
      headers: headers,
      credentials: "include", // Always include cookies for same-domain fallback
    };

    const response = await fetch(url, requestOptions);

    if (response.status === 401) {
      // QUESTION: would I ever use this method to call session check?
      // I can only envisage scenarios where app endpoints get hit using this?
      //
      // Don't auto-logout during callback flow or logout operations to prevent infinite loops
      const isCallbackFlow =
        options.skipAutoLogout || url.includes("/session/idtoken");
      const isLogoutOperation = url.includes("/session/logout");
      const isSessionCheck = url.includes("/session/check");
      const isUserInfoOperation = url.includes("/userinfo");

      if (
        !isCallbackFlow &&
        !isLogoutOperation &&
        !isSessionCheck &&
        !isUserInfoOperation
      ) {
        console.log("Session expired, redirecting to login");
        // Clear expired session data
        this.clearLocalStorage();
        // Redirect to login instead of logout
        this.login();
        throw new Error("Session expired");
      } else {
        console.warn(
          "401 response during protected operation, not auto-logging out to prevent loops"
        );
      }
    }

    return response;
  }

  // Prepare request options with authentication
  beforeRequest(options = {}) {
    const headers = {
      Accept: "application/json", // Exact match with original
      ...options.headers,
    };

    // Choose authentication method based on domain context
    if (this.isCrossDomain) {
      // Cross-domain: Use session ID in Authorization header
      const sessionId = sessionStorage.getItem("auth_session_id");
      if (sessionId) {
        headers["Authorization"] = `Bearer ${sessionId}`;
      }
    } else {
      // Same-domain: Add CSRF token for state-changing requests
      if (
        options.method &&
        ["POST", "PUT", "DELETE"].includes(options.method.toUpperCase())
      ) {
        const csrfToken = this.getCsrfToken();
        if (csrfToken) {
          headers["X-XSRF-TOKEN"] = csrfToken;
        }
      }
    }

    return {
      ...options,
      headers,
      credentials: "include", // Always include cookies for same-domain fallback
    };
  }

  // Handle response and authentication errors
  afterRequest(response, url, options = {}) {
    if (response.status === 401) {
      // Don't auto-logout during callback flow or logout operations to prevent infinite loops
      const isCallbackFlow =
        options.skipAutoLogout || url.includes("/session/idtoken");
      const isLogoutOperation = url.includes("/session/logout");
      const isSessionCheck = url.includes("/session/check");
      const isUserInfoOperation = url.includes("/userinfo");

      if (
        !isCallbackFlow &&
        !isLogoutOperation &&
        !isSessionCheck &&
        !isUserInfoOperation
      ) {
        console.log("Session expired, redirecting to login");
        // Clear expired session data
        this.clearLocalStorage();
        // Redirect to login instead of logout
        this.login();
        throw new Error("Session expired");
      } else {
        console.warn(
          "401 response during protected operation, not auto-logging out to prevent loops"
        );
      }
    }

    return response;
  }

  // Finish popup flow - sends callback URL to parent for processing
  finishPopupFlow() {
    // Send callback URL to parent with clientId for disambiguation
    if (window.opener) {
      window.opener.postMessage(
        {
          type: "oauth-callback",
          clientId: this.config.clientId,
          callbackUrl: window.location.href,
        },
        "*"
      );
    }
  }

  // Logout - destroys session via auth-server with external IDP Single Logout support
  async logout() {
    try {
      const headers = {
        Accept: "application/json",
      };

      // For cross-domain clients, include session ID in Authorization header
      const sessionId = sessionStorage.getItem("auth_session_id");
      if (this.isCrossDomain && sessionId) {
        headers["Authorization"] = `Bearer ${sessionId}`;
        console.log("🚪 Using session ID in Authorization header for logout");
      }

      const response = await fetch(
        `${this.config.authServerUrl}/session/logout`,
        {
          method: "POST",
          headers: headers,
          credentials: "include", // Include cookies for same-domain fallback
        }
      );

      // Check if auth server returned external logout redirect
      if (response.ok) {
        try {
          const logoutData = await response.json();

          if (logoutData.external_logout && logoutData.logout_url) {
            console.log(
              "🔗 External IDP logout required, redirecting to:",
              logoutData.logout_url
            );

            // Clear local storage before external redirect
            this.clearLocalStorage();

            // Redirect to external IDP logout (e.g., Keycloak)
            window.location.href = logoutData.logout_url;
            return; // Don't proceed with local redirect
          }
        } catch (jsonError) {
          console.warn(
            "Logout response is not JSON, continuing with standard logout"
          );
        }
      }
    } catch (error) {
      console.error("Logout error (ignoring):", error);
      // Ignore logout errors - we're logging out anyway
    }

    // Standard logout flow - clear storage and redirect locally
    this.clearLocalStorage();

    this.config.onLogout();
  }

  // Start popup flow - track popup window and listen for OAuth callback messages
  startPopupFlow(popup) {
    console.log("Starting popup tracking...");

    const handleMessage = (event) => {
      console.log("Popup message received:", event.data);

      // Only respond to messages from our client
      if (event.data.clientId !== this.config.clientId) {
        console.log(
          "Ignoring message from different client:",
          event.data.clientId
        );
        return;
      }

      if (event.data.type === "oauth-success") {
        console.log("OAuth success received from popup");
        popup.close();
        window.removeEventListener("message", handleMessage);
        // Notify parent that auth completed
        window.dispatchEvent(
          new CustomEvent(AuthServerOAuth2Client.OAUTH_SUCCESS, {
            detail: event.data,
          })
        );
      } else if (event.data.type === "oauth-error") {
        console.log("OAuth error received from popup");
        popup.close();
        window.removeEventListener("message", handleMessage);
        // Notify parent that auth failed
        window.dispatchEvent(
          new CustomEvent(AuthServerOAuth2Client.OAUTH_ERROR, {
            detail: event.data,
          })
        );
      } else if (event.data.type === "oauth-callback") {
        console.log("OAuth callback received from popup");
        popup.close();
        window.removeEventListener("message", handleMessage);
        // Notify parent that callback is ready
        window.dispatchEvent(
          new CustomEvent("oauth-callback", { detail: event.data })
        );
      }
    };

    window.addEventListener("message", handleMessage);
    console.log("Added message listener for popup");

    // Also check if popup is closed manually
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener("message", handleMessage);
        console.log("Popup closed manually - cleaning up listeners");
      }
    }, 1000);
  }

  // Helper method to clear all auth-related storage
  clearLocalStorage() {
    sessionStorage.removeItem("auth_id_token");
    sessionStorage.removeItem("auth_session_id"); // Clear cross-domain session ID
    sessionStorage.removeItem("oauth_state"); // cleanup in case of incomplete flows
    sessionStorage.removeItem("oauth_code_verifier"); // cleanup in case of incomplete flows
    sessionStorage.removeItem("oauth_nonce"); // cleanup in case of incomplete flows
    console.log("🧹 Cleared all auth-related storage");
  }
}

// ES module exports (for modern bundlers) - only when not in browser global context
if (typeof module !== "undefined" && module.exports) {
  // CommonJS (Node.js)
  module.exports = AuthServerOAuth2Client;
  module.exports.default = AuthServerOAuth2Client;
  module.exports.AuthServerOAuth2Client = AuthServerOAuth2Client;
} else if (typeof exports !== "undefined") {
  // ES modules
  exports.default = AuthServerOAuth2Client;
  exports.AuthServerOAuth2Client = AuthServerOAuth2Client;
}

// Create global OAuth client instance for browser use
if (typeof window !== "undefined") {
  window.AuthServerOAuth2Client = AuthServerOAuth2Client;
  window.authServerOAuth2Client = new AuthServerOAuth2Client();
}
