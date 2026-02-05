import { Request, Response } from 'express';
import * as authService from '../services/auth.service';

/**
 * Auth Controller
 * Handles HTTP requests for authentication endpoints
 */

/**
 * POST /api/auth/register/email
 * Initiate email registration (send OTP)
 */
export const registerWithEmail = async (req: Request, res: Response) => {
  try {
    console.log('🔵 Registration request received:', req.body);
    const { firstName, lastName, email, phoneNumber } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'First name, last name, and email are required',
      });
    }

    console.log(`🔵 Processing registration for: ${email}`);
    const result = await authService.registerWithEmail({
      firstName,
      lastName,
      email,
      phoneNumber,
    });

    console.log(`✅ Registration successful for: ${email}`);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('❌ Error in registerWithEmail controller:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Registration failed',
    });
  }
};

/**
 * POST /api/auth/register/verify-otp
 * Verify OTP and complete registration
 */
export const verifyOTPAndCompleteRegistration = async (
  req: Request,
  res: Response
) => {
  try {
    const { email, otp, password, firstName, lastName, phoneNumber } = req.body;

    // Validate required fields
    if (!email || !otp || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, password, first name, and last name are required',
      });
    }

    const result = await authService.verifyOTPAndCompleteRegistration(
      email,
      otp,
      password,
      firstName,
      lastName,
      phoneNumber
    );

    return res.status(201).json({
      success: true,
      message: 'Registration completed successfully',
      ...result,
    });
  } catch (error: any) {
    console.error('Error in verifyOTPAndCompleteRegistration controller:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'OTP verification failed',
    });
  }
};




/**
 * POST /api/auth/register/google
 * Register or login with Google
 */
export const registerWithGoogle = async (req: Request, res: Response) => {
  try {
    const { googleToken } = req.body;

    // Validate required fields
    if (!googleToken) {
      return res.status(400).json({
        success: false,
        message: 'Google token is required',
      });
    }

    const result = await authService.registerWithGoogle(googleToken);

    return res.status(result.isNewUser ? 201 : 200).json({
      success: true,
      message: result.isNewUser
        ? 'Registration completed successfully'
        : 'Login successful',
      ...result,
    });
  } catch (error: any) {
    console.error('Error in registerWithGoogle controller:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Google authentication failed',
    });
  }
};

/**
 * POST /api/auth/otp/resend
 * Resend OTP
 */
export const resendOTP = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    // For now, just call registerWithEmail again to resend OTP
    // In production, you might want a dedicated resendOTP service method
    const result = await authService.registerWithEmail({
      email,
      firstName: '', // These won't be used for resend
      lastName: '',
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in resendOTP controller:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to resend OTP',
    });
  }
};


/**
 * POST /api/auth/otp/validate
 * Validate OTP without creating user
 */
export const validateOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    // Validate required fields
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required',
      });
    }

    const result = await authService.validateOTP(email, otp);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in validateOTP controller:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to validate OTP',
    });
  }
};

/**
 * POST /api/auth/login/email
 * Login with email and password
 */
export const loginWithEmail = async (req: Request, res: Response) => {
  try {
    const { email, password, rememberMe } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const result = await authService.loginWithEmail(email, password, rememberMe);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      ...result,
    });
  } catch (error: any) {
    console.error('Error in loginWithEmail controller:', error);
    return res.status(401).json({
      success: false,
      message: error.message || 'Login failed',
    });
  }
};

/**
 * POST /api/auth/login/google
 * Login with Google
 */
export const loginWithGoogle = async (req: Request, res: Response) => {
  try {
    const { googleToken } = req.body;

    // Validate required fields
    if (!googleToken) {
      return res.status(400).json({
        success: false,
        message: 'Google token is required',
      });
    }

    const result = await authService.loginWithGoogle(googleToken);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      ...result,
    });
  } catch (error: any) {
    console.error('Error in loginWithGoogle controller:', error);
    return res.status(401).json({
      success: false,
      message: error.message || 'Google login failed',
    });
  }
};

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    // Validate required fields
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    const result = await authService.refreshAccessToken(refreshToken);

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      ...result,
    });
  } catch (error: any) {
    console.error('Error in refreshAccessToken controller:', error);
    return res.status(401).json({
      success: false,
      message: error.message || 'Token refresh failed',
    });
  }
};

