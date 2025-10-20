# SPA Client Authentication Guide

This Single Page Application (SPA) client implements OAuth2 Authorization Code flow with PKCE for secure authentication with the Auth Server's session-based system.

## Architecture

- **Auth Server**: `http://auth.telicent.localhost` - Handles authentication and sessions
- **SPA Client**: `http://demo.telicent.localhost` - Frontend application
- **Protected APIs**: `http://api.telicent.localhost` - External APIs protected by auth server

## Authentication Flow

```
┌───────────────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client                  │    │  Auth Server    │    │  External IDP   │    │  Protected API  │
│ (demo.telicent.localhost) │    │    (auth)       │   (| Keycloak)    │    │ (api.telicent.localhost) │
└───────────────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │                       │
         ├─1. login()────────────→│                       │                       │
         │   Generate state,      │                       │                       │
         │   nonce, PKCE          │                       │                       │
         │                       │                       │                       │
         │←─2. Redirect to────────┤                       │                       │
         │   /oauth2/authorize    │                       │                       │
         │                       │                       │                       │
         │                       ├─3. Delegate to IDP───→│                       │
         │                       │                       │                       │
         │                       │←─4. User auth + consent┤                       │
         │                       │                       │                       │
         │←─5. Callback with─────┤                       │                       │
         │   auth code + state   │                       │                       │
         │                       │                       │                       │
         ├─6. Exchange code──────→│                       │                       │
         │   POST /oauth2/session│                       │                       │
         │   + PKCE verifier      │                       │                       │
         │   (SECURE: access      │                       │                       │
         │   token never exposed) │                       │                       │
         │                       │                       │                       │
         │←─7. Session + ID token┤                       │                       │
         │   (via domain cookies)│                       │                       │
         │                       │                       │                       │
         ├─8. Validate ID token──│                       │                       │
         │   + nonce verification│                       │                       │
         │                       │                       │                       │
         ├─9. API Request────────────────────────────────────────────────────────→│
         │   with domain cookies │                       │                       │
         │   (credentials: include)                      │                       │
         │                       │                       │                       │
         │                       │←─10. Forward Auth─────────────────────────────┤
         │                       │    Validate session  │                       │
         │                       │                       │                       │
         │                       ├─11. Auth Headers─────────────────────────────→│
         │                       │    X-Auth-User, etc   │                       │
         │                       │                       │                       │
         │←─12. API Response─────────────────────────────────────────────────────┤
         │                       │                       │                       │
```

## Quick Start

### 1. Include the Client Library

```html
<script src="js/auth-server-oauth.js"></script>
```

### 2. Initialize and Use

```javascript
// Initialize client
const authClient = new AuthServerOAuth2Client({
  authServerUrl: "http://auth.telicent.localhost",
  clientId: "spa-client",
  redirectUri: window.location.origin + "/callback.html",
  scope: "openid profile message.read message.write",
});

// Check authentication status
authClient.isAuthenticated().then((isAuth) => {
  if (isAuth) {
    // User is authenticated - load main app
    const userInfo = authClient.getUserInfo();
    console.log("Welcome,", userInfo.name);
    loadMainApplication();
  } else {
    // Show login button
    showLoginButton();
  }
});

// Handle login
function handleLogin() {
  authClient.login(); // Redirects to auth server
}
```

### 3. Callback Page (callback.html)

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Processing Login...</title>
    <script src="js/auth-server-oauth.js"></script>
  </head>
  <body>
    <div>Processing authentication...</div>
    <script>
      const authClient = new AuthServerOAuth2Client({
        authServerUrl: "http://auth.telicent.localhost",
        clientId: "spa-client",
        redirectUri: window.location.origin + "/callback.html",
        scope: "openid profile message.read message.write",
      });

      authClient
        .handleCallback()
        .then(() => {
          console.log("Authentication successful");
          window.location.href = "/dashboard.html";
        })
        .catch((error) => {
          console.error("Authentication failed:", error);
          window.location.href = "/?error=" + encodeURIComponent(error.message);
        });
    </script>
  </body>
</html>
```

## Core Methods

### `login()`

Initiates OAuth2 flow with state, nonce, and PKCE parameters.

### `handleCallback()`

Processes OAuth callback, exchanges code for session, validates ID token with nonce.

### `isAuthenticated()`

Checks session validity with server (returns boolean).

### `getUserInfo()`

Gets user information from stored ID token (synchronous, no API call).

### `getUserInfoFromAPI()`

Fetches fresh user data from auth server API (async).

### `makeAuthenticatedRequest(url, options)`

Makes authenticated requests using domain cookies for all requests (no Authorization headers needed).

### `logout()`

Destroys session and clears local storage.

## Authentication Methods

The client uses domain cookies for all authentication:

| Target            | Method                        | Purpose                                 |
| ----------------- | ----------------------------- | --------------------------------------- |
| All Subdomains    | Domain cookies (`.localhost`) | Seamless cross-subdomain authentication |
| User Info Display | Cached ID token               | Local user data without API calls       |

## ID Token Usage

### When ID Tokens Are Retrieved

1. **Initial Authentication**: ID token received in `/oauth2/session` response
2. **Nonce Validation**: Token validated against stored nonce before use
3. **Local Storage**: Validated token stored in `sessionStorage`

### When ID Tokens Are Used

- **User Info Display**: `getUserInfo()` reads from cached token
- **Profile Information**: Name, email, roles extracted locally
- **UI Updates**: Immediate user data without API calls

### When ID Tokens Are NOT Used

- **Session Validation**: `/session/check` validates server session via cookies
- **API Authentication**: Domain cookies used for all API requests
- **Fresh Data**: `getUserInfoFromAPI()` bypasses cached token

## Security Features

- **PKCE**: Proof Key for Code Exchange prevents code interception
- **Nonce Validation**: Prevents ID token replay attacks
- **State Parameter**: CSRF protection during OAuth flow
- **Session Binding**: Tokens tied to specific authentication requests
- **Secure Storage**: `sessionStorage` cleared on tab close
- **Cross-Domain Security**: Proper CORS with credentials

## Making API Calls

```javascript
// Automatic authentication handling
const response = await authClient.makeAuthenticatedRequest(
  "http://api.telicent.localhost/protected/data"
);

if (response.ok) {
  const data = await response.json();
  console.log("Protected data:", data);
}
```

## Error Handling

```javascript
try {
  await authClient.handleCallback();
} catch (error) {
  if (error.message.includes("Nonce validation failed")) {
    console.error("Security validation failed");
  } else if (error.message.includes("Session expired")) {
    console.error("Please login again");
  }
  // Redirect to login
  window.location.href = "/";
}
```

## Session Management

- **Server-Side Sessions**: Auth server manages session state via domain cookies
- **Client Storage**: Only ID token in `sessionStorage` for offline user info
- **Domain Cookies**: Session authentication handled automatically
- **Expiration**: 2-hour default session lifetime
- **Validation**: Regular session checks with auth server via cookies
- **Cleanup**: Cookies cleared by server on logout

---

## Development

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run serve            # Preview production build
```

For detailed API reference and integration examples, see [API_REFERENCE.md](API_REFERENCE.md) and [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md).
