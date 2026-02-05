import axios from 'axios';
import { AuthenticationError } from '../utils/errors';

/**
 * Facebook OAuth Service
 * Handles Facebook OAuth token verification and user profile retrieval
 */

export interface FacebookProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  name: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

const FACEBOOK_GRAPH_API_VERSION = process.env.FACEBOOK_GRAPH_API_VERSION || 'v18.0';
const FACEBOOK_GRAPH_API_URL = `https://graph.facebook.com/${FACEBOOK_GRAPH_API_VERSION}`;

/**
 * Verify Facebook access token and retrieve user profile
 * @param accessToken - Facebook access token from client
 * @returns Facebook user profile data
 */
export const verifyToken = async (accessToken: string): Promise<FacebookProfile> => {
  try {
    // Request user profile from Facebook Graph API
    const response = await axios.get(`${FACEBOOK_GRAPH_API_URL}/me`, {
      params: {
        fields: 'id,email,first_name,last_name,name,picture',
        access_token: accessToken,
      },
      timeout: 10000, // 10 second timeout
    });

    const profile: FacebookProfile = response.data;

    // Validate that email is present
    if (!profile.email) {
      throw new AuthenticationError(
        'Email permission is required. Please grant access to your email address.'
      );
    }

    console.log(`✅ Facebook token verified for user: ${profile.email}`);
    return profile;
  } catch (error: any) {
    // Handle specific error cases
    if (error instanceof AuthenticationError) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const errorData = error.response?.data;

      // Invalid or expired token
      if (status === 400 || status === 401) {
        console.error('❌ Invalid Facebook token:', errorData);
        throw new AuthenticationError(
          'Facebook authentication failed. Please try again.'
        );
      }

      // Rate limit exceeded
      if (status === 429) {
        console.error('❌ Facebook API rate limit exceeded');
        throw new AuthenticationError(
          'Too many requests. Please try again later.'
        );
      }

      // Facebook API unavailable
      if (status && status >= 500) {
        console.error('❌ Facebook API error:', errorData);
        throw new AuthenticationError(
          'Facebook service is temporarily unavailable. Please try again later.'
        );
      }

      // Network timeout
      if (error.code === 'ECONNABORTED') {
        console.error('❌ Facebook API timeout');
        throw new AuthenticationError(
          'Connection timeout. Please check your internet connection and try again.'
        );
      }
    }

    // Generic error
    console.error('❌ Facebook OAuth error:', error);
    throw new AuthenticationError(
      'Facebook authentication failed. Please try again.'
    );
  }
};

/**
 * Get user profile from Facebook
 * Alias for verifyToken for consistency with Google OAuth service
 * @param accessToken - Facebook access token
 * @returns Facebook user profile data
 */
export const getUserProfile = async (accessToken: string): Promise<FacebookProfile> => {
  return verifyToken(accessToken);
};

/**
 * Validate Facebook App configuration
 * @returns Boolean indicating if Facebook OAuth is properly configured
 */
export const isFacebookConfigured = (): boolean => {
  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;

  if (!appId || !appSecret) {
    console.warn('⚠️  Facebook OAuth is not configured. Missing FACEBOOK_APP_ID or FACEBOOK_APP_SECRET');
    return false;
  }

  return true;
};

