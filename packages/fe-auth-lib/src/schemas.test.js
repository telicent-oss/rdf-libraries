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
        "✓ absolute https URL",
        "✓ absolute http URL",
        "✓ null value",
        "✓ omitted field",
        "✓ all fields with absolute URLs",
        "✗ relative slash URL in popupRedirectUri → popupRedirectUri: Invalid url",
        "✗ relative dot-slash URL in popupRedirectUri → popupRedirectUri: Invalid url",
        "✗ URL without protocol in popupRedirectUri → popupRedirectUri: Invalid url",
        "✗ protocol-relative URL in popupRedirectUri → popupRedirectUri: Invalid url",
        "✗ relative URL in authServerUrl → authServerUrl: Invalid url",
        "✗ relative URL in redirectUri → redirectUri: Invalid url",
        "✗ relative URL in apiUrl → apiUrl: Invalid url",
        "✗ unknown property → root: Unrecognized key(s) in object: 'unknownProperty'",
      ]
    `);
  });
});
