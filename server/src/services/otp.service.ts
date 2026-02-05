import crypto from 'crypto';
import { prisma } from '../models/OTP.model';

/**
 * OTP Service
 * Handles OTP generation, validation, and management using Prisma
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
 * @param purpose - Purpose of the OTP (registration, password_reset, email_verification)
 * @returns Generated OTP code
 */
export const generateOTP = async (
  email: string, 
  purpose: 'registration' | 'password_reset' | 'email_verification' = 'registration'
): Promise<string> => {
  try {
    // Generate 6-digit OTP
    const otpCode = generate6DigitOTP();

    // Calculate expiry time (5 minutes from now)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Delete any existing OTP for this email and purpose
    await prisma.oTP.deleteMany({ 
      where: { 
        email: email.toLowerCase(),
        purpose: purpose
      } 
    });

    // Create new OTP record
    await prisma.oTP.create({
      data: {
        email: email.toLowerCase(),
        otp: otpCode,
        purpose: purpose,
        expiresAt,
        attempts: 0,
        isUsed: false,
      },
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
 * @param purpose - Purpose of the OTP
 * @returns Object with validation result and message
 */
export const validateOTP = async (
  email: string,
  otpCode: string,
  purpose: 'registration' | 'password_reset' | 'email_verification' = 'registration'
): Promise<{ isValid: boolean; message: string }> => {
  try {
    // Find OTP record for this email and purpose
    const otpRecord = await prisma.oTP.findFirst({ 
      where: { 
        email: email.toLowerCase(),
        purpose: purpose,
        isUsed: false
      } 
    });

    if (!otpRecord) {
      return {
        isValid: false,
        message: 'No OTP found for this email. Please request a new OTP.',
      };
    }

    // Check if OTP has expired
    if (new Date() > otpRecord.expiresAt) {
      // Delete expired OTP
      await prisma.oTP.delete({ where: { id: otpRecord.id } });
      return {
        isValid: false,
        message: 'OTP has expired. Please request a new OTP.',
      };
    }

    // Check if maximum attempts exceeded
    if (otpRecord.attempts >= 3) {
      // Delete OTP after max attempts
      await prisma.oTP.delete({ where: { id: otpRecord.id } });
      return {
        isValid: false,
        message: 'Maximum OTP attempts exceeded. Please request a new OTP.',
      };
    }

    // Check if OTP matches
    if (otpRecord.otp !== otpCode) {
      // Increment attempt counter
      await prisma.oTP.update({
        where: { id: otpRecord.id },
        data: { attempts: otpRecord.attempts + 1 }
      });

      const remainingAttempts = 3 - (otpRecord.attempts + 1);
      return {
        isValid: false,
        message: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`,
      };
    }

    // OTP is valid - mark as used
    await prisma.oTP.update({
      where: { id: otpRecord.id },
      data: { 
        isUsed: true,
        attempts: 0 // Reset attempts on successful validation
      }
    });

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
 * @param purpose - Purpose of the OTP
 * @returns Object with success status and message
 */
export const resendOTP = async (
  email: string,
  purpose: 'registration' | 'password_reset' | 'email_verification' = 'registration'
): Promise<{ success: boolean; message: string; otp?: string }> => {
  try {
    // Check if there's an existing OTP
    const existingOTP = await prisma.oTP.findFirst({ 
      where: { 
        email: email.toLowerCase(),
        purpose: purpose,
        isUsed: false
      } 
    });

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
    const newOTP = await generateOTP(email, purpose);

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
 * @param purpose - Purpose of the OTP
 */
export const invalidateOTP = async (
  email: string,
  purpose?: 'registration' | 'password_reset' | 'email_verification'
): Promise<void> => {
  try {
    if (purpose) {
      await prisma.oTP.deleteMany({ 
        where: { 
          email: email.toLowerCase(),
          purpose: purpose
        } 
      });
    } else {
      // Delete all OTPs for this email
      await prisma.oTP.deleteMany({ 
        where: { email: email.toLowerCase() } 
      });
    }
    console.log(`✅ OTP invalidated for ${email}`);
  } catch (error) {
    console.error('Error invalidating OTP:', error);
    throw new Error('Failed to invalidate OTP');
  }
};

/**
 * Check if OTP exists and is still valid for an email
 * @param email - User's email address
 * @param purpose - Purpose of the OTP
 * @returns Boolean indicating if valid OTP exists
 */
export const hasValidOTP = async (
  email: string,
  purpose: 'registration' | 'password_reset' | 'email_verification' = 'registration'
): Promise<boolean> => {
  try {
    const otpRecord = await prisma.oTP.findFirst({ 
      where: { 
        email: email.toLowerCase(),
        purpose: purpose,
        isUsed: false
      } 
    });

    if (!otpRecord) {
      return false;
    }

    // Check if expired
    if (new Date() > otpRecord.expiresAt) {
      await prisma.oTP.delete({ where: { id: otpRecord.id } });
      return false;
    }

    // Check if max attempts exceeded
    if (otpRecord.attempts >= 3) {
      await prisma.oTP.delete({ where: { id: otpRecord.id } });
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking OTP validity:', error);
    return false;
  }
};
