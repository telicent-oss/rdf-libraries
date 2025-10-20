# Integration Guide

This guide explains how each component works and how they connect together for OAuth2 authentication with Telicent's auth-server.

## Component Breakdown

### Browser Environment Components

#### Your Application
**What it does:**
- Initialize fe-auth-lib with your client settings
- Call `login()` when user wants to log in
- Call `logout()` when user wants to log out
- Check `isAuthenticated()` before calling protected APIs
- Use `makeAuthenticatedRequest()` for API calls that need authentication

#### fe-auth-lib
The main authentication library that handles all OAuth complexity.

**What it does:**
- Manages the complete OAuth2 flow (PKCE, redirects, callbacks)
- Stores and manages session data
- Makes authenticated API calls for you
- Handles automatic session renewal
- Detects authentication state changes

**Key methods:**
- `isAuthenticated()` - Check if user is logged in
- `login()` - Start the login process
- `logout()` - Log out the user
- `getUserInfo()` - Get user details from stored token
- `makeAuthenticatedRequest()` - Make API calls with session
- `handleCallback()` - Process OAuth callback

#### Redirect Page
A special page that handles the OAuth callback when user returns from login.

**What it does:**
- Receives the authorization code from auth server
- Processes the OAuth callback data
- Exchanges code for tokens
- Communicates success/failure back to main app
- Closes popup windows or redirects as needed

**Implementation:**
Usually a simple HTML page (like `callback.html`) that loads fe-auth-lib and calls `handleCallback()` or `finishPopupFlow()`.

### Server Environment Components

#### Auth Server
The central authentication service that handles user login and OAuth.

**What it does:**
- Shows login pages to users
- Verifies user passwords and credentials
- Issues authorization codes and tokens
- Creates and manages user sessions
- Stores client app configurations
- Handles OAuth2 protocol compliance

**Database entities it manages:**
- **Client Config**: Your app's OAuth settings (clientId, allowed redirects, scopes)
- **User Sessions**: Active login sessions with expiry times
- **User Data**: User profiles and authentication info

#### API Server
Your backend service that provides protected data and functionality.

**What it does:**
- Serves your app's protected API endpoints
- Checks if incoming requests have valid sessions
- Returns data only to authenticated users
- Communicates with auth server to validate sessions

**Session validation:**
API server checks with auth server to confirm that session IDs are still valid and not expired.

## Detailed Authentication Flow

