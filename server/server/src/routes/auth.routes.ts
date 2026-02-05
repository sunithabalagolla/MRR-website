import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * Auth Routes
 * All authentication-related endpoints
 */

// Registration endpoints (public)
router.post('/register/email', authController.registerWithEmail);
router.post('/register/verify-otp', authController.verifyOTPAndCompleteRegistration);
router.post('/register/google', authController.registerWithGoogle);
router.post('/register/facebook', authController.registerWithFacebook);
router.post('/otp/resend', authController.resendOTP);
router.post('/otp/validate',authController.validateOTP);

// Login endpoints (public)
router.post('/login/email', authController.loginWithEmail);
router.post('/login/google', authController.loginWithGoogle);
router.post('/login/facebook', authController.loginWithFacebook);
router.post('/refresh', authController.refreshAccessToken);

// Password management endpoints
router.post('/password/reset-request', authController.initiatePasswordReset);
router.post('/password/reset-complete', authController.resetPassword);
router.post('/password/change', authenticate, authController.changePassword);

// Logout endpoint (protected)
router.post('/logout', authenticate, authController.logout);

// User profile endpoints (protected)
router.get('/me', authenticate, authController.getCurrentUser);
router.put('/me', authenticate, authController.updateCurrentUser);

export default router;
