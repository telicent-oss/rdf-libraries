const { AuthServerOAuth2ClientConfigSchema } = require("./schemas.js");

describe("AuthServerOAuth2ClientConfigSchema", () => {
  it("validates config inputs", () => {
    const inputs = [
      {
        label: "absolute https URL",
        popupRedirectUri: "https://example.com/popup-callback",
      },
      {
        label: "absolute http URL",
        popupRedirectUri: "http://localhost:3000/popup-callback",
      },
      { label: "null value", popupRedirectUri: null },
      { label: "omitted field", clientId: "test-client" },
      {
        label: "all fields with absolute URLs",
        clientId: "test-client",
        authServerUrl: "https://auth.example.com",
        redirectUri: "https://app.example.com/callback",
        popupRedirectUri: "https://app.example.com/popup",
        apiUrl: "https://api.example.com",
        scope: "openid profile email",
      },

      {
        label: "relative slash URL in popupRedirectUri",
        popupRedirectUri: "/popup-callback",
      },
      {
        label: "relative dot-slash URL in popupRedirectUri",
        popupRedirectUri: "./popup-callback",
      },
      {
        label: "URL without protocol in popupRedirectUri",
        popupRedirectUri: "example.com/popup-callback",
      },
      {
        label: "protocol-relative URL in popupRedirectUri",
        popupRedirectUri: "//example.com/popup-callback",
      },
      { label: "relative URL in authServerUrl", authServerUrl: "/auth" },
      { label: "relative URL in redirectUri", redirectUri: "/callback" },
      { label: "relative URL in apiUrl", apiUrl: "/api" },
      {
        label: "unknown property",
        clientId: "test-client",
        unknownProperty: "should-be-rejected",
      },
    ];

    const results = inputs.map(({ label, ...input }) => {
      const result = AuthServerOAuth2ClientConfigSchema.safeParse(input);

      if (result.success) {
        return `✓ ${label}`;
      }

      const errorDetails = result.error.issues
        .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
        .join(", ");

      return `✗ ${label} → ${errorDetails}`;
    });

    expect(results).toMatchInlineSnapshot(`
      [
        "✗ absolute https URL → clientId: Invalid input: expected string, received undefined, authServerUrl: Invalid input: expected string, received undefined, redirectUri: Invalid input: expected string, received undefined, scope: Invalid input: expected string, received undefined, onLogout: Invalid input: expected function, received undefined",
        "✗ absolute http URL → clientId: Invalid input: expected string, received undefined, authServerUrl: Invalid input: expected string, received undefined, redirectUri: Invalid input: expected string, received undefined, scope: Invalid input: expected string, received undefined, onLogout: Invalid input: expected function, received undefined",
        "✗ null value → clientId: Invalid input: expected string, received undefined, authServerUrl: Invalid input: expected string, received undefined, redirectUri: Invalid input: expected string, received undefined, popupRedirectUri: Invalid input: expected string, received null, scope: Invalid input: expected string, received undefined, onLogout: Invalid input: expected function, received undefined",
        "✗ omitted field → authServerUrl: Invalid input: expected string, received undefined, redirectUri: Invalid input: expected string, received undefined, popupRedirectUri: Invalid input: expected string, received undefined, scope: Invalid input: expected string, received undefined, onLogout: Invalid input: expected function, received undefined",
        "✗ all fields with absolute URLs → onLogout: Invalid input: expected function, received undefined, root: Unrecognized key: "apiUrl"",
        "✗ relative slash URL in popupRedirectUri → clientId: Invalid input: expected string, received undefined, authServerUrl: Invalid input: expected string, received undefined, redirectUri: Invalid input: expected string, received undefined, popupRedirectUri: Invalid URL, scope: Invalid input: expected string, received undefined, onLogout: Invalid input: expected function, received undefined",
        "✗ relative dot-slash URL in popupRedirectUri → clientId: Invalid input: expected string, received undefined, authServerUrl: Invalid input: expected string, received undefined, redirectUri: Invalid input: expected string, received undefined, popupRedirectUri: Invalid URL, scope: Invalid input: expected string, received undefined, onLogout: Invalid input: expected function, received undefined",
        "✗ URL without protocol in popupRedirectUri → clientId: Invalid input: expected string, received undefined, authServerUrl: Invalid input: expected string, received undefined, redirectUri: Invalid input: expected string, received undefined, popupRedirectUri: Invalid URL, scope: Invalid input: expected string, received undefined, onLogout: Invalid input: expected function, received undefined",
        "✗ protocol-relative URL in popupRedirectUri → clientId: Invalid input: expected string, received undefined, authServerUrl: Invalid input: expected string, received undefined, redirectUri: Invalid input: expected string, received undefined, popupRedirectUri: Invalid URL, scope: Invalid input: expected string, received undefined, onLogout: Invalid input: expected function, received undefined",
        "✗ relative URL in authServerUrl → clientId: Invalid input: expected string, received undefined, authServerUrl: Invalid URL, redirectUri: Invalid input: expected string, received undefined, popupRedirectUri: Invalid input: expected string, received undefined, scope: Invalid input: expected string, received undefined, onLogout: Invalid input: expected function, received undefined",
        "✗ relative URL in redirectUri → clientId: Invalid input: expected string, received undefined, authServerUrl: Invalid input: expected string, received undefined, redirectUri: Invalid URL, popupRedirectUri: Invalid input: expected string, received undefined, scope: Invalid input: expected string, received undefined, onLogout: Invalid input: expected function, received undefined",
        "✗ relative URL in apiUrl → clientId: Invalid input: expected string, received undefined, authServerUrl: Invalid input: expected string, received undefined, redirectUri: Invalid input: expected string, received undefined, popupRedirectUri: Invalid input: expected string, received undefined, scope: Invalid input: expected string, received undefined, onLogout: Invalid input: expected function, received undefined, root: Unrecognized key: "apiUrl"",
        "✗ unknown property → authServerUrl: Invalid input: expected string, received undefined, redirectUri: Invalid input: expected string, received undefined, popupRedirectUri: Invalid input: expected string, received undefined, scope: Invalid input: expected string, received undefined, onLogout: Invalid input: expected function, received undefined, root: Unrecognized key: "unknownProperty"",
      ]
    `);
  });
});
