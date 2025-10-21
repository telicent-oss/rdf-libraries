import { z } from 'zod';

/**
 * Zod schema for getUserInfo return type
 * Based on JWTConfig.java and OAuth2 standard claims
 */
export declare const GetUserInfoSchema: z.ZodObject<{
  // Core user identity (from JWTConfig.java:169-171)
  sub: z.ZodString;
  email: z.ZodString;
  preferred_name: z.ZodString;

  // Standard OIDC claims (always present)
  iss: z.ZodString;
  aud: z.ZodString;
  exp: z.ZodNumber;
  iat: z.ZodNumber;
  jti: z.ZodString;

  // Optional OIDC claims (conditional)
  nonce: z.ZodOptional<z.ZodString>;
  auth_time: z.ZodOptional<z.ZodNumber>;
  sid: z.ZodOptional<z.ZodString>;
  azp: z.ZodOptional<z.ZodString>;

  // FE client additions
  name: z.ZodOptional<z.ZodString>;
  token_expired: z.ZodOptional<z.ZodBoolean>;
  token_expires_at: z.ZodOptional<z.ZodString>;
  source: z.ZodOptional<z.ZodString>;
  externalProvider: z.ZodOptional<z.ZodRecord<z.ZodUnknown>>;
}>;

/**
 * TypeScript type inferred from GetUserInfoSchema
 */
export type UserInfo = z.infer<typeof GetUserInfoSchema>;

export default GetUserInfoSchema;
