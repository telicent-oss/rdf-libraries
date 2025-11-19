# @telicent-oss/fe-auth-lib

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)
![Node Version](https://img.shields.io/badge/node-%3E%3D20.14.0-brightgreen.svg)

OAuth2 client library for Telicent Authentication Server

Browser-based OAuth2 Authorization Code + PKCE client. Supports both same-domain (cookie-based) and cross-domain (header-based) authentication.

## Background

This library implements OAuth2 Authorization Code flow with PKCE for browser applications. It handles login redirects, callback processing, session management, and authenticated API requests.

The library detects whether the application and auth server share a domain (e.g., `app.telicent.localhost` and `auth.telicent.localhost`) or operate cross-domain (e.g., `localhost:3000` and `auth.telicent.localhost`). Based on this detection, it uses cookies or Authorization headers for authentication.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Browser Environment                         │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐     │
│  │   Application   │    │   fe-auth-lib   │    │  Redirect Page  │     │
│  │                 │◄──►│                 │◄──►│                 │     │
│  │  - Business     │    │  - OAuth Client │    │  - Callback     │     │
│  │    Logic        │    │  - Session Mgmt │    │    Handler      │     │
│  │  - UI/UX        │    │  - API Wrapper  │    │  - Token Proc   │     │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
           │                       │                       │
           │ ┌─────────────────────┼───────────────────────┼─────────┐
           │ │               OAuth Flow                    │         │
           ▼ ▼                     ▼                       ▼         ▼
┌─────────────────────────────┐              ┌─────────────────┐
│        Auth Server          │◄────────────►│   API Server    │
│                             │              │                 │
│  - Login UI                 │              │  - Protected    │
│  - OAuth Engine             │              │    Endpoints    │
│  - Session Creation         │              │  - Session      │
│  - Token Management         │              │    Check        │
│                             │              │                 │
│  ┌─────────────────────────┐ │              └─────────────────┘
│  │      Database           │ │
│  │                         │ │
│  │  ┌─────────────────┐    │ │
│  │  │   Client Config │    │ │
│  │  │   - clientId    │    │ │
│  │  │   - scopes      │    │ │
│  │  │   - redirects   │    │ │
│  │  └─────────────────┘    │ │
│  │  ┌─────────────────┐    │ │
│  │  │   User Sessions │    │ │
│  │  │   - session_id  │    │ │
│  │  │   - user_data   │    │ │
│  │  │   - expiry      │    │ │
│  │  └─────────────────┘    │ │
│  └─────────────────────────┘ │
└─────────────────────────────┘
```

### Flow

1. Application initializes client with configuration
2. Client checks for existing session
3. User redirects to auth server for login
4. Auth server authenticates user
5. Auth server redirects back with authorization code
6. Client exchanges code for tokens and creates session
7. API requests include session credentials automatically
8. Client validates and refreshes session as needed

### Authentication Modes

**Same-Domain**: Applications on the same domain (*.telicent.localhost) use secure cookies. Sessions are included in requests automatically.

**Cross-Domain**: Applications on different domains use Authorization headers with session tokens. The library stores tokens and includes them in cross-domain requests.

## Install

```bash
npm install @telicent-oss/fe-auth-lib
```

or

```bash
yarn add @telicent-oss/fe-auth-lib
```

## Usage

### Setup

```javascript
import AuthServerOAuth2Client from '@telicent-oss/fe-auth-lib';

const authClient = new AuthServerOAuth2Client({
  authServerUrl: 'http://auth.telicent.localhost',
  clientId: 'spa-client',
  redirectUri: window.location.origin + '/callback.html',
  scope: 'openid email profile offline_access'
});
```

### Login

```javascript
// Redirect to auth server
await authClient.login();
```

### Handle Callback

```javascript
// In callback page
try {
  const sessionData = await authClient.handleCallback();
  window.location.href = '/dashboard';
} catch (error) {
  console.error('Callback failed:', error);
}
```

### Check Authentication

```javascript
const isAuthenticated = await authClient.isAuthenticated();
if (isAuthenticated) {
  const userInfo = authClient.getUserInfo();
  console.log('User:', userInfo.email);
}
```

### Authenticated Requests

```javascript
const response = await authClient.makeAuthenticatedRequest(
  'http://api.telicent.localhost/data'
);
const data = await response.json();
```

### Logout

```javascript
await authClient.logout();
```

<details>
<summary>Additional Usage</summary>

### Popup Login

```javascript
await authClient.loginWithPopup();

window.addEventListener('oauth-success', (event) => {
  console.log('Authenticated:', event.detail);
});
```

### Schema Validation

```javascript
import { GetUserInfoSchema } from '@telicent-oss/fe-auth-lib/schemas';

const validatedUserInfo = GetUserInfoSchema.parse(userData);
```

</details>

## API

See [API_REFERENCE.md](API_REFERENCE.md) and [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md).

### Methods

- `login(redirectUri?)` - Redirect to auth server
- `loginWithPopup(redirectUri?, features?)` - Open auth in popup
- `handleCallback(callbackParams?)` - Process OAuth callback
- `isAuthenticated()` - Check session validity
- `getUserInfo()` - Get user info from ID token (validated with Zod schema)
- `getUserInfoFromAPI()` - Fetch fresh user info from auth server
- `makeAuthenticatedRequest(url, options?)` - Make authenticated request
- `logout()` - Destroy session

### Configuration

```typescript
interface AuthServerOAuth2ClientConfig {
  clientId?: string;              // OAuth2 client ID
  authServerUrl?: string;         // Auth server base URL
  redirectUri?: string;           // OAuth callback URI
  popupRedirectUri?: string;      // Popup callback URI
  scope?: string;                 // OAuth2 scopes
  onLogout?: () => void;          // Logout callback function
}
```

## Related Repositories

- [telicent-auth-server](https://github.com/telicent-oss/telicent-auth-server) - Authentication server backend
- [rdf-libraries](https://github.com/telicent-oss/rdf-libraries) - Parent monorepo

## Definitions

- **PKCE** - Proof Key for Code Exchange, OAuth2 security extension for public clients
- **Same-domain** - Client and auth server share parent domain (e.g., `*.telicent.localhost`)
- **Cross-domain** - Client and auth server on different domains
- **ID Token** - JWT containing user identity claims, cached locally
- **Session Token** - Opaque token for cross-domain authentication via Authorization header
