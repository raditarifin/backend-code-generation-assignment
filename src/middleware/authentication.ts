import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiResponseCode } from '../models';
import { createErrorResponse } from '../models/responses';
import { logger } from '../utils/logger';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

/**
 * JWT Authentication middleware
 * Verifies JWT tokens and adds user info to request
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      const response = createErrorResponse(
        ApiResponseCode.UNAUTHORIZED,
        'Access token is required'
      );
      res.status(401).json(response);
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET environment variable is not set');
      const response = createErrorResponse(
        ApiResponseCode.INTERNAL_ERROR,
        'Authentication service unavailable'
      );
      res.status(500).json(response);
      return;
    }

    jwt.verify(token, jwtSecret, (err: any, decoded: any) => {
      if (err) {
        const response = createErrorResponse(
          ApiResponseCode.UNAUTHORIZED,
          'Invalid or expired access token'
        );
        res.status(401).json(response);
        return;
      }

      // Add user info to request
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role || 'user',
      };

      logger.debug('User authenticated successfully', {
        userId: req.user.id,
        email: req.user.email,
        role: req.user.role,
      });

      next();
    });
  } catch (error) {
    logger.error('Authentication middleware error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    const response = createErrorResponse(
      ApiResponseCode.INTERNAL_ERROR,
      'Authentication failed'
    );
    res.status(500).json(response);
  }
};

/**
 * Optional authentication middleware
 * Adds user info if token is present, but doesn't require it
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      next();
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      next();
      return;
    }

    jwt.verify(token, jwtSecret, (err: any, decoded: any) => {
      if (!err && decoded) {
        req.user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role || 'user',
        };
      }
      next();
    });
  } catch (error) {
    // Continue without authentication on error
    next();
  }
};

export default {
  authenticateToken,
  optionalAuth,
};
