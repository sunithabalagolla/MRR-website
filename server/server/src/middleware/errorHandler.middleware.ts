import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import {
  formatErrorResponse,
  getStatusCode,
  isOperationalError,
  sanitizeErrorMessage,
} from '../utils/errorFormatter';
import mongoose from 'mongoose';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

/**
 * Global Error Handler Middleware
 * Catches all errors and formats them for API responses
 */

/**
 * Main error handler
 */
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error details server-side
  logError(error, req);

  // Determine if we're in production
  const isProduction = process.env.NODE_ENV === 'production';

  // Handle specific error types
  const handledError = handleSpecificErrors(error);

  // Get status code
  const statusCode = getStatusCode(handledError);

  // Sanitize message for production
  const message = sanitizeErrorMessage(handledError, isProduction);

  // Format error response
  const errorResponse = formatErrorResponse(handledError, !isProduction);

  // Override message with sanitized version
  errorResponse.message = message;

  // Send response
  res.status(statusCode).json(errorResponse);
};

/**
 * Handle specific error types and convert to AppError
 */
const handleSpecificErrors = (error: Error | AppError): Error | AppError => {
  // Already an AppError, return as is
  if (error instanceof AppError) {
    return error;
  }

  // Mongoose validation error
  if (error instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(error.errors).map((err) => err.message);
    const AppError = require('../utils/errors').ValidationError;
    return new AppError(messages.join(', '));
  }

  // Mongoose duplicate key error
  if ((error as any).code === 11000) {
    const field = Object.keys((error as any).keyPattern || {})[0];
    const AppError = require('../utils/errors').ConflictError;
    return new AppError(
      field ? `${field} already exists` : 'Duplicate entry'
    );
  }

  // Mongoose cast error (invalid ObjectId)
  if (error instanceof mongoose.Error.CastError) {
    const AppError = require('../utils/errors').BadRequestError;
    return new AppError(`Invalid ${error.path}: ${error.value}`);
  }

  // JWT errors
  if (error instanceof JsonWebTokenError) {
    const AppError = require('../utils/errors').AuthenticationError;
    return new AppError('Invalid token');
  }

  if (error instanceof TokenExpiredError) {
    const AppError = require('../utils/errors').AuthenticationError;
    return new AppError('Token has expired');
  }

  // Return original error if not handled
  return error;
};

/**
 * Log error details server-side
 */
const logError = (error: Error | AppError, req: Request): void => {
  // Determine if error is operational
  const operational = isOperationalError(error);

  // Build log message
  const logMessage = {
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      operational,
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    },
  };

  // Log based on error type
  if (operational) {
    // Operational errors are expected, log as warning
    console.warn('⚠️  Operational Error:', JSON.stringify(logMessage, null, 2));
  } else {
    // Programming errors are unexpected, log as error
    console.error('❌ Programming Error:', JSON.stringify(logMessage, null, 2));
  }
};

/**
 * Handle unhandled promise rejections
 */
export const handleUnhandledRejection = (reason: any, promise: Promise<any>): void => {
  console.error('❌ Unhandled Promise Rejection:', {
    reason,
    promise,
    timestamp: new Date().toISOString(),
  });

  // In production, you might want to:
  // 1. Log to external service (Sentry, LogRocket, etc.)
  // 2. Gracefully shutdown the server
  // 3. Restart the process

  // For now, just log the error
  // process.exit(1); // Uncomment to exit on unhandled rejection
};

/**
 * Handle uncaught exceptions
 */
export const handleUncaughtException = (error: Error): void => {
  console.error('❌ Uncaught Exception:', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    timestamp: new Date().toISOString(),
  });

  // Uncaught exceptions are serious - should exit process
  console.error('🛑 Server shutting down due to uncaught exception...');
  process.exit(1);
};

/**
 * 404 Not Found Handler
 * Handles requests to non-existent routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`,
    statusCode: 404,
    timestamp: new Date().toISOString(),
  });
};
