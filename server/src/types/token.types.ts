export interface IBlacklistedToken {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface TokenPayload {
  userId: string;
  email: string;
  authProvider: 'email' | 'google' | 'facebook' | 'admin';
  role?: string;
  permissions?: string[];
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}
