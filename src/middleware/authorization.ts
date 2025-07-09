import { Request, Response, NextFunction } from 'express';
import { ApiResponseCode } from '../models';
import { createErrorResponse } from '../models/responses';
import { logger } from '../utils/logger';

export type UserRole = 'admin' | 'user' | 'guest';

/**
 * Role-based authorization middleware
 * Checks if user has required role
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        const response = createErrorResponse(
          ApiResponseCode.UNAUTHORIZED,
          'Authentication required'
        );
        res.status(401).json(response);
        return;
      }

      // Check if user has required role
      const userRole = req.user.role as UserRole;
      if (!allowedRoles.includes(userRole)) {
        logger.warn('User access denied due to insufficient role', {
          userId: req.user.id,
          userRole,
          requiredRoles: allowedRoles,
          resource: req.originalUrl,
        });

        const response = createErrorResponse(
          ApiResponseCode.FORBIDDEN,
          'Insufficient permissions to access this resource'
        );
        res.status(403).json(response);
        return;
      }

      logger.debug('User authorized successfully', {
        userId: req.user.id,
        userRole,
        resource: req.originalUrl,
      });

      next();
    } catch (error) {
      logger.error('Authorization middleware error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
      });

      const response = createErrorResponse(
        ApiResponseCode.INTERNAL_ERROR,
        'Authorization failed'
      );
      res.status(500).json(response);
    }
  };
};

/**
 * Resource ownership authorization
 * Checks if user owns the resource or is admin
 */
export const requireOwnership = (resourceUserIdField: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        const response = createErrorResponse(
          ApiResponseCode.UNAUTHORIZED,
          'Authentication required'
        );
        res.status(401).json(response);
        return;
      }

      const userRole = req.user.role as UserRole;
      const userId = req.user.id;

      // Admins can access any resource
      if (userRole === 'admin') {
        next();
        return;
      }

      // Get resource user ID from params, body, or query
      const resourceUserId = 
        req.params[resourceUserIdField] || 
        req.body[resourceUserIdField] || 
        req.query[resourceUserIdField];

      if (!resourceUserId) {
        const response = createErrorResponse(
          ApiResponseCode.BAD_REQUEST,
          'Resource user ID not found'
        );
        res.status(400).json(response);
        return;
      }

      // Check ownership
      if (userId !== resourceUserId) {
        logger.warn('User access denied due to ownership mismatch', {
          userId,
          resourceUserId,
          resource: req.originalUrl,
        });

        const response = createErrorResponse(
          ApiResponseCode.FORBIDDEN,
          'You can only access your own resources'
        );
        res.status(403).json(response);
        return;
      }

      next();
    } catch (error) {
      logger.error('Ownership authorization middleware error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
      });

      const response = createErrorResponse(
        ApiResponseCode.INTERNAL_ERROR,
        'Authorization failed'
      );
      res.status(500).json(response);
    }
  };
};

/**
 * Admin only authorization
 */
export const requireAdmin = requireRole('admin');

/**
 * User or admin authorization
 */
export const requireUser = requireRole('user', 'admin');

export default {
  requireRole,
  requireOwnership,
  requireAdmin,
  requireUser,
};
