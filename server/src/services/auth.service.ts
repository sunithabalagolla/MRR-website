import * as userRepository from '../repositories/user.repository';
import * as passwordService from './password.service';
import * as otpService from './otp.service';
import * as tokenService from './token.service';
import * as emailService from './email.service';
import * as googleOAuthService from './googleOAuth.service';
import * as validationService from './validation.service';

/**
 * Authentication Service
 * Main business logic for user authentication flows
 */

/**
 * Register user with email (Step 1: Send OTP)
 */
export const registerWithEmail = async (data: {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
}): Promise<{ success: boolean; message: string }> => {
  try {
    // Validate and sanitize input
    const validationResult = validationService.validateRegistrationData(data);
    if (!validationResult.isValid) {
      throw new Error(validationResult.errors.join(', '));
    }

    const sanitizedData = validationService.sanitizeRegistrationData(data);

    // Check if email already exists
    const existingUser = await userRepository.findByEmail(sanitizedData.email);
    if (existingUser) {
      throw new Error('Email already registered. Please login instead.');
    }

    // Generate and send OTP
    const otp = await otpService.generateOTP(sanitizedData.email);
    console.log(`📧 Generated OTP for ${sanitizedData.email}: ${otp}`);
    
    // Send email (await to catch errors properly)
    try {
      await emailService.sendOTP(sanitizedData.email, otp, sanitizedData.firstName);
      console.log(`✅ OTP email sent successfully to ${sanitizedData.email}`);
    } catch (err: any) {
      console.error('❌ Failed to send OTP email to', sanitizedData.email, ':', err.message);
      console.error('❌ Full error:', err);
      throw new Error('Failed to send OTP email. Please try again.');
    }

    return {
      success: true,
      message: 'OTP sent to your email. Please verify to complete registration.',
    };
  } catch (error: any) {
    console.error('Error in registerWithEmail:', error);
    throw error;
  }
};

/**
 * Validate OTP (Step 2: Verify OTP only, don't create user yet)
 */
export const validateOTP = async (
  email: string,
  otp: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // Validate OTP
    const otpResult = await otpService.validateOTP(email, otp);
    
    if (!otpResult.isValid) {
      throw new Error(otpResult.message);
    }

    return {
      success: true,
      message: 'OTP verified successfully',
    };
  } catch (error: any) {
    console.error('Error in validateOTP:', error);
    throw error;
  }
};




/**
 * Verify OTP and complete email registration (Step 2)
 */
export const verifyOTPAndCompleteRegistration = async (
  email: string,
  otp: string,
  password: string,
  firstName: string,
  lastName: string,
  phoneNumber?: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  user: any;
}> => {
  try {
    // Validate OTP
    const otpResult = await otpService.validateOTP(email, otp);
    if (!otpResult.isValid) {
      throw new Error(otpResult.message);
    }

    // Validate password strength
    const passwordValidation = passwordService.validatePasswordStrength(password, {
      email,
      firstName,
      lastName,
    });
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join(', '));
    }

    // Hash password
    const passwordHash = await passwordService.hashPassword(password);

    // Create user
    const user = await userRepository.createUser({
      email: email.toLowerCase(),
      firstName,
      lastName,
      phoneNumber,
      passwordHash,
      authProvider: 'email',
    });

    // Generate tokens
    const accessToken = tokenService.generateAccessToken(
      user.id,
      user.email,
      user.authProvider
    );
    const refreshToken = tokenService.generateRefreshToken({
      id: user.id,
      email: user.email,
    });

    // Send welcome email in background (non-blocking)
    emailService.sendWelcomeEmail(user.email, user.firstName).catch((err) => {
      console.error('❌ Failed to send welcome email to', user.email, ':', err.message);
      // Email failure is logged but doesn't block user flow
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        authProvider: user.authProvider,
        createdAt: user.createdAt,
      },
    };
  } catch (error: any) {
    console.error('Error in verifyOTPAndCompleteRegistration:', error);
    throw error;
  }
};

/**
 * Register/Login with Google
 */
