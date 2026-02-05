import { Request, Response, NextFunction } from 'express';
import * as tokenService from '../services/token.service';

/**
 * Authentication Middleware
 * Validates JWT tokens and attaches user data to request
 */

// Extend Express Request type to include user data
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        authProvider: string;
        role?: string;
        permissions?: string[];
      };
    }
  }
}

/**
 * JWT Authentication Middleware
 * Validates JWT token and attaches user data to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: 'No authorization token provided',
      });
      return;
    }

    // Extract token (remove 'Bearer ' prefix)
    const token = tokenService.extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Invalid authorization header format',
      });
      return;
    }

    // Validate token and check if blacklisted
    const payload = await tokenService.validateAndCheckToken(token);

    if (!payload) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
      return;
    }

    // Attach user data to request
    req.user = {
      userId: payload.userId,
      email: payload.email,
      authProvider: payload.authProvider,
    };

    // Continue to next middleware/controller
    next();
  } catch (error: any) {
    console.error('Error in authentication middleware:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

/**
 * Optional Authentication Middleware
 * Validates JWT token if present, but doesn't require it
 * Useful for endpoints that work differently for authenticated vs unauthenticated users
 */
export const optionalAuthenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    // If no token, just continue without attaching user
    if (!authHeader) {
      return next();
    }

    // Extract token
    const token = tokenService.extractTokenFromHeader(authHeader);

    if (!token) {
      return next();
    }

    // Validate token and check if blacklisted
    const payload = await tokenService.validateAndCheckToken(token);

    if (payload) {
      // Attach user data to request if token is valid
      req.user = {
        userId: payload.userId,
        email: payload.email,
        authProvider: payload.authProvider,
      };
    }

    // Continue regardless of token validity
    return next();
  } catch (error: any) {
    console.error('Error in optional authentication middleware:', error);
    // Continue even if there's an error
    return next();
  }
};
