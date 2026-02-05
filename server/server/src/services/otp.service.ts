import crypto from 'crypto';
import OTP from '../models/OTP.model';

/**
 * OTP Service
 * Handles OTP generation, validation, and management
 */

/**
 * Generate a 6-digit OTP
 * Uses crypto.randomInt for secure random number generation
 */
const generate6DigitOTP = (): string => {
  // Generate random number between 100000 and 999999
  const otp = crypto.randomInt(100000, 1000000);
  return otp.toString();
};

/**
 * Generate and store OTP for an email
 * @param email - User's email address
 * @returns Generated OTP code
 */
export const generateOTP = async (email: string): Promise<string> => {
  try {
    // Generate 6-digit OTP
    const otpCode = generate6DigitOTP();

    // Calculate expiry time (5 minutes from now)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Delete any existing OTP for this email
    await OTP.deleteMany({ email: email.toLowerCase() });

    // Create new OTP record
    await OTP.create({
      email: email.toLowerCase(),
      otp: otpCode,
      expiresAt,
      attempts: 0,
    });

    console.log(`✅ OTP generated for ${email}: ${otpCode}`);
    return otpCode;
  } catch (error) {
    console.error('Error generating OTP:', error);
    throw new Error('Failed to generate OTP');
  }
};

/**
 * Validate OTP for an email
 * @param email - User's email address
 * @param otpCode - OTP code to validate
 * @returns Object with validation result and message
 */
export const validateOTP = async (
  email: string,
  otpCode: string
): Promise<{ isValid: boolean; message: string }> => {
  try {
    // Find OTP record for this email
    const otpRecord = await OTP.findOne({ email: email.toLowerCase() });

    if (!otpRecord) {
      return {
        isValid: false,
        message: 'No OTP found for this email. Please request a new OTP.',
      };
    }

    // Check if OTP has expired
    if (new Date() > otpRecord.expiresAt) {
      // Delete expired OTP
      await OTP.deleteOne({ _id: otpRecord._id });
      return {
        isValid: false,
        message: 'OTP has expired. Please request a new OTP.',
      };
    }

    // Check if maximum attempts exceeded
    if (otpRecord.attempts >= 3) {
      // Delete OTP after max attempts
      await OTP.deleteOne({ _id: otpRecord._id });
      return {
        isValid: false,
        message: 'Maximum OTP attempts exceeded. Please request a new OTP.',
      };
    }

    // Check if OTP matches
    if (otpRecord.otp !== otpCode) {
      // Increment attempt counter
      otpRecord.attempts += 1;
      otpRecord.lastAttemptAt = new Date();
      await otpRecord.save();

      const remainingAttempts = 3 - otpRecord.attempts;
      return {
        isValid: false,
        message: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`,
      };
    }

    // OTP is valid - mark as validated but don't delete yet
    // It will be deleted when user completes registration
    otpRecord.attempts = 0; // Reset attempts on successful validation
    await otpRecord.save();

    console.log(`✅ OTP validated successfully for ${email}`);
    return {
      isValid: true,
      message: 'OTP verified successfully',
    };
  } catch (error) {
    console.error('Error validating OTP:', error);
    throw new Error('Failed to validate OTP');
  }
};

/**
 * Resend OTP with cooldown check
 * @param email - User's email address
 * @returns Object with success status and message
 */
export const resendOTP = async (
  email: string
): Promise<{ success: boolean; message: string; otp?: string }> => {
  try {
    // Check if there's an existing OTP
    const existingOTP = await OTP.findOne({ email: email.toLowerCase() });

    if (existingOTP) {
      // Check cooldown period (30 seconds)
      const timeSinceCreation = Date.now() - existingOTP.createdAt.getTime();
      const cooldownPeriod = 30 * 1000; // 30 seconds

      if (timeSinceCreation < cooldownPeriod) {
        const remainingSeconds = Math.ceil((cooldownPeriod - timeSinceCreation) / 1000);
        return {
          success: false,
          message: `Please wait ${remainingSeconds} seconds before requesting a new OTP.`,
        };
      }
    }

    // Generate new OTP (this will delete the old one)
    const newOTP = await generateOTP(email);

    return {
      success: true,
      message: 'New OTP sent successfully',
      otp: newOTP,
    };
  } catch (error) {
    console.error('Error resending OTP:', error);
    throw new Error('Failed to resend OTP');
  }
};

/**
 * Invalidate/delete OTP for an email
 * Used when user completes registration or no longer needs the OTP
 * @param email - User's email address
 */
export const invalidateOTP = async (email: string): Promise<void> => {
  try {
    await OTP.deleteMany({ email: email.toLowerCase() });
    console.log(`✅ OTP invalidated for ${email}`);
  } catch (error) {
    console.error('Error invalidating OTP:', error);
    throw new Error('Failed to invalidate OTP');
  }
};

/**
 * Check if OTP exists and is still valid for an email
 * @param email - User's email address
 * @returns Boolean indicating if valid OTP exists
 */
export const hasValidOTP = async (email: string): Promise<boolean> => {
  try {
    const otpRecord = await OTP.findOne({ email: email.toLowerCase() });

    if (!otpRecord) {
      return false;
    }

    // Check if expired
    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return false;
    }

    // Check if max attempts exceeded
    if (otpRecord.attempts >= 3) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking OTP validity:', error);
    return false;
  }
};
