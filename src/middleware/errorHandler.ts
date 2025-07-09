import { Request, Response, NextFunction } from 'express';
import { ApiResponseCode } from '../models';
import { createErrorResponse } from '../models/responses';
import { logger } from '../utils/logger';

interface ApiError extends Error {
  code?: ApiResponseCode;
  statusCode?: number;
  details?: any;
  field?: string;
  value?: any;
}

/**
 * Global error handling middleware
 * Catches all errors and returns consistent error responses
 */
export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Log the error
    logger.error('Request error handled by error middleware', {
      error: error.message,
      stack: error.stack,
      code: error.code,
      statusCode: error.statusCode,
      method: req.method,
      url: req.originalUrl,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id,
    });

    // Determine status code
    let statusCode = error.statusCode || 500;
    let responseCode = error.code || ApiResponseCode.INTERNAL_ERROR;

    // Map common error codes to HTTP status codes
    switch (error.code) {
      case ApiResponseCode.NOT_FOUND:
        statusCode = 404;
        break;
      case ApiResponseCode.VALIDATION_ERROR:
        statusCode = 400;
        break;
      case ApiResponseCode.UNAUTHORIZED:
        statusCode = 401;
        break;
      case ApiResponseCode.FORBIDDEN:
        statusCode = 403;
        break;
      case ApiResponseCode.CONFLICT:
        statusCode = 409;
        break;
      case ApiResponseCode.BAD_REQUEST:
        statusCode = 400;
        break;
      case ApiResponseCode.TOO_MANY_REQUESTS:
        statusCode = 429;
        break;
      default:
        statusCode = 500;
        responseCode = ApiResponseCode.INTERNAL_ERROR;
    }

    // Create error response
    let errorMessage = error.message;
    
    // Don't expose internal errors in production
    if (statusCode === 500 && process.env.NODE_ENV === 'production') {
      errorMessage = 'An internal server error occurred';
    }

    const response = createErrorResponse(
      responseCode,
      errorMessage,
      error.details,
      error.field,
      error.value
    );

    res.status(statusCode).json(response);
  } catch (handlerError) {
    // Fallback error response if error handler itself fails
    logger.error('Error handler middleware failed', {
      originalError: error.message,
      handlerError: handlerError instanceof Error ? handlerError.message : 'Unknown error',
    });

    res.status(500).json({
      success: false,
      error: {
        code: ApiResponseCode.INTERNAL_ERROR,
        message: 'An internal server error occurred',
      },
    });
  }
};

/**
 * 404 Not Found handler for unmatched routes
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const response = createErrorResponse(
    ApiResponseCode.NOT_FOUND,
    `Route ${req.method} ${req.originalUrl} not found`
  );

  logger.warn('Route not found', {
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
  });

  res.status(404).json(response);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch rejected promises
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validation error helper
 * Creates consistent validation error responses
 */
export const createValidationError = (
  message: string,
  field?: string,
  value?: any,
  details?: any
): ApiError => {
  const error = new Error(message) as ApiError;
  error.code = ApiResponseCode.VALIDATION_ERROR;
  error.statusCode = 400;
  if (field !== undefined) error.field = field;
  if (value !== undefined) error.value = value;
  if (details !== undefined) error.details = details;
  return error;
};

/**
 * Not found error helper
 */
export const createNotFoundError = (message: string): ApiError => {
  const error = new Error(message) as ApiError;
  error.code = ApiResponseCode.NOT_FOUND;
  error.statusCode = 404;
  return error;
};

/**
 * Unauthorized error helper
 */
export const createUnauthorizedError = (message: string = 'Unauthorized'): ApiError => {
  const error = new Error(message) as ApiError;
  error.code = ApiResponseCode.UNAUTHORIZED;
  error.statusCode = 401;
  return error;
};

/**
 * Forbidden error helper
 */
export const createForbiddenError = (message: string = 'Forbidden'): ApiError => {
  const error = new Error(message) as ApiError;
  error.code = ApiResponseCode.FORBIDDEN;
  error.statusCode = 403;
  return error;
};

/**
 * Conflict error helper
 */
export const createConflictError = (message: string): ApiError => {
  const error = new Error(message) as ApiError;
  error.code = ApiResponseCode.CONFLICT;
  error.statusCode = 409;
  return error;
};

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  createValidationError,
  createNotFoundError,
  createUnauthorizedError,
  createForbiddenError,
  createConflictError,
};