/**
 * POST /api/auth/password/reset-request
 * Initiate password reset (send OTP)
 */
export const initiatePasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const result = await authService.initiatePasswordReset(email);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in initiatePasswordReset controller:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Password reset request failed',
    });
  }
};

/**
 * POST /api/auth/password/reset-complete
 * Complete password reset with OTP
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Validate required fields
    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and new password are required',
      });
    }

    const result = await authService.resetPassword(email, otp, newPassword);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in resetPassword controller:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Password reset failed',
    });
  }
};

/**
 * POST /api/auth/password/change
 * Change password from profile (requires authentication)
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = (req as any).user?.userId; // From auth middleware

    // Validate required fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password, new password, and confirmation are required',
      });
    }

    // Validate user is authenticated
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const result = await authService.changePassword(
      userId,
      currentPassword,
      newPassword,
      confirmPassword
    );

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in changePassword controller:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Password change failed',
    });
  }
};

/**
 * POST /api/auth/logout
 * Logout and blacklist token
 */
export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    const userId = (req as any).user?.userId; // From auth middleware

    // Validate token exists
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'No token provided',
      });
    }

    // Validate user is authenticated
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    await authService.logout(token, userId);

    return res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error: any) {
    console.error('Error in logout controller:', error);
    // Always return success for logout
    return res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  }
};

/**
 * GET /api/auth/me
 * Get current user profile
 */
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId; // From auth middleware

    // Validate user is authenticated
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Get user from repository
    const userRepository = require('../repositories/user.repository');
    const user = await userRepository.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        authProvider: user.authProvider,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (error: any) {
    console.error('Error in getCurrentUser controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
    });
  }
};

/**
 * PUT /api/auth/me
 * Update current user profile
 */
export const updateCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId; // From auth middleware
    const { firstName, lastName, phoneNumber } = req.body;

    // Validate user is authenticated
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Update user profile
    const userRepository = require('../repositories/user.repository');
    const user = await userRepository.updateProfile(userId, {
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
      message: 'Profile updated successfully',
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        authProvider: user.authProvider,
      },
    });
  } catch (error: any) {
    console.error('Error in updateCurrentUser controller:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to update profile',
    });
  }
};

/**
 * POST /api/auth/register/facebook
 * Register or login with Facebook
 */
export const registerWithFacebook = async (req: Request, res: Response) => {
  try {
    const { facebookToken } = req.body;

    // Validate required fields
    if (!facebookToken) {
      return res.status(400).json({
        success: false,
        message: 'Facebook token is required',
      });
    }

    const result = await authService.registerWithFacebook(facebookToken);

    const statusCode = result.isNewUser ? 201 : 200;
    const message = result.isNewUser
      ? 'Registration successful'
      : 'Login successful';

    return res.status(statusCode).json({
      success: true,
      message,
      ...result,
    });
  } catch (error: any) {
    console.error('Error in registerWithFacebook controller:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Facebook authentication failed',
    });
  }
};

/**
 * POST /api/auth/login/facebook
 * Login with Facebook
 */
export const loginWithFacebook = async (req: Request, res: Response) => {
  try {
    const { facebookToken } = req.body;

    // Validate required fields
    if (!facebookToken) {
      return res.status(400).json({
        success: false,
        message: 'Facebook token is required',
      });
    }

    const result = await authService.loginWithFacebook(facebookToken);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      ...result,
    });
  } catch (error: any) {
    console.error('Error in loginWithFacebook controller:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Facebook login failed',
    });
  }
};
