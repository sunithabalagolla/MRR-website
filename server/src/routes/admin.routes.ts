import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { authenticateAdmin, requirePermission } from '../middleware/adminAuth.middleware';

const router = Router();

/**
 * Admin Routes
 * All admin-related endpoints protected with admin authentication
 */

// Admin login (public)
router.post('/login', adminController.adminLogin);

// User management endpoints (protected)
router.get('/users', authenticateAdmin, requirePermission('users:read'), adminController.getAllUsers);
router.get('/users/search', authenticateAdmin, requirePermission('users:read'), adminController.searchUsers);
router.get('/users/:id', authenticateAdmin, requirePermission('users:read'), adminController.getUserById);
router.put('/users/:id', authenticateAdmin, requirePermission('users:write'), adminController.updateUser);
router.delete('/users/:id', authenticateAdmin, requirePermission('users:delete'), adminController.deleteUser);

// Analytics endpoints (protected)
router.get('/stats', authenticateAdmin, requirePermission('stats:read'), adminController.getUserStats);
router.get('/logs', authenticateAdmin, requirePermission('logs:read'), adminController.getAuthenticationLogs);
router.get('/active-users', authenticateAdmin, requirePermission('stats:read'), adminController.getActiveUsers);

export default router;
