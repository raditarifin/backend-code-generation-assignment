import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { CreateUserInput, LoginInput } from '../models/entities';
import { ApiResponseCode } from '../models';
import { createSuccessResponse, createErrorResponse } from '../models/responses';
import { logger } from '../utils/logger';

/**
 * Authentication controller
 * Handles authentication-related HTTP requests
 */
export class AuthController {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const userData: CreateUserInput = req.body;

      const authResponse = await authService.register(userData);

      const response = createSuccessResponse(
        authResponse,
        { timestamp: new Date().toISOString() }
      );

      logger.info('User registration successful', {
        userId: authResponse.user.id,
        email: authResponse.user.email,
        ip: req.ip,
      });

      res.status(201).json(response);
    } catch (error) {
      logger.error('Registration controller error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        body: req.body,
        ip: req.ip,
      });

      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      let statusCode = 400;

      if (errorMessage.includes('already exists')) {
        statusCode = 409; // Conflict
      }

      const response = createErrorResponse(
        ApiResponseCode.VALIDATION_ERROR,
        errorMessage
      );

      res.status(statusCode).json(response);
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const loginData: LoginInput = req.body;

      const authResponse = await authService.login(loginData);

      const response = createSuccessResponse(
        authResponse,
        { timestamp: new Date().toISOString() }
      );

      logger.info('User login successful', {
        userId: authResponse.user.id,
        email: authResponse.user.email,
        ip: req.ip,
      });

      res.status(200).json(response);
    } catch (error) {
      logger.error('Login controller error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email: req.body.email,
        ip: req.ip,
      });

      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      let statusCode = 401;

      if (errorMessage.includes('deactivated')) {
        statusCode = 403; // Forbidden
      }

      const response = createErrorResponse(
        ApiResponseCode.UNAUTHORIZED,
        errorMessage
      );

      res.status(statusCode).json(response);
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        const response = createErrorResponse(
          ApiResponseCode.UNAUTHORIZED,
          'Authentication required'
        );
        res.status(401).json(response);
        return;
      }

      const userProfile = await authService.getUserProfile(req.user.id);
      if (!userProfile) {
        const response = createErrorResponse(
          ApiResponseCode.NOT_FOUND,
          'User not found'
        );
        res.status(404).json(response);
        return;
      }

      const response = createSuccessResponse(
        userProfile,
        { timestamp: new Date().toISOString() }
      );

      res.status(200).json(response);
    } catch (error) {
      logger.error('Get profile controller error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        ip: req.ip,
      });

      const response = createErrorResponse(
        ApiResponseCode.INTERNAL_ERROR,
        'Failed to get user profile'
      );

      res.status(500).json(response);
    }
  }

  /**
   * Refresh authentication token
   * POST /api/auth/refresh
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        const response = createErrorResponse(
          ApiResponseCode.UNAUTHORIZED,
          'Authentication required'
        );
        res.status(401).json(response);
        return;
      }

      const authResponse = await authService.refreshToken(req.user.id);

      const response = createSuccessResponse(
        authResponse,
        { timestamp: new Date().toISOString() }
      );

      logger.info('Token refresh successful', {
        userId: authResponse.user.id,
        email: authResponse.user.email,
        ip: req.ip,
      });

      res.status(200).json(response);
    } catch (error) {
      logger.error('Token refresh controller error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        ip: req.ip,
      });

      const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';
      let statusCode = 401;

      if (errorMessage.includes('not found')) {
        statusCode = 404;
      } else if (errorMessage.includes('deactivated')) {
        statusCode = 403;
      }

      const response = createErrorResponse(
        ApiResponseCode.UNAUTHORIZED,
        errorMessage
      );

      res.status(statusCode).json(response);
    }
  }

  /**
   * Logout user (client-side token invalidation)
   * POST /api/auth/logout
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      // Since we're using stateless JWT tokens, logout is handled client-side
      // by removing the token from storage. We just return a success message.
      
      logger.info('User logout', {
        userId: req.user?.id,
        email: req.user?.email,
        ip: req.ip,
      });

      const response = createSuccessResponse(
        { message: 'Please remove the token from your client storage' },
        { timestamp: new Date().toISOString() }
      );

      res.status(200).json(response);
    } catch (error) {
      logger.error('Logout controller error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        ip: req.ip,
      });

      const response = createErrorResponse(
        ApiResponseCode.INTERNAL_ERROR,
        'Logout failed'
      );

      res.status(500).json(response);
    }
  }
}

export const authController = new AuthController();
