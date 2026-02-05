import jwt from 'jsonwebtoken';
import config from '../config/env.config';
import { prisma } from '../models/BlacklistedToken.model';
import { TokenPayload } from '../types/token.types';

/**
 * Token Service
 * Handles JWT token generation, validation, and blacklisting using Prisma
 */

/**
 * Generate JWT access token (24 hours)
 * Supports both user and admin tokens
 * @param userId - User or admin ID
 * @param email - User or admin email
 * @param authProvider - Authentication provider ('email', 'google', or 'admin')
 * @param role - Optional admin role
 * @param permissions - Optional admin permissions
 * @returns JWT access token
 */
export const generateAccessToken = (
  userId: string,
  email: string,
  authProvider: 'email' | 'google' | 'facebook' | 'admin',
  role?: string,
  permissions?: string[]
): string => {
  try {
    const payload: any = {
      userId,
      email,
      authProvider,
    };

    // Add admin-specific fields if provided
    if (role) {
      payload.role = role;
    }
    if (permissions) {
      payload.permissions = permissions;
    }

    // @ts-ignore - TypeScript has issues with jwt.sign overloads
    const token: string = jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiry, // 24 hours
    });

    return token;
  } catch (error) {
    console.error('Error generating access token:', error);
    throw new Error('Failed to generate access token');
  }
};

/**
 * Generate JWT refresh token (7 days)
 * @param user - User object with id and email
 * @returns JWT refresh token
 */
export const generateRefreshToken = (user: {
  id: string;
  email: string;
}): string => {
  try {
    const payload = {
      userId: user.id,
      email: user.email,
      type: 'refresh', // Mark as refresh token
    };

    // @ts-ignore - TypeScript has issues with jwt.sign overloads
    const token: string = jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.refreshTokenExpiry, // 7 days
    });

    return token;
  } catch (error) {
    console.error('Error generating refresh token:', error);
    throw new Error('Failed to generate refresh token');
  }
};

/**
 * Validate JWT token
 * @param token - JWT token to validate
 * @returns Token payload if valid, null if invalid
 */
export const validateToken = (token: string): TokenPayload | null => {
  try {
    // Input validation
    if (!token || typeof token !== 'string') {
      return null;
    }

    // Remove 'Bearer ' prefix if present
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;

    // Verify token signature and expiry
    const decoded = jwt.verify(cleanToken, config.jwtSecret) as TokenPayload;

    // Return payload
    return {
      userId: decoded.userId,
      email: decoded.email,
      authProvider: decoded.authProvider,
      iat: decoded.iat,
      exp: decoded.exp,
    };
  } catch (error) {
    // Token is invalid or expired
    if (error instanceof jwt.JsonWebTokenError) {
      console.log('Invalid token signature');
    } else if (error instanceof jwt.TokenExpiredError) {
      console.log('Token has expired');
    } else {
      console.error('Error validating token:', error);
    }
    return null;
  }
};

/**
 * Blacklist a token (for logout)
 * @param token - JWT token to blacklist
 * @param userId - User ID who owns the token
 */
export const blacklistToken = async (
  token: string,
  userId: string
): Promise<void> => {
  try {
    // Remove 'Bearer ' prefix if present
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;

    // Decode token to get expiry time (don't verify, just decode)
    const decoded = jwt.decode(cleanToken) as { exp?: number };

    if (!decoded || !decoded.exp) {
      throw new Error('Invalid token format');
    }

    // Calculate expiry date from token
    const expiresAt = new Date(decoded.exp * 1000);

    // Add token to blacklist
    await prisma.blacklistedToken.create({
      data: {
        token: cleanToken,
        userId,
        expiresAt,
      },
    });

    console.log(`✅ Token blacklisted for user ${userId}`);
  } catch (error) {
    console.error('Error blacklisting token:', error);
    throw new Error('Failed to blacklist token');
  }
};

/**
 * Check if a token is blacklisted
 * @param token - JWT token to check
 * @returns True if blacklisted, false otherwise
 */
export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  try {
    // Remove 'Bearer ' prefix if present
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;

    // Check if token exists in blacklist
    const blacklistedToken = await prisma.blacklistedToken.findUnique({
      where: { token: cleanToken },
    });

    return blacklistedToken !== null;
  } catch (error) {
    console.error('Error checking token blacklist:', error);
    // On error, assume token is not blacklisted (fail open for availability)
    return false;
  }
};

/**
 * Validate token and check if blacklisted
 * Combined function for convenience
 * @param token - JWT token to validate
 * @returns Token payload if valid and not blacklisted, null otherwise
 */
export const validateAndCheckToken = async (
  token: string
): Promise<TokenPayload | null> => {
  try {
    // First validate token signature and expiry
    const payload = validateToken(token);

    if (!payload) {
      return null;
    }

    // Then check if token is blacklisted
    const isBlacklisted = await isTokenBlacklisted(token);

    if (isBlacklisted) {
      console.log('Token is blacklisted (user logged out)');
      return null;
    }

    return payload;
  } catch (error) {
    console.error('Error validating and checking token:', error);
    return null;
  }
};

/**
 * Extract token from Authorization header
 * @param authHeader - Authorization header value
 * @returns Token string or null
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader) {
    return null;
  }

  // Check if header starts with 'Bearer '
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }

  // Extract token (remove 'Bearer ' prefix)
  const token = authHeader.slice(7);

  return token || null;
};
