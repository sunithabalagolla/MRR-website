import bcrypt from 'bcrypt';
import config from '../config/env.config';
import { ValidationResult } from '../types/validation.types';

/**
 * Password Service
 * Handles password hashing, comparison, and strength validation
 */

// Common weak passwords (top 100 most common)
const COMMON_PASSWORDS = [
  'password', 'password123', '12345678', 'qwerty', 'abc123', 'monkey', 'letmein',
  'trustno1', 'dragon', 'baseball', 'iloveyou', '123456', 'master', 'sunshine',
  'ashley', 'bailey', 'passw0rd', 'shadow', '123123', '654321', 'superman',
  'qazwsx', 'michael', 'football', 'welcome', 'jesus', 'ninja', 'mustang',
  'password1', '123456789', 'qwerty123', '1q2w3e4r', 'admin', 'welcome123',
  'login', 'admin123', 'root', 'toor', 'pass', 'test', 'guest', 'oracle',
  'changeme', 'whatever', 'princess', 'qwertyuiop', 'solo', 'starwars',
];

// Keyboard patterns to reject
const KEYBOARD_PATTERNS = [
  'qwerty', 'asdfgh', 'zxcvbn', '1qaz2wsx', 'qazwsx', 'qwertyuiop',
  'asdfghjkl', 'zxcvbnm', '1234567890',
];

/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @returns Hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  // Input validation
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }

  if (password.trim().length === 0) {
    throw new Error('Password cannot be empty or only whitespace');
  }

  if (password.length > 128) {
    throw new Error('Password is too long (maximum 128 characters)');
  }

  try {
    const saltRounds = config.bcryptSaltRounds;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
};

/**
 * Compare a plain text password with a hashed password
 * @param password - Plain text password
 * @param hash - Hashed password from database
 * @returns True if passwords match, false otherwise
 * @note Returns false on any error to prevent information leakage
 */
export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  // Input validation
  if (!password || typeof password !== 'string') {
    return false;
  }

  if (!hash || typeof hash !== 'string') {
    return false;
  }

  // Basic bcrypt hash format check ($2a$, $2b$, or $2y$ followed by cost and hash)
  if (!hash.startsWith('$2a$') && !hash.startsWith('$2b$') && !hash.startsWith('$2y$')) {
    return false;
  }

  try {
    const isMatch = await bcrypt.compare(password, hash);
    return isMatch;
  } catch (error) {
    // Don't log the error details for security (timing attacks)
    // Just return false - invalid credentials
    return false;
  }
};

/**
 * Check if password contains repeating characters
 */
const hasRepeatingCharacters = (password: string): boolean => {
  // Check for 3 or more repeating characters (e.g., "aaa", "111")
  return /(.)\1{2,}/.test(password);
};

/**
 * Check if password contains keyboard patterns
 */
const hasKeyboardPattern = (password: string): boolean => {
  const lowerPassword = password.toLowerCase();
  return KEYBOARD_PATTERNS.some((pattern) => lowerPassword.includes(pattern));
};

/**
 * Check if password contains personal information
 * @param password - Password to check
 * @param personalInfo - Object containing user's personal information
 */
export const containsPersonalInfo = (
  password: string,
  personalInfo?: { email?: string; firstName?: string; lastName?: string }
): boolean => {
  if (!personalInfo) return false;

  const lowerPassword = password.toLowerCase();

  // Check email username (part before @)
  if (personalInfo.email) {
    const emailUsername = personalInfo.email.split('@')[0].toLowerCase();
    if (emailUsername.length >= 3 && lowerPassword.includes(emailUsername)) {
      return true;
    }
  }

  // Check first name
  if (personalInfo.firstName) {
    const firstName = personalInfo.firstName.toLowerCase();
    if (firstName.length >= 3 && lowerPassword.includes(firstName)) {
      return true;
    }
  }

  // Check last name
  if (personalInfo.lastName) {
    const lastName = personalInfo.lastName.toLowerCase();
    if (lastName.length >= 3 && lowerPassword.includes(lastName)) {
      return true;
    }
  }

  return false;
};

/**
 * Validate password strength
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * - Not a common password
 * - No keyboard patterns
 * - No repeating characters
 * - No personal information
 * 
 * @param password - Password to validate
 * @param personalInfo - Optional user personal information to check against
 */
export const validatePasswordStrength = (
  password: string,
  personalInfo?: { email?: string; firstName?: string; lastName?: string }
): ValidationResult => {
  const errors: string[] = [];

  // Input validation
  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
    return { isValid: false, errors };
  }

  // Check for only whitespace    
  if (password.trim().length === 0) {
    errors.push('Password cannot be empty or only whitespace');
    return { isValid: false, errors };
  }

  // Check for null bytes (security issue)
  if (password.includes('\0')) {
    errors.push('Password contains invalid characters');
    return { isValid: false, errors };
  }

  // Check minimum length (8 characters)
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  // Check maximum length (128 chars - prevents DoS attacks on bcrypt)
  if (password.length > 128) {
    errors.push('Password is too long (maximum 128 characters)');
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check for at least one number
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{};\':"|,.<>/?)');
  }

  // Check for common weak passwords
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    errors.push('This password is too common. Please choose a stronger password');
  }

  // Check for keyboard patterns
  if (hasKeyboardPattern(password)) {
    errors.push('Password contains common keyboard patterns. Please choose a more complex password');
  }

  // Check for repeating characters
  if (hasRepeatingCharacters(password)) {
    errors.push('Password contains too many repeating characters. Please choose a more varied password');
  }

  // Check for personal information
  if (personalInfo && containsPersonalInfo(password, personalInfo)) {
    errors.push('Password should not contain your personal information (name, email)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate password confirmation
 * Checks if password and confirmation match
 */
export const validatePasswordConfirmation = (
  password: string,
  confirmPassword: string
): ValidationResult => {
  const errors: string[] = [];

  if (!confirmPassword) {
    errors.push('Password confirmation is required');
    return { isValid: false, errors };
  }

  if (password !== confirmPassword) {
    errors.push('Passwords do not match');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate password change request
 * Validates current password, new password, and confirmation
 */
export const validatePasswordChange = (data: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): ValidationResult => {
  const errors: string[] = [];

  // Check if current password is provided
  if (!data.currentPassword) {
    errors.push('Current password is required');
  }

  // Validate new password strength
  const strengthResult = validatePasswordStrength(data.newPassword);
  if (!strengthResult.isValid) {
    errors.push(...strengthResult.errors);
  }

  // Validate password confirmation
  const confirmResult = validatePasswordConfirmation(
    data.newPassword,
    data.confirmPassword
  );
  if (!confirmResult.isValid) {
    errors.push(...confirmResult.errors);
  }

  // Check if new password is different from current password
  if (data.currentPassword === data.newPassword) {
    errors.push('New password must be different from current password');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
