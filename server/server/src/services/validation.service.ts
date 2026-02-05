import { ValidationResult } from '../types/validation.types';

/**
 * Validation Service
 * Handles input validation and sanitization for security
 */

/**
 * Sanitize input to prevent XSS attacks
 * Removes potentially dangerous characters and HTML tags
 */
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove script tags and content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove event handlers (onclick, onerror, etc.)
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Limit to reasonable length
    .substring(0, 1000);
};

/**
 * Validate email format
 * Checks if email matches standard email pattern
 */
export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];

  if (!email) {
    errors.push('Email is required');
    return { isValid: false, errors };
  }

  // Sanitize first
  const sanitized = sanitizeInput(email);

  // Email regex pattern
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(sanitized)) {
    errors.push('Invalid email format');
  }

  // Check length
  if (sanitized.length > 254) {
    errors.push('Email is too long (max 254 characters)');
  }

  // Check for spaces in domain
  const domain = sanitized.split('@')[1];
  if (domain && domain.includes(' ')) {
    errors.push('Email cannot contain spaces');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate phone number
 * Supports international formats with optional country codes
 */
export const validatePhoneNumber = (phone: string): ValidationResult => {
  const errors: string[] = [];

  if (!phone) {
    // Phone is optional, so empty is valid
    return { isValid: true, errors: [] };
  }

  // Sanitize first
  const sanitized = sanitizeInput(phone);

  // Remove spaces, dashes, parentheses for validation
  const cleaned = sanitized.replace(/[\s\-\(\)]/g, '');

  // Phone regex - supports international format with optional +
  // Examples: +919876543210, 9876543210, +1-234-567-8900
  const phoneRegex = /^\+?[1-9]\d{6,14}$/;

  if (!phoneRegex.test(cleaned)) {
    errors.push('Invalid phone number format. Use international format (e.g., +919876543210)');
  }

  // Check length (min 7 digits, max 15 digits as per E.164 standard)
  const digitsOnly = cleaned.replace(/\D/g, '');
  if (digitsOnly.length < 7) {
    errors.push('Phone number is too short (minimum 7 digits)');
  }
  if (digitsOnly.length > 15) {
    errors.push('Phone number is too long (maximum 15 digits)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate name (first name or last name)
 * Ensures name contains only letters, spaces, hyphens, and apostrophes
 */
export const validateName = (name: string, fieldName: string = 'Name'): ValidationResult => {
  const errors: string[] = [];

  if (!name) {
    errors.push(`${fieldName} is required`);
    return { isValid: false, errors };
  }

  // Sanitize first
  const sanitized = sanitizeInput(name);

  // Name regex - allows letters, spaces, hyphens, apostrophes
  // Examples: John, Mary-Jane, O'Brien, José
  const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;

  if (!nameRegex.test(sanitized)) {
    errors.push(`${fieldName} can only contain letters, spaces, hyphens, and apostrophes`);
  }

  // Check length
  if (sanitized.length < 2) {
    errors.push(`${fieldName} must be at least 2 characters`);
  }
  if (sanitized.length > 50) {
    errors.push(`${fieldName} cannot exceed 50 characters`);
  }

  // Check for excessive spaces
  if (/\s{2,}/.test(sanitized)) {
    errors.push(`${fieldName} cannot contain multiple consecutive spaces`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate registration data
 * Validates all fields required for user registration
 */
export const validateRegistrationData = (data: {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
}): ValidationResult => {
  const errors: string[] = [];

  // Validate first name
  const firstNameResult = validateName(data.firstName, 'First name');
  if (!firstNameResult.isValid) {
    errors.push(...firstNameResult.errors);
  }

  // Validate last name
  const lastNameResult = validateName(data.lastName, 'Last name');
  if (!lastNameResult.isValid) {
    errors.push(...lastNameResult.errors);
  }

  // Validate email
  const emailResult = validateEmail(data.email);
  if (!emailResult.isValid) {
    errors.push(...emailResult.errors);
  }

  // Validate phone number (optional)
  if (data.phoneNumber) {
    const phoneResult = validatePhoneNumber(data.phoneNumber);
    if (!phoneResult.isValid) {
      errors.push(...phoneResult.errors);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Sanitize registration data
 * Returns sanitized version of registration data
 */
export const sanitizeRegistrationData = (data: {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
}): {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
} => {
  return {
    firstName: sanitizeInput(data.firstName),
    lastName: sanitizeInput(data.lastName),
    email: sanitizeInput(data.email).toLowerCase(),
    phoneNumber: data.phoneNumber ? sanitizeInput(data.phoneNumber) : undefined,
  };
};