export const registerWithGoogle = async (
  googleToken: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  user: any;
  isNewUser: boolean;
}> => {
  try {
    // Verify Google token
    const googleUserInfo = await googleOAuthService.verifyGoogleToken(googleToken);
    const userProfile = googleOAuthService.extractUserProfile(googleUserInfo);

    // Check if user exists
    const existingUser = await userRepository.findByEmail(userProfile.email);

    if (existingUser) {
      // User exists - check provider
      if (existingUser.authProvider !== 'google') {
        throw new Error(
          'This email is already registered with email and password. Please login with email instead.'
        );
      }

      // Login existing Google user
      const accessToken = tokenService.generateAccessToken(
        existingUser.id,
        existingUser.email,
        existingUser.authProvider
      );
      const refreshToken = tokenService.generateRefreshToken({
        id: existingUser.id,
        email: existingUser.email,
      });

      // Update last login
      await userRepository.updateLastLogin(existingUser.id);

      return {
        accessToken,
        refreshToken,
        user: {
          id: existingUser.id,
          email: existingUser.email,
          firstName: existingUser.firstName,
          lastName: existingUser.lastName,
          phoneNumber: existingUser.phoneNumber,
          authProvider: existingUser.authProvider,
          createdAt: existingUser.createdAt,
        },
        isNewUser: false,
      };
    }

    // Create new Google user
    const newUser = await userRepository.createUser({
      email: userProfile.email,
      firstName: userProfile.firstName,
      lastName: userProfile.lastName,
      authProvider: 'google',
      googleId: userProfile.googleId,
    });

    // Generate tokens
    const accessToken = tokenService.generateAccessToken(
      newUser.id,
      newUser.email,
      newUser.authProvider
    );
    const refreshToken = tokenService.generateRefreshToken({
      id: newUser.id,
      email: newUser.email,
    });

    // Send welcome email in background (non-blocking)
    emailService.sendWelcomeEmail(newUser.email, newUser.firstName).catch((err) => {
      console.error('❌ Failed to send welcome email to', newUser.email, ':', err.message);
      // Email failure is logged but doesn't block user flow
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        authProvider: newUser.authProvider,
        createdAt: newUser.createdAt,
      },
      isNewUser: true,
    };
  } catch (error: any) {
    console.error('Error in registerWithGoogle:', error);
    throw error;
  }
};

/**
 * Login with email and password
 */
export const loginWithEmail = async (
  email: string,
  password: string,
  rememberMe: boolean = false
): Promise<{
  accessToken: string;
  refreshToken?: string;
  user: any;
}> => {
  try {
    // Validate email
    const emailValidation = validationService.validateEmail(email);
    if (!emailValidation.isValid) {
      throw new Error('Invalid email or password');
    }

    // Find user
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check auth provider
    if (user.authProvider !== 'email') {
      throw new Error(
        'This email is registered with Google. Please continue with Google to login.'
      );
    }

    // Verify password
    if (!user.passwordHash) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await passwordService.comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate tokens
    const accessToken = tokenService.generateAccessToken(
      user.id,
      user.email,
      user.authProvider
    );
    const refreshToken = rememberMe
      ? tokenService.generateRefreshToken({
          id: user.id,
          email: user.email,
        })
      : undefined;

    // Update last login
    await userRepository.updateLastLogin(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        authProvider: user.authProvider,
        lastLoginAt: new Date(),
      },
    };
  } catch (error: any) {
    console.error('Error in loginWithEmail:', error);
    throw error;
  }
};

/**
 * Login with Google
 */
export const loginWithGoogle = async (
  googleToken: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  user: any;
}> => {
  try {
    // Verify Google token
    const googleUserInfo = await googleOAuthService.verifyGoogleToken(googleToken);
    const userProfile = googleOAuthService.extractUserProfile(googleUserInfo);

    // Find user
    const user = await userRepository.findByEmail(userProfile.email);
    if (!user) {
      throw new Error(
        'No account found with this email. Please register first.'
      );
    }

    // Check auth provider
    if (user.authProvider !== 'google') {
      throw new Error(
        'This email is registered with email and password. Please login with email instead.'
      );
    }

    // Generate tokens
    const accessToken = tokenService.generateAccessToken(
      user.id,
      user.email,
      user.authProvider
    );
    const refreshToken = tokenService.generateRefreshToken({
      id: user.id,
      email: user.email,
    });

    // Update last login
    await userRepository.updateLastLogin(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        authProvider: user.authProvider,
        lastLoginAt: new Date(),
      },
    };
  } catch (error: any) {
    console.error('Error in loginWithGoogle:', error);
    throw error;
  }
};

