import { UserRepository } from '../repositories/user.repository';
import { hashPassword, comparePassword } from '../utils/password.util';
import {
  generateAccessToken,
  generateRefreshToken,
  generatePasswordResetToken,
  verifyToken,
} from '../utils/jwt.util';
import { User, CreateUserDTO, UserResponse, UserRole } from '../models/user.model';
import redisClient from '../config/redis';
import { v4 as uuidv4 } from 'uuid';

export class AuthService {
  constructor(private userRepository: UserRepository) {}

  /**
   * Register a new user
   */
  async register(data: CreateUserDTO): Promise<{
    user: UserResponse;
    token: string;
    refreshToken: string;
  }> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user
    const user = await this.userRepository.create({
      ...data,
      password: hashedPassword,
    });

    // Generate tokens
    const token = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken(user.id);

    return {
      user: this.mapUserToResponse(user),
      token,
      refreshToken,
    };
  }

  /**
   * Login user with email and password
   */
  async login(
    email: string,
    password: string
  ): Promise<{
    user: UserResponse;
    token: string;
    refreshToken: string;
  }> {
    // Find user
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate tokens
    const token = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken(user.id);

    return {
      user: this.mapUserToResponse(user),
      token,
      refreshToken,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<{
    token: string;
    refreshToken: string;
  }> {
    try {
      // Verify refresh token
      const decoded = verifyToken(refreshToken);

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Check if token is blacklisted
      const blacklisted = await redisClient.get(`blacklist:${refreshToken}`);
      if (blacklisted) {
        throw new Error('Token has been revoked');
      }

      // Get user
      const user = await this.userRepository.findById(decoded.userId);
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      // Generate new tokens
      const newAccessToken = generateAccessToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      const newRefreshToken = generateRefreshToken(user.id);

      // Blacklist old refresh token
      await redisClient.setEx(
        `blacklist:${refreshToken}`,
        7 * 24 * 60 * 60, // 7 days
        'revoked'
      );

      return {
        token: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Token refresh failed: ${error.message}`);
      }
      throw new Error('Token refresh failed');
    }
  }

  /**
   * Logout user by blacklisting tokens
   */
  async logout(token: string, refreshToken?: string): Promise<void> {
    try {
      // Blacklist access token
      const decoded = verifyToken(token);
      const expiresIn = decoded.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 900; // 15 min default

      if (expiresIn > 0) {
        await redisClient.setEx(`blacklist:${token}`, expiresIn, 'revoked');
      }

      // Blacklist refresh token if provided
      if (refreshToken) {
        await redisClient.setEx(
          `blacklist:${refreshToken}`,
          7 * 24 * 60 * 60, // 7 days
          'revoked'
        );
      }
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Logout failed');
    }
  }

  /**
   * Initiate forgot password flow
   */
  async forgotPassword(email: string): Promise<{ resetToken: string }> {
    // Find user
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists
      throw new Error('If the email exists, a reset link will be sent');
    }

    // Generate reset token
    const resetToken = generatePasswordResetToken(user.id);

    // Store reset token in Redis with 1 hour expiration
    const resetTokenId = uuidv4();
    await redisClient.setEx(
      `reset:${resetTokenId}`,
      60 * 60, // 1 hour
      JSON.stringify({
        userId: user.id,
        email: user.email,
        token: resetToken,
      })
    );

    // In production, this would send an email
    // For now, we return the token
    return { resetToken };
  }

  /**
   * Reset password using reset token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      // Verify reset token
      const decoded = verifyToken(token);

      if (decoded.type !== 'reset') {
        throw new Error('Invalid token type');
      }

      // Get user
      const user = await this.userRepository.findById(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password
      await this.userRepository.updatePassword(user.id, hashedPassword);

      // Invalidate all existing tokens for this user by adding user ID to blacklist
      await redisClient.setEx(
        `user:invalidated:${user.id}`,
        24 * 60 * 60, // 24 hours
        new Date().toISOString()
      );
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Password reset failed: ${error.message}`);
      }
      throw new Error('Password reset failed');
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<UserResponse | null> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return null;
    }
    return this.mapUserToResponse(user);
  }

  /**
   * Map User to UserResponse (remove password)
   */
  private mapUserToResponse(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
