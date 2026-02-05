/**
 * Custom Error Classes
 * Standardized error types with HTTP status codes
 */

/**
 * Base Application Error
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error (400)
 * Used for input validation failures
 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

/**
 * Authentication Error (401)
 * Used for authentication failures (invalid credentials, expired tokens, etc.)
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization Error (403)
 * Used for authorization failures (insufficient permissions)
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

/**
 * Not Found Error (404)
 * Used when a requested resource is not found
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict Error (409)
 * Used for conflicts like duplicate email, concurrent updates, etc.
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

/**
 * Rate Limit Error (429)
 * Used when rate limit is exceeded
 */
export class RateLimitError extends AppError {
  public readonly retryAfter?: number;

  constructor(message: string = 'Too many requests', retryAfter?: number) {
    super(message, 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Internal Server Error (500)
 * Used for unexpected server errors
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, false); // Not operational - unexpected error
    this.name = 'InternalServerError';
  }
}

/**
 * Bad Request Error (400)
 * Generic bad request error
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request') {
    super(message, 400);
    this.name = 'BadRequestError';
  }
}
