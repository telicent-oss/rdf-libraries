# SPA Client API Reference

Complete API reference for the AuthServerOAuth2Client class.

## AuthServerOAuth2Client

### Constructor

```javascript
new AuthServerOAuth2Client(config);
```

#### Configuration

```javascript
const authClient = new AuthServerOAuth2Client({
  authServerUrl: "http://auth.telicent.localhost",
  clientId: "spa-client",
  redirectUri: "http://demo.telicent.localhost/callback.html",
  scope: "openid profile message.read message.write",
  apiUrl: "http://api.telicent.localhost",
});
```

## Core Methods

### `login()`

Initiates OAuth2 authorization flow with PKCE and nonce.

```javascript
authClient.login(); // Redirects to authorization server
```

### `handleCallback()`

Processes OAuth callback and creates session with ID token validation.

**Returns:** `Promise<Object>` - Session data

```javascript
authClient
  .handleCallback()
  .then((sessionData) => {
    console.log("Session ID:", sessionData.session_id);
    window.location.href = "/dashboard.html";
  })
  .catch((error) => {
    console.error("Authentication failed:", error);
  });
```

### `isAuthenticated()`

Checks session validity with auth server.

**Returns:** `Promise<boolean>`

```javascript
authClient.isAuthenticated().then((isAuth) => {
  if (isAuth) {
    showDashboard();
  } else {
    showLogin();
  }
});
```

### `getUserInfo()`

Gets user information from cached ID token (synchronous, no API call).

**Returns:** `Object | null` - User information

```javascript
const userInfo = authClient.getUserInfo();
if (userInfo) {
  console.log("Name:", userInfo.name);
  console.log("Email:", userInfo.email);
  console.log("Roles:", userInfo.roles);
}
```

### `getUserInfoFromAPI()`

Fetches fresh user information from OAuth2 userinfo endpoint.

**Returns:** `Promise<Object>` - Fresh user data

```javascript
authClient
  .getUserInfoFromAPI()
  .then((userInfo) => {
    console.log("Fresh user data:", userInfo);
    console.log("Source:", userInfo.source); // 'oauth2_userinfo_api'
  })
  .catch((error) => {
    console.error("Failed to get fresh user info:", error);
  });
```

### `makeAuthenticatedRequest(url, options)`

Makes authenticated HTTP requests with automatic credential handling.

**Parameters:**

- `url` (string): Target URL
- `options` (Object): Fetch options

**Returns:** `Promise<Response>`

**Behavior:**

- All requests use domain cookies with `credentials: 'include'`

```javascript
// All requests use domain cookies automatically
const authResponse = await authClient.makeAuthenticatedRequest(
  "http://auth.telicent.localhost/oauth2/userinfo"
);

const apiResponse = await authClient.makeAuthenticatedRequest(
  "http://api.telicent.localhost/protected/data",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: "example" }),
  }
);
```

### `validateIdToken(idToken)`

Validates ID token with comprehensive security checks.

**Parameters:**

- `idToken` (string): JWT ID token

**Returns:** `boolean`

**Validates:**

- Nonce against stored value
- Audience (client ID)
- Token expiration
- Issued-at time (max 5 minutes old)

```javascript
const idToken = authClient.getRawIdToken();
if (idToken && authClient.validateIdToken(idToken)) {
  console.log("Token is valid and secure");
}
```

### `getRawIdToken()`

Gets raw JWT ID token string from storage.

**Returns:** `string | null`

```javascript
const rawToken = authClient.getRawIdToken();
if (rawToken) {
  console.log("Raw JWT:", rawToken);
}
```

### `logout()`

Destroys session and cleans up storage.

**Returns:** `Promise<void>`

```javascript
authClient.logout().then(() => {
  console.log("Logged out successfully");
  window.location.href = "/";
});
```

## Utility Methods

### `generateNonce()`

Generates cryptographically secure nonce for ID token binding.

**Returns:** `string`

### `generateState()`

Generates random state parameter for CSRF protection.

**Returns:** `string`

### `generateCodeVerifier()`

Generates PKCE code verifier.

**Returns:** `string`

### `generateCodeChallenge(verifier)`

Generates PKCE code challenge from verifier.

**Parameters:**

- `verifier` (string): Code verifier

**Returns:** `Promise<string>`

### `decodeJWT(token)`

Decodes JWT token payload (client-side, no signature verification).

**Parameters:**

- `token` (string): JWT token

**Returns:** `Object | null`

## Error Handling

Common error scenarios and handling:

```javascript
try {
  await authClient.handleCallback();
} catch (error) {
  switch (error.message) {
    case "Nonce validation failed":
      // Security issue - redirect to login
      break;
    case "Session expired":
      // Re-authenticate user
      break;
    case "Invalid state parameter":
      // CSRF attack attempt
      break;
    default:
      console.error("Authentication error:", error);
  }
}
```

## Storage Management

The client uses minimal `sessionStorage` for authentication:

- `auth_id_token`: Validated ID token for offline user info access
- `oauth_state`: Temporary OAuth state (cleared after use)
- `oauth_nonce`: Temporary nonce (cleared after validation)
- `oauth_code_verifier`: Temporary PKCE verifier (cleared after use)

Session authentication is handled entirely via secure domain cookies.

## Security Features

- **PKCE**: Authorization code flow with Proof Key for Code Exchange
- **Nonce Validation**: ID token replay attack prevention
- **State Parameter**: CSRF protection
- **Token Validation**: Comprehensive ID token security checks
- **Secure Storage**: SessionStorage automatically cleared on tab close
- **Cross-Domain Authentication**: Proper CORS handling with credentials

---

For implementation examples, see [README.md](README.md) and [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md).