```
Browser Environment                                  Server Environment
┌─────────────────────────────────────────────┐
│                                             │
│  ┌─────────────┐                            │    ┌─────────────────────────────┐
│  │  Your App   │  1.authClient =            │    │        Auth Server          │
│  │    e.g. /   │       new AuthClient()     │    │                             │
│  │             │ ──────────┐                │    │                             │
│  └─────────────┘           │                │    │  ┌─────────────────────────┐│
│         │                  │                │    │  │      Database           ││
│         │2.login()         │                │    │  │                         ││
│         ▼                  │                │    │  │ ┌─────────────────────┐ ││
│  ┌─────────────────────────▼─┐              │    │  │ │    Client Config    │ ││
│  │        AuthClient         |              │    │  │ │  - spa-client       │ ││
│  │                           │              │    │  │ │  - allowed scopes   │ ││
│  │ ┌───────────────────────┐ │              │    │  │ │  - redirect URIs    │ ││
│  │ │    Session Manager    │ │              │    │  │ └─────────────────────┘ ││
│  │ │   - PKCE Setup        │ │              │    │  │ ┌─────────────────────┐ ││
│  │ │   - Code Verify       │ │              │    │  │ │   User Sessions     │ ││
│  │ │   - Token Store       │ │              │    │  │ │  - session_abc123   │ ││
│  │ └───────────────────────┘ │              │    │  │ │  - user: john_doe   │ ││
│  │ ┌───────────────────────┐ │              │    │  │ │  - expires: 2hrs    │ ││
│  │ │    API Wrapper        │ │              │    │  │ └─────────────────────┘ ││
│  │ │   - Auth Headers      │ │              │    │  └─────────────────────────┘│
│  │ │   - Session Cookies   │ │              │    │                             │
│  │ └───────────────────────┘ │              │    │ ┌─────────────────────────┐ │
│  └───────────────────────────┘              │    │ │     OAuth Engine        │ │
│         │                                   │    │ │                         │ │
│         │3.redirect to auth server          │    │ │  - Authorization        │ │
│         ▼                                   │    │ │  - Token Generation     │ │
│  ┌─────────────────────┐                    │    │ │  - Session Creation     │ │
│  │    Redirect Page    │                    │    │ └─────────────────────────┘ │
│  │   e.g. /logged-in   │  7.callback        │    │                             │
│  │  authClient.login() │     with code      │    │                             │
│  │ ┌─────────┐   ◄─────┼────────────────────┼────┼                             │
│  │ │Callback │         │                    │    └─────────────────────────────┘
│  │ │Handler  │         │  8.exchange code   │               │
│  │ └─────────┘         │     for session    │               │ 4.user login
│  │ ┌─────────┐         │ ───────────────────┼───────────────┤
│  │ │Token    │         │                    │               ▼
│  │ │Processor│         │                    │    ┌─────────────────┐
│  │ └─────────┘         │                    │    │   API Server    │
│  └─────────────────────┘                    │    │                 │
│         │                                   │    │ ┌─────────────┐ │
│         │9.session established              │    │ │ Protected   │ │
│         ▼                                   │    │ │ Endpoints   │ │
│  ┌────────────────┐  10.authenticated       │    │ │             │ │
│  │    Your App    │     API calls           │    │ │ GET /data   │ │
│  │ e.g. /feature  │ ────────────────────────┼───►│ │ POST /save  │ │
│  └────────────────┘                         │    │ └─────────────┘ │
│                                             │    │ ┌─────────────┐ │
│                                             │    │ │ Session     │ │
│                                             │    │ │ Validator   │ │
│                                             │    │ │             │ │
│                                             │    │ │ checks with │ │
│                                             │    │ │ auth server │ │
│                                             │    │ └─────────────┘ │
└─────────────────────────────────────────────┘    └─────────────────┘
```

## Session Management Overview

The AuthServerOAuth2Client uses a **cookie-based session management system** for secure authentication:

- **Session Creation**: When you authenticate, the auth server creates a session and sets an HttpOnly domain cookie named `auth-session`
- **Session ID Storage**: The session ID is stored in the cookie, not in client-side storage or response headers
- **Automatic Authentication**: All subsequent requests use `credentials: 'include'` to automatically send the session cookie
- **Cross-Domain Support**: Domain cookies enable seamless authentication across subdomains (e.g., `*.telicent.localhost`)
- **Security**: Access tokens are never exposed to the client - they remain server-side and are accessed via the session

## Authentication Flow Types

### Same-Domain Authentication (Cookie-Based)
For applications running on the same domain or subdomains (e.g., `demo.telicent.localhost`, `api.telicent.localhost`):

- Uses HttpOnly domain cookies for session management
- Session ID automatically included in all requests via cookies
- No manual token handling required
- Works seamlessly across all subdomains

### Cross-Domain Authentication (Header-Based)
For external applications running on different domains:

- Falls back to Authorization header with session ID when cookies cannot be shared
- Session ID stored client-side and manually included in requests
- Requires explicit credential handling for cross-origin requests
- CORS configuration needed for proper security

The client library automatically detects the domain configuration and chooses the appropriate authentication method.

## Quick Integration

### 1. Include the Library

```html
<script src="js/auth-server-oauth.js"></script>
```

### 2. Initialize the Client

```javascript
const authClient = new AuthServerOAuth2Client({
  authServerUrl: "http://auth.telicent.localhost",
  clientId: "spa-client",
  redirectUri: window.location.origin + "/callback.html",
  scope: "openid profile message.read message.write",
});
```

### 3. Basic Authentication Flow