/**
 * Logout user (blacklist token)
 */
export const logout = async (token: string, userId: string): Promise<void> => {
  try {
    await tokenService.blacklistToken(token, userId);
  } catch (error: any) {
    console.error('Error in logout:', error);
    // Don't throw error - logout should always succeed
  }
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (
  refreshToken: string
): Promise<{ accessToken: string }> => {
  try {
    // Validate refresh token
    const payload = await tokenService.validateAndCheckToken(refreshToken);
    if (!payload) {
      throw new Error('Invalid or expired refresh token');
    }

    // Find user
    const user = await userRepository.findById(payload.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate new access token
    const accessToken = tokenService.generateAccessToken(
      user.id,
      user.email,
      user.authProvider
    );

    return { accessToken };
  } catch (error: any) {
    console.error('Error in refreshAccessToken:', error);
    throw error;
  }
};

/**
 * Initiate password reset (Step 1: Send OTP)
 */
export const initiatePasswordReset = async (
  email: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // Validate email
    const emailValidation = validationService.validateEmail(email);
    if (!emailValidation.isValid) {
      throw new Error('Invalid email address');
    }

    // Find user
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists (security)
      return {
        success: true,
        message: 'If this email is registered, you will receive a password reset code.',
      };
    }

    // Check auth provider
    if (user.authProvider !== 'email') {
      throw new Error(
        'This account uses Google Sign-In. No password to reset. Please continue with Google.'
      );
    }

    // Generate and send OTP
    const otp = await otpService.generateOTP(user.email);
    
    // Send password reset email in background (non-blocking)
    emailService.sendPasswordResetOTP(user.email, otp, user.firstName).catch((err) => {
      console.error('❌ Failed to send password reset email to', user.email, ':', err.message);
      // Email failure is logged but doesn't block user flow
    });

    return {
      success: true,
      message: 'Password reset code sent to your email.',
    };
  } catch (error: any) {
    console.error('Error in initiatePasswordReset:', error);
    throw error;
  }
};

/**
 * Complete password reset (Step 2: Verify OTP and set new password)
 */
export const resetPassword = async (
  email: string,
  otp: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // Validate OTP
    const otpResult = await otpService.validateOTP(email, otp);
    if (!otpResult.isValid) {
      throw new Error(otpResult.message);
    }

    // Find user
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    // Validate new password strength
    const passwordValidation = passwordService.validatePasswordStrength(newPassword, {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join(', '));
    }

    // Check if new password is different from current password
    if (user.passwordHash) {
      const isSamePassword = await passwordService.comparePassword(
        newPassword,
        user.passwordHash
      );
      if (isSamePassword) {
        throw new Error('New password must be different from your current password');
      }
    }

    // Hash new password
    const newPasswordHash = await passwordService.hashPassword(newPassword);

    // Update password
    await userRepository.updatePassword(user.id, newPasswordHash);

    // TODO: Blacklist all existing tokens for this user (logout from all devices)
    // This would require tracking all user tokens, which we'll implement later if needed

    console.log(`✅ Password reset successful for user: ${user.email}`);

    return {
      success: true,
      message: 'Password reset successful. Please login with your new password.',
    };
  } catch (error: any) {
    console.error('Error in resetPassword:', error);
    throw error;
  }
};

/**
 * Change password from profile (user is logged in)
 */
export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // Find user
    const user = await userRepository.findById(userId); // Get user with password
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user has password (not Google user)
    if (user.authProvider !== 'email' || !user.passwordHash) {
      throw new Error('Password change is not available for Google accounts');
    }

    // Verify current password
    const isCurrentPasswordValid = await passwordService.comparePassword(
      currentPassword,
      user.passwordHash
    );
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Validate password change
    const changeValidation = passwordService.validatePasswordChange({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    if (!changeValidation.isValid) {
      throw new Error(changeValidation.errors.join(', '));
    }

    // Validate new password strength with personal info
    const strengthValidation = passwordService.validatePasswordStrength(newPassword, {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });
    if (!strengthValidation.isValid) {
      throw new Error(strengthValidation.errors.join(', '));
    }

    // Hash new password
    const newPasswordHash = await passwordService.hashPassword(newPassword);

    // Update password
    await userRepository.updatePassword(user.id, newPasswordHash);

    console.log(`✅ Password changed successfully for user: ${user.email}`);

    return {
      success: true,
      message: 'Password changed successfully',
    };
  } catch (error: any) {
    console.error('Error in changePassword:', error);
    throw error;
  }
};

