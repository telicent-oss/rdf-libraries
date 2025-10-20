# Telicent Frontend Authentication Library

A browser library for OAuth2 authentication with Telicent's auth-server. Built for easy integration into frontend applications.

## Quick Introduction

This library handles OAuth2 authentication for frontend apps that connect to Telicent's auth-server. It takes care of the full login process - redirects, callbacks, sessions, and secure API calls. It works with both same-domain apps (using cookies) and cross-domain apps (using headers).

The library works with modern web apps and hides OAuth2 complexity while giving you control when needed. You can use it with React, Vue, or plain JavaScript. It provides the same authentication patterns no matter how you deploy your app.

Main features: automatic session detection, secure login handling, cross-domain support, and works with any framework. The library follows security best practices with secure cookies, automatic session refresh, and protection against common web attacks.

## Architecture Overview

The authentication system uses standard OAuth2 Authorization Code flow with PKCE, with improvements for domain-specific needs:

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

### Flow Summary

1. **Setup**: Your app starts fe-auth-lib with client settings
2. **Check Login**: Library checks if user already has a valid session
3. **Login Process**: If not logged in, sends user to auth server login page
4. **User Login**: User logs in and approves app access
5. **Return**: Auth server sends user back with authorization code
6. **Get Session**: Library trades code for tokens and creates session
7. **API Calls**: All API requests now include session info automatically
8. **Stay Logged In**: Library keeps checking and renewing session as needed

### Authentication Modes

**Same-Domain Mode**: Apps on the same domain (*.telicent.localhost) use secure domain cookies for easy authentication. Sessions work automatically in all requests without extra setup.

**Cross-Domain Mode**: External apps use Authorization headers with session tokens. The library handles token storage and adds them to cross-domain requests with proper security settings.

### Component Jobs

- **Application**: Your business logic, UI display, protecting routes
- **fe-auth-lib**: Runs OAuth flow, manages sessions, handles API authentication
- **Redirect Page**: Processes OAuth callback, handles tokens, talks to popup windows
- **Auth Server**: User login, permission grants, session creation, stores client/session data
- **API Server**: Serves protected resources, checks if sessions are still valid

This setup provides secure, scalable authentication while keeping integration simple. The library handles security complexity and gives you clean APIs for common authentication tasks.

For detailed setup instructions, see [INTEGRATION.md](INTEGRATION.md).
For complete API documentation, see [API_REFERENCE.md](API_REFERENCE.md).