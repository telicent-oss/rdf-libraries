// Import zod for runtime validation (handle both Node.js and browser environments)
let z;
let GetUserInfoSchema;

try {
  if (typeof require !== 'undefined') {
    z = require('zod').z;
  }
} catch (e) {
  console.warn('Zod not available in this environment, schema validation will be disabled');
}

/**
 * Zod schema for getUserInfo return type
 * Based on JWTConfig.java and OAuth2 standard claims
 */
if (z) {
  GetUserInfoSchema = z.object({
  // Core user identity (from JWTConfig.java:169-171)
  sub: z.string(),                    // Always present
  email: z.string().email(),          // NOT NULL in DB
  preferred_name: z.string(),         // NOT NULL in DB

  // Standard OIDC claims (always present)
  iss: z.string(),                    // Issuer URL
  aud: z.string(),                    // Audience (client ID)
  exp: z.number(),                    // Expiration timestamp
  iat: z.number(),                    // Issued at timestamp
  jti: z.string(),                    // JWT ID

  // Optional OIDC claims (conditional)
  nonce: z.string().optional(),       // Only if sent in auth request
  auth_time: z.number().optional(),   // Authentication timestamp
  sid: z.string().optional(),         // Session ID
  azp: z.string().optional(),         // Authorized party

  // FE client additions (check your oauth2Client implementation)
  name: z.string().optional(),
  token_expired: z.boolean().optional(),
  token_expires_at: z.string().optional(),
  source: z.string().optional(),
  externalProvider: z.record(z.unknown()).optional(),
  });
}

// ES module and CommonJS exports
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GetUserInfoSchema
  };
  module.exports.default = GetUserInfoSchema;
}

if (typeof exports !== 'undefined' && typeof module === 'undefined') {
  exports.GetUserInfoSchema = GetUserInfoSchema;
  exports.default = GetUserInfoSchema;
}
