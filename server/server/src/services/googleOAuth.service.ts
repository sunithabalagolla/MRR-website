import { OAuth2Client } from 'google-auth-library';
import config from '../config/env.config';
import { GoogleUserInfo } from '../types/google.types';

/**
 * Google OAuth Service
 * Handles Google Sign-In token verification and user info extraction
 */

// Create OAuth2 client
const client = new OAuth2Client(config.googleClientId);

/**
 * Verify Google ID token
 * @param token - Google ID token from frontend
 * @returns Google user information
 */
export const verifyGoogleToken = async (token: string): Promise<GoogleUserInfo> => {
  try {
    // Input validation
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid token format');
    }

    // Verify token with Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: config.googleClientId, // Verify token is for our app
    });

    // Get payload (user info)
    const payload = ticket.getPayload();

    if (!payload) {
      throw new Error('Failed to get token payload');
    }

    // Validate required fields
    if (!payload.email || !payload.sub) {
      throw new Error('Missing required user information');
    }

    // Check if email is verified by Google
    if (!payload.email_verified) {
      throw new Error('Email not verified by Google');
    }

    // Extract user information
    const userInfo: GoogleUserInfo = {
      sub: payload.sub, // Google ID
      email: payload.email,
      email_verified: payload.email_verified,
      name: payload.name || '',
      given_name: payload.given_name || '',
      family_name: payload.family_name || '',
      picture: payload.picture,
      locale: payload.locale,
    };

    console.log(`✅ Google token verified for: ${userInfo.email}`);
    return userInfo;
  } catch (error: any) {
    console.error('Error verifying Google token:', error.message);

    // Provide user-friendly error messages
    if (error.message.includes('Token used too late')) {
      throw new Error('Google token has expired. Please try again.');
    } else if (error.message.includes('Invalid token')) {
      throw new Error('Invalid Google token. Please try again.');
    } else if (error.message.includes('Email not verified')) {
      throw new Error('Your Google email is not verified. Please verify your email with Google first.');
    } else {
      throw new Error('Failed to verify Google account. Please try again.');
    }
  }
};

/**
 * Extract user profile data for registration/login
 * @param googleUserInfo - Verified Google user information
 * @returns Formatted user data for our system
 */
export const extractUserProfile = (googleUserInfo: GoogleUserInfo) => {
  // Extract first and last name from Google profile
  const nameParts = googleUserInfo.name ? googleUserInfo.name.trim().split(' ') : [];
  const firstName = googleUserInfo.given_name || nameParts[0] || 'User';
  let lastName = googleUserInfo.family_name || nameParts.slice(1).join(' ') || 'User';
  
  // Ensure lastName is at least 2 characters (database requirement)
  if (lastName.length < 2) {
    lastName = 'User';
  }

  return {
    email: googleUserInfo.email.toLowerCase(),
    firstName: firstName,
    lastName: lastName,
    googleId: googleUserInfo.sub,
    profilePicture: googleUserInfo.picture,
  };
};

/**
 * Validate Google token format (basic check before verification)
 * @param token - Token to validate
 * @returns True if format looks valid
 */
export const isValidTokenFormat = (token: string): boolean => {
  if (!token || typeof token !== 'string') {
    return false;
  }

  // Google JWT tokens have 3 parts separated by dots
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }

  // Each part should be base64 encoded (alphanumeric + - _ =)
  const base64Regex = /^[A-Za-z0-9_-]+={0,2}$/;
  return parts.every((part) => base64Regex.test(part));
};