```javascript
// Check if user is authenticated
authClient.isAuthenticated().then((isAuth) => {
  if (isAuth) {
    // User is logged in - show app
    initializeApp();
  } else {
    // Show login button
    showLoginButton();
  }
});

// Handle login
function login() {
  authClient.login(); // Redirects to auth server
}

// Handle logout
function logout() {
  authClient.logout(); // Cleans up and redirects
}
```

## Environment Configurations

### Development (Localhost)

```javascript
const authClient = new AuthServerOAuth2Client({
  authServerUrl: "http://auth.telicent.localhost",
  clientId: "spa-client",
  redirectUri: "http://demo.telicent.localhost/callback.html",
  scope: "openid profile message.read message.write",
});
```

### Production

```javascript
const authClient = new AuthServerOAuth2Client({
  authServerUrl: "https://auth.yourdomain.com",
  clientId: "prod-spa-client",
  redirectUri: "https://app.yourdomain.com/callback.html",
  scope: "openid profile",
});
```

## Common Integration Patterns

### Protected Route Guard

```javascript
function protectedRoute(routeHandler) {
  return async function () {
    const isAuth = await authClient.isAuthenticated();
    if (!isAuth) {
      authClient.login();
      return;
    }
    routeHandler();
  };
}

// Usage
const dashboardRoute = protectedRoute(() => {
  loadDashboard();
});
```

### User Info Display

```javascript
async function displayUserInfo() {
  const isAuth = await authClient.isAuthenticated();
  if (!isAuth) return;

  // Use cached ID token for immediate display
  const userInfo = authClient.getUserInfo();
  if (userInfo) {
    document.getElementById("username").textContent = userInfo.name;
    document.getElementById("email").textContent = userInfo.email;
  }
}
```

### API Calls with Authentication

```javascript
async function fetchProtectedData() {
  try {
    const response = await authClient.makeAuthenticatedRequest(
      "http://api.telicent.localhost/protected/data"
    );

    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (error) {
    if (error.message === "Session expired") {
      // Will automatically redirect to login
      return;
    }
    throw error;
  }
}
```

### Cross-Domain Requests

All requests now use domain cookies for seamless authentication across subdomains:

```javascript
// All requests use domain cookies automatically
const userInfoFromServer = await authClient.makeAuthenticatedRequest(
  "http://auth.telicent.localhost/oauth2/userinfo"
);

const apiData = await authClient.makeAuthenticatedRequest(
  "http://api.telicent.localhost/data"
);

// No need to manually manage Authorization headers - cookies handle authentication
```

## Advanced Usage

### Custom Error Handling

```javascript
class AuthApp {
  constructor() {
    this.authClient = new AuthServerOAuth2Client({
      authServerUrl: "http://auth.telicent.localhost",
      clientId: "spa-client",
      redirectUri: window.location.origin + "/callback.html",
      scope: "openid profile message.read message.write",
    });
  }

  async init() {
    try {
      const isAuth = await this.authClient.isAuthenticated();
      if (isAuth) {
        await this.loadAuthenticatedApp();
      } else {
        this.showLoginScreen();
      }
    } catch (error) {
      this.handleAuthError(error);
    }
  }

  handleAuthError(error) {
    console.error("Authentication error:", error);

    if (error.message.includes("Network")) {
      this.showError("Connection problem. Please try again.");
    } else if (error.message.includes("Session expired")) {
      this.showLoginScreen();
    } else {
      this.showError("Authentication failed. Please contact support.");
    }
  }
}
```

### Session Management

```javascript
class SessionManager {
  constructor(authClient) {
    this.authClient = authClient;
    this.setupSessionCheck();
  }

  setupSessionCheck() {
    // Check session validity every 5 minutes
    setInterval(async () => {
      const isValid = await this.authClient.isAuthenticated();
      if (!isValid) {
        this.handleSessionExpired();
      }
    }, 5 * 60 * 1000);
  }

  handleSessionExpired() {
    this.showSessionExpiredNotification();
    setTimeout(() => {
      this.authClient.login();
    }, 3000);
  }
}
```

### Fresh User Data

