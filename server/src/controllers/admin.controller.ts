import { Request, Response } from 'express';
import * as adminService from '../services/admin.service';

/**
 * Admin Controller
 * Handles HTTP requests for admin endpoints
 */

/**  
 * POST /api/admin/login
 * Admin login
 */
export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const result = await adminService.adminLogin(email, password);

    if (!result.success) {
      return res.status(401).json(result);
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in adminLogin controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Admin login failed',
    });
  }
};

/**
 * GET /api/admin/users
 * Get all users with pagination
 */
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await adminService.getAllUsers(page, limit);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Error in getAllUsers controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get users',
    });
  }
};

/**
 * GET /api/admin/users/:id
 * Get user by ID
 */
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await adminService.getUserById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error: any) {
    console.error('Error in getUserById controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get user',
    });
  }
};

/**
 * PUT /api/admin/users/:id
 * Update user
 */
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phoneNumber } = req.body;

    const user = await adminService.updateUser(id, {
      firstName,
      lastName,
      phoneNumber,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user,
    });
  } catch (error: any) {
    console.error('Error in updateUser controller:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to update user',
    });
  }
};

/**
 * DELETE /api/admin/users/:id
 * Delete user
 */
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = await adminService.deleteUser(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error: any) {
    console.error('Error in deleteUser controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete user',
    });
  }
};

/**
 * GET /api/admin/users/search
 * Search users by email or name
 */
export const searchUsers = async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const result = await adminService.searchUsers(query, page, limit);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Error in searchUsers controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to search users',
    });
  }
};

/**
 * GET /api/admin/stats
 * Get user statistics
 */
export const getUserStats = async (_req: Request, res: Response) => {
  try {
    const stats = await adminService.getUserStats();

    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error('Error in getUserStats controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get user statistics',
    });
  }
};

/**
 * GET /api/admin/logs
 * Get authentication logs (placeholder for now)
 */
export const getAuthenticationLogs = async (_req: Request, res: Response) => {
  try {
    // TODO: Implement authentication logs tracking
    // For now, return empty array
    return res.status(200).json({
      success: true,
      logs: [],
      message: 'Authentication logs feature coming soon',
    });
  } catch (error: any) {
    console.error('Error in getAuthenticationLogs controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get authentication logs',
    });
  }
};

/**
 * GET /api/admin/active-users
 * Get active users within timeframe
 */
export const getActiveUsers = async (req: Request, res: Response) => {
  try {
    const timeframeHours = parseInt(req.query.hours as string) || 24;

    const users = await adminService.getActiveUsers(timeframeHours);

    return res.status(200).json({
      success: true,
      users,
      timeframeHours,
    });
  } catch (error: any) {
    console.error('Error in getActiveUsers controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get active users',
    });
  }
};
