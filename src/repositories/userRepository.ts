import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { User, CreateUserInput, UserProfile } from '../models/entities';
import { logger } from '../utils/logger';

/**
 * In-memory user storage repository
 * Handles user data operations with password hashing
 */
export class UserRepository {
  private users: User[] = [];
  private readonly saltRounds = 12;

  constructor() {
    // Create default admin user for testing
    this.createDefaultUsers();
  }

  /**
   * Create default users for testing/demo purposes
   */
  private async createDefaultUsers(): Promise<void> {
    try {
      const adminUser: CreateUserInput = {
        email: 'admin@todoapi.com',
        password: 'admin123',
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
      };

      const testUser: CreateUserInput = {
        email: 'user@todoapi.com',
        password: 'user123',
        first_name: 'Test',
        last_name: 'User',
        role: 'user',
      };

      await this.create(adminUser);
      await this.create(testUser);

      logger.info('Default users created for testing');
    } catch (error) {
      logger.error('Failed to create default users', { error });
    }
  }

  /**
   * Create a new user with hashed password
   */
  async create(userData: CreateUserInput): Promise<User> {
    const existingUser = this.users.find(user => user.email === userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(userData.password, this.saltRounds);
    const now = new Date();

    const user: User = {
      id: uuidv4(),
      email: userData.email,
      password: hashedPassword,
      role: userData.role || 'user',
      ...(userData.first_name && { first_name: userData.first_name }),
      ...(userData.last_name && { last_name: userData.last_name }),
      is_active: true,
      created_at: now,
      updated_at: now,
    };

    this.users.push(user);
    
    logger.info('User created', {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return user;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const user = this.users.find(user => user.email === email && user.is_active);
    return user || null;
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const user = this.users.find(user => user.id === id && user.is_active);
    return user || null;
  }

  /**
   * Verify user password
   */
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Convert User to UserProfile (remove sensitive data)
   */
  toUserProfile(user: User): UserProfile {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      ...(user.first_name && { first_name: user.first_name }),
      ...(user.last_name && { last_name: user.last_name }),
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  /**
   * Get all users (admin only) - returns profiles without passwords
   */
  async findAll(): Promise<UserProfile[]> {
    return this.users
      .filter(user => user.is_active)
      .map(user => this.toUserProfile(user));
  }

  /**
   * Update user
   */
  async update(id: string, updates: Partial<CreateUserInput>): Promise<User | null> {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      return null;
    }

    const user = this.users[userIndex];
    if (!user) {
      return null;
    }

    const updatedUser: User = {
      ...user,
      ...updates,
      updated_at: new Date(),
    };

    // Hash password if it's being updated
    if (updates.password) {
      updatedUser.password = await bcrypt.hash(updates.password, this.saltRounds);
    }

    this.users[userIndex] = updatedUser;
    
    logger.info('User updated', {
      userId: user.id,
      email: user.email,
    });

    return updatedUser;
  }

  /**
   * Soft delete user
   */
  async delete(id: string): Promise<boolean> {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      return false;
    }

    const user = this.users[userIndex];
    if (!user) {
      return false;
    }

    user.is_active = false;
    user.updated_at = new Date();
    
    logger.info('User deleted', {
      userId: id,
    });

    return true;
  }

  /**
   * Get total count of active users
   */
  async count(): Promise<number> {
    return this.users.filter(user => user.is_active).length;
  }
}

export const userRepository = new UserRepository();
