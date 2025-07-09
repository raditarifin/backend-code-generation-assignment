import jwt from 'jsonwebtoken';
import { CreateUserInput, LoginInput, AuthResponse, UserProfile } from '../models/entities';
import { userRepository } from '../repositories/userRepository';
import { logger } from '../utils/logger';

/**
 * Authentication service
 * Handles user registration, login, and JWT token generation
 */
export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';

    if (!process.env.JWT_SECRET) {
      logger.warn('JWT_SECRET not set in environment variables, using default (not recommended for production)');
    }
  }

  /**
   * Register a new user
   */
  async register(userData: CreateUserInput): Promise<AuthResponse> {
    try {
      // Validate email format
      if (!this.isValidEmail(userData.email)) {
        throw new Error('Invalid email format');
      }

      // Validate password strength
      if (!this.isValidPassword(userData.password)) {
        throw new Error('Password must be at least 8 characters long and contain at least one number and one letter');
      }

      const user = await userRepository.create(userData);
      const userProfile = userRepository.toUserProfile(user);
      const token = this.generateToken(userProfile);

      logger.info('User registered successfully', {
        userId: user.id,
        email: user.email,
      });

      return {
        user: userProfile,
        token,
        expires_in: this.getTokenExpirationTime(),
      };
    } catch (error) {
      logger.error('User registration failed', {
        email: userData.email,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(loginData: LoginInput): Promise<AuthResponse> {
    try {
      const user = await userRepository.findByEmail(loginData.email);
      if (!user) {
        throw new Error('Invalid email or password');
      }

      const isPasswordValid = await userRepository.verifyPassword(loginData.password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      if (!user.is_active) {
        throw new Error('Account is deactivated');
      }

      const userProfile = userRepository.toUserProfile(user);
      const token = this.generateToken(userProfile);

      logger.info('User logged in successfully', {
        userId: user.id,
        email: user.email,
      });

      return {
        user: userProfile,
        token,
        expires_in: this.getTokenExpirationTime(),
      };
    } catch (error) {
      logger.error('User login failed', {
        email: loginData.email,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const user = await userRepository.findById(userId);
      if (!user) {
        return null;
      }

      return userRepository.toUserProfile(user);
    } catch (error) {
      logger.error('Failed to get user profile', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Generate JWT token
   */
  private generateToken(user: UserProfile): string {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
      issuer: 'todo-api',
      audience: 'todo-app',
    } as jwt.SignOptions);
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Get token expiration time in seconds
   */
  private getTokenExpirationTime(): number {
    // Convert JWT expiration format to seconds
    const expiresIn = this.jwtExpiresIn;
    if (expiresIn.endsWith('h')) {
      return parseInt(expiresIn.slice(0, -1)) * 3600;
    } else if (expiresIn.endsWith('d')) {
      return parseInt(expiresIn.slice(0, -1)) * 86400;
    } else if (expiresIn.endsWith('m')) {
      return parseInt(expiresIn.slice(0, -1)) * 60;
    } else {
      return parseInt(expiresIn); // assume seconds
    }
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  private isValidPassword(password: string): boolean {
    // At least 8 characters, at least one letter and one number
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    return passwordRegex.test(password);
  }

  /**
   * Refresh token (generate new token for authenticated user)
   */
  async refreshToken(userId: string): Promise<AuthResponse> {
    try {
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.is_active) {
        throw new Error('Account is deactivated');
      }

      const userProfile = userRepository.toUserProfile(user);
      const token = this.generateToken(userProfile);

      logger.info('Token refreshed successfully', {
        userId: user.id,
        email: user.email,
      });

      return {
        user: userProfile,
        token,
        expires_in: this.getTokenExpirationTime(),
      };
    } catch (error) {
      logger.error('Token refresh failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

export const authService = new AuthService();
