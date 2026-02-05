import { AppError } from './errors';

/**
 * Error Response Formatter
 * Standardizes error responses across the application
 */

export interface ErrorResponse {
  success: false;
  message: string;
  statusCode: number;
  error?: string;
  stack?: string;
  timestamp: string;
}

/**
 * Format error for API response
 * @param error - Error object
 * @param includeStack - Whether to include stack trace (only in development)
 * @returns Formatted error response
 */
export const formatErrorResponse = (
  error: Error | AppError,
  includeStack: boolean = false
): ErrorResponse => {
  // Default values
  let statusCode = 500;
  let message = 'An unexpected error occurred';
  let errorName = 'InternalServerError';

  // Check if it's our custom AppError
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    errorName = error.name;
  } else {
    // For generic errors, use the message but don't expose internal details
    message = error.message || message;
    errorName = error.name || errorName;
  }

  // Build response
  const response: ErrorResponse = {
    success: false,
    message,
    statusCode,
    error: errorName,
    timestamp: new Date().toISOString(),
  };

  // Include stack trace only in development
  if (includeStack && error.stack) {
    response.stack = error.stack;
  }

  return response;
};

/**
 * Get HTTP status code from error
 * @param error - Error object
 * @returns HTTP status code
 */
export const getStatusCode = (error: Error | AppError): number => {
  if (error instanceof AppError) {
    return error.statusCode;
  }

  // Default to 500 for unknown errors
  return 500;
};

/**
 * Check if error is operational (expected) or programming error
 * @param error - Error object
 * @returns True if operational error
 */
export const isOperationalError = (error: Error | AppError): boolean => {
  if (error instanceof AppError) {
    return error.isOperational;
  }

  // Unknown errors are not operational
  return false;
};

/**
 * Sanitize error message for production
 * Removes sensitive information and provides generic messages
 * @param error - Error object
 * @param isProduction - Whether running in production
 * @returns Sanitized error message
 */
export const sanitizeErrorMessage = (
  error: Error | AppError,
  isProduction: boolean
): string => {
  // In development, return the actual message
  if (!isProduction) {
    return error.message;
  }

  // In production, check if it's an operational error
  if (error instanceof AppError && error.isOperational) {
    // Operational errors are safe to expose
    return error.message;
  }

  // For non-operational errors, return generic message
  return 'An unexpected error occurred. Please try again later.';
};

/**
 * Map common error types to HTTP status codes
 * @param errorName - Error name/type
 * @returns HTTP status code
 */
export const mapErrorToStatusCode = (errorName: string): number => {
  const errorMap: Record<string, number> = {
    ValidationError: 400,
    BadRequestError: 400,
    AuthenticationError: 401,
    UnauthorizedError: 401,
    AuthorizationError: 403,
    ForbiddenError: 403,
    NotFoundError: 404,
    ConflictError: 409,
    RateLimitError: 429,
    InternalServerError: 500,
  };

  return errorMap[errorName] || 500;
};
