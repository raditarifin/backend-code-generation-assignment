import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ApiResponseCode } from '../models';
import { createValidationErrorResponse, ValidationError } from '../models/responses';
import { logger } from '../utils/logger';

/**
 * Generic validation middleware factory
 * Validates request data against Joi schemas
 */
export const validate = (schema: {
  body?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  headers?: Joi.ObjectSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const errors: ValidationError[] = [];

      // Validate request body
      if (schema.body) {
        const { error } = schema.body.validate(req.body, { 
          abortEarly: false,
          allowUnknown: false,
          stripUnknown: true,
        });
        
        if (error) {
          errors.push(...error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context?.value,
          })));
        }
      }

      // Validate request parameters
      if (schema.params) {
        const { error } = schema.params.validate(req.params, { 
          abortEarly: false,
          allowUnknown: false,
        });
        
        if (error) {
          errors.push(...error.details.map(detail => ({
            field: `params.${detail.path.join('.')}`,
            message: detail.message,
            value: detail.context?.value,
          })));
        }
      }

      // Validate query parameters
      if (schema.query) {
        const { error } = schema.query.validate(req.query, { 
          abortEarly: false,
          allowUnknown: true, // Allow unknown query params for flexibility
          stripUnknown: true,
        });
        
        if (error) {
          errors.push(...error.details.map(detail => ({
            field: `query.${detail.path.join('.')}`,
            message: detail.message,
            value: detail.context?.value,
          })));
        }
      }

      // Validate headers
      if (schema.headers) {
        const { error } = schema.headers.validate(req.headers, { 
          abortEarly: false,
          allowUnknown: true,
        });
        
        if (error) {
          errors.push(...error.details.map(detail => ({
            field: `headers.${detail.path.join('.')}`,
            message: detail.message,
            value: detail.context?.value,
          })));
        }
      }

      // Return validation errors if any
      if (errors.length > 0) {
        logger.warn('Validation failed', {
          method: req.method,
          url: req.originalUrl,
          errors,
          body: req.body,
          params: req.params,
          query: req.query,
        });

        const response = createValidationErrorResponse(
          'Request validation failed',
          errors
        );
        res.status(400).json(response);
        return;
      }

      next();
    } catch (error) {
      logger.error('Validation middleware error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        method: req.method,
        url: req.originalUrl,
      });

      const response = createValidationErrorResponse(
        'Validation failed due to internal error',
        []
      );
      res.status(500).json(response);
    }
  };
};

/**
 * Input sanitization middleware
 * Cleans and sanitizes user input
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }

    next();
  } catch (error) {
    logger.error('Input sanitization middleware error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    next(); // Continue on sanitization error
  }
};

/**
 * Recursively sanitize an object
 */
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip potentially dangerous keys
      if (key.startsWith('__') || key.includes('$') || key.includes('.')) {
        continue;
      }
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  return obj;
}

/**
 * Sanitize string input
 */
function sanitizeString(str: string): string {
  if (!str || typeof str !== 'string') {
    return str;
  }

  return str
    .trim()
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove HTML tags (basic)
    .replace(/<[^>]*>/g, '')
    // Remove script tags content
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    // Limit length
    .substring(0, 10000);
}

/**
 * Pagination validation middleware
 */
export const validatePagination = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(String(page), 10);
    const limitNum = parseInt(String(limit), 10);

    const errors: ValidationError[] = [];

    if (isNaN(pageNum) || pageNum < 1) {
      errors.push({
        field: 'query.page',
        message: 'Page must be a positive integer',
        value: page,
      });
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      errors.push({
        field: 'query.limit',
        message: 'Limit must be a positive integer between 1 and 100',
        value: limit,
      });
    }

    if (errors.length > 0) {
      const response = createValidationErrorResponse(
        'Pagination validation failed',
        errors
      );
      res.status(400).json(response);
      return;
    }

    // Add validated pagination to request
    req.pagination = {
      page: pageNum,
      limit: limitNum,
    };

    next();
  } catch (error) {
    logger.error('Pagination validation middleware error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    next();
  }
};

/**
 * UUID parameter validation middleware
 */
export const validateUuidParam = (paramName: string = 'id') => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  return (req: Request, res: Response, next: NextFunction): void => {
    const paramValue = req.params[paramName];
    
    if (!paramValue || !uuidRegex.test(paramValue)) {
      const response = createValidationErrorResponse(
        'Invalid UUID format',
        [{
          field: `params.${paramName}`,
          message: 'Must be a valid UUID',
          value: paramValue,
        }]
      );
      res.status(400).json(response);
      return;
    }

    next();
  };
};

// Extend Request interface for pagination
declare global {
  namespace Express {
    interface Request {
      pagination?: {
        page: number;
        limit: number;
      };
    }
  }
}

export default {
  validate,
  sanitizeInput,
  validatePagination,
  validateUuidParam,
};