```javascript
async function refreshUserProfile() {
  try {
    // Get fresh data from OAuth2 userinfo endpoint
    const freshUserInfo = await authClient.makeAuthenticatedRequest(
      "http://auth.telicent.localhost/oauth2/userinfo"
    );
    const userInfo = await freshUserInfo.json();
    updateUserProfile(userInfo);
  } catch (error) {
    console.error("Failed to refresh user profile:", error);
    // Fall back to cached data from ID token
    const cachedUserInfo = authClient.getUserInfo();
    updateUserProfile(cachedUserInfo);
  }
}
```

## Framework Integration

### React Integration

```javascript
import { useEffect, useState } from "react";

function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const isAuth = await authClient.isAuthenticated();
        setIsAuthenticated(isAuth);

        if (isAuth) {
          const user = authClient.getUserInfo();
          setUserInfo(user);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  const login = () => authClient.login();
  const logout = () => authClient.logout();

  return { isAuthenticated, userInfo, loading, login, logout };
}

// Usage in component
function App() {
  const { isAuthenticated, userInfo, loading, login, logout } = useAuth();

  if (loading) return <div>Loading...</div>;

  return isAuthenticated ? (
    <Dashboard user={userInfo} onLogout={logout} />
  ) : (
    <LoginPage onLogin={login} />
  );
}
```

### Vue Integration

```javascript
// auth.js
import { ref, computed } from "vue";

const authClient = new AuthServerOAuth2Client({
  authServerUrl: "http://auth.telicent.localhost",
  clientId: "spa-client",
  redirectUri: window.location.origin + "/callback.html",
  scope: "openid profile message.read message.write",
});

const isAuthenticated = ref(false);
const userInfo = ref(null);

export function useAuth() {
  const checkAuth = async () => {
    const isAuth = await authClient.isAuthenticated();
    isAuthenticated.value = isAuth;

    if (isAuth) {
      userInfo.value = authClient.getUserInfo();
    }
  };

  const login = () => authClient.login();
  const logout = () => authClient.logout();

  return {
    isAuthenticated: computed(() => isAuthenticated.value),
    userInfo: computed(() => userInfo.value),
    checkAuth,
    login,
    logout,
  };
}
```

## Testing

### Mock Client for Tests

```javascript
class MockAuthClient {
  constructor(options = {}) {
    this.isAuth = options.authenticated || false;
    this.mockUser = options.user || {
      name: "Test User",
      email: "test@example.com",
    };
  }

  async isAuthenticated() {
    return this.isAuth;
  }

  getUserInfo() {
    return this.isAuth ? this.mockUser : null;
  }

  async makeAuthenticatedRequest(url, options) {
    if (!this.isAuth) {
      throw new Error("Session expired");
    }
    return new Response(JSON.stringify({ data: "mock data" }));
  }

  login() {
    this.isAuth = true;
  }

  logout() {
    this.isAuth = false;
  }
}

// Use in tests
const mockClient = new MockAuthClient({ authenticated: true });
```

## Best Practices

### 1. Handle Authentication State Changes

```javascript
// Listen for authentication state changes
window.addEventListener("storage", (e) => {
  if (e.key === "auth_session_id") {
    // Session changed in another tab
    location.reload();
  }
});
```

### 2. Provide User Feedback

```javascript
async function handleLogin() {
  showLoadingSpinner("Redirecting to login...");
  authClient.login();
}

async function handleCallback() {
  showLoadingSpinner("Completing authentication...");

  try {
    await authClient.handleCallback();
    showSuccess("Login successful!");
    setTimeout(() => {
      window.location.href = "/dashboard.html";
    }, 1000);
  } catch (error) {
    hideLoadingSpinner();
    showError("Login failed: " + error.message);
  }
}
```

### 3. Graceful Error Recovery

```javascript
async function makeAuthenticatedApiCall(url, options) {
  try {
    return await authClient.makeAuthenticatedRequest(url, options);
  } catch (error) {
    if (error.message === "Session expired") {
      // Automatic re-authentication
      authClient.login();
      return;
    }

    // Other errors - show user-friendly message
    showError("Unable to complete request. Please try again.");
    throw error;
  }
}
```

---

For complete API documentation, see [API_REFERENCE.md](API_REFERENCE.md).
