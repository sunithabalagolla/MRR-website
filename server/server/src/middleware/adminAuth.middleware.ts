import { Request, Response, NextFunction } from 'express';
import * as tokenService from '../services/token.service';

/**
 * Admin Authentication Middleware
 * Validates JWT tokens with admin role and attaches admin data to request
 */

/**
 * Admin Authentication Middleware
 * Extends JWT authentication to verify admin role
 */
export const authenticateAdmin = async (
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

    // Validate token (don't check blacklist for admin tokens for now)
    const payload = tokenService.validateToken(token);

    if (!payload) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
      return;
    }

    // Check if token is for admin
    if (payload.authProvider !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
      return;
    }

    // Attach admin data to request
    req.user = {
      userId: payload.userId,
      email: payload.email,
      authProvider: payload.authProvider,
      role: payload.role,
      permissions: payload.permissions,
    };

    // Continue to next middleware/controller
    next();
  } catch (error: any) {
    console.error('Error in admin authentication middleware:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

/**
 * Permission Check Middleware Factory
 * Creates middleware that checks if admin has specific permission
 * @param permission - Required permission (e.g., 'users:write', 'users:delete')
 */
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // Check if user has the required permission
      if (!user.permissions || !user.permissions.includes(permission)) {
        res.status(403).json({
          success: false,
          message: `Access denied. Required permission: ${permission}`,
        });
        return;
      }

      // User has permission, continue
      next();
    } catch (error: any) {
      console.error('Error in permission check middleware:', error);
      res.status(500).json({
        success: false,
        message: 'Permission check failed',
      });
    }
  };
};

/**
 * Super Admin Only Middleware
 * Restricts access to super admins only
 */
export const requireSuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // Check if user is super admin
    if (user.role !== 'super_admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Super admin privileges required.',
      });
      return;
    }

    // User is super admin, continue
    next();
  } catch (error: any) {
    console.error('Error in super admin check middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Authorization check failed',
    });
  }
};
