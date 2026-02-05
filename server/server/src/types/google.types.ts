/**
 * Google OAuth Types
 */

export interface GoogleUserInfo {
  sub: string; // Google ID
  email: string;
  email_verified: boolean;
  name: string;
  given_name: string; // First name
  family_name: string; // Last name
  picture?: string; // Profile picture URL
  locale?: string;
}

export interface GoogleTokenPayload {
  iss: string; // Issuer
  sub: string; // Google ID
  azp: string; // Authorized party
  aud: string; // Audience (our client ID)
  iat: number; // Issued at
  exp: number; // Expiry
  email: string;
  email_verified: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture?: string;
  locale?: string;
}