/**
 * Register/Login with Facebook
 */
export const registerWithFacebook = async (
  facebookToken: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  user: any;
  isNewUser: boolean;
}> => {
  try {
    // Import Facebook OAuth service
    const facebookOAuthService = await import('./facebookOAuth.service');
    
    // Verify Facebook token
    const facebookProfile = await facebookOAuthService.verifyToken(facebookToken);

    // Check if user exists
    const existingUser = await userRepository.findByEmail(facebookProfile.email);

    if (existingUser) {
      // User exists - check provider
      if (existingUser.authProvider !== 'facebook') {
        const providerName = existingUser.authProvider === 'email' 
          ? 'email and password' 
          : existingUser.authProvider;
        throw new Error(
          `This email is already registered with ${providerName}. Please login with ${providerName} instead.`
        );
      }

      // Login existing Facebook user
      const accessToken = tokenService.generateAccessToken(
        existingUser.id,
        existingUser.email,
        existingUser.authProvider
      );
      const refreshToken = tokenService.generateRefreshToken({
        id: existingUser.id,
        email: existingUser.email,
      });

      // Update last login
      await userRepository.updateLastLogin(existingUser.id);

      return {
        accessToken,
        refreshToken,
        user: {
          id: existingUser.id,
          email: existingUser.email,
          firstName: existingUser.firstName,
          lastName: existingUser.lastName,
          phoneNumber: existingUser.phoneNumber,
          authProvider: existingUser.authProvider,
          createdAt: existingUser.createdAt,
        },
        isNewUser: false,
      };
    }

    // Create new Facebook user
    const newUser = await userRepository.createUser({
      email: facebookProfile.email,
      firstName: facebookProfile.first_name,
      lastName: facebookProfile.last_name,
      authProvider: 'facebook',
      facebookId: facebookProfile.id,
    });

    // Generate tokens
    const accessToken = tokenService.generateAccessToken(
      newUser.id,
      newUser.email,
      newUser.authProvider
    );
    const refreshToken = tokenService.generateRefreshToken({
      id: newUser.id,
      email: newUser.email,
    });

    // Send welcome email in background (non-blocking)
    emailService.sendWelcomeEmail(newUser.email, newUser.firstName).catch((err) => {
      console.error('❌ Failed to send welcome email to', newUser.email, ':', err.message);
      // Email failure is logged but doesn't block user flow
    });

    console.log(`✅ New Facebook user registered: ${newUser.email}`);

    return {
      accessToken,
      refreshToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        authProvider: newUser.authProvider,
        createdAt: newUser.createdAt,
      },
      isNewUser: true,
    };
  } catch (error: any) {
    console.error('Error in registerWithFacebook:', error);
    throw error;
  }
};

/**
 * Login with Facebook
 */
export const loginWithFacebook = async (
  facebookToken: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  user: any;
}> => {
  try {
    // Import Facebook OAuth service
    const facebookOAuthService = await import('./facebookOAuth.service');
    
    // Verify Facebook token
    const facebookProfile = await facebookOAuthService.verifyToken(facebookToken);

    // Find user
    const user = await userRepository.findByEmail(facebookProfile.email);
    if (!user) {
      throw new Error(
        'No account found with this email. Please register first.'
      );
    }

    // Check auth provider
    if (user.authProvider !== 'facebook') {
      const providerName = user.authProvider === 'email' 
        ? 'email and password' 
        : user.authProvider;
      throw new Error(
        `This email is registered with ${providerName}. Please login with ${providerName} instead.`
      );
    }

    // Generate tokens
    const accessToken = tokenService.generateAccessToken(
      user.id,
      user.email,
      user.authProvider
    );
    const refreshToken = tokenService.generateRefreshToken({
      id: user.id,
      email: user.email,
    });

    // Update last login
    await userRepository.updateLastLogin(user.id);

    console.log(`✅ Facebook user logged in: ${user.email}`);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        authProvider: user.authProvider,
        lastLoginAt: new Date(),
      },
    };
  } catch (error: any) {
    console.error('Error in loginWithFacebook:', error);
    throw error;
  }
};
