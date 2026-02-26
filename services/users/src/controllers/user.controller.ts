import { Request, Response } from 'express';
import UserRepository from '../repositories/user.repository';
import RedisClient from '../config/redis';
import { CreateUserData, UpdateUserData, UserListQuery } from '../models/user.model';

/**
 * User controller handling all user-related operations
 */
class UserController {
  private userRepository: UserRepository;
  private redisClient: RedisClient;
  private readonly CACHE_TTL = 3600; // 1 hour in seconds

  constructor() {
    this.userRepository = new UserRepository();
    this.redisClient = RedisClient.getInstance();
  }

  /**
   * Create a new user
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const userData: CreateUserData = req.body;
      const user = await this.userRepository.create(userData);

      // Remove password_hash from response
      const { password_hash, ...userResponse } = user;

      res.status(201).json({
        message: 'User created successfully',
        user: userResponse,
      });
    } catch (error: any) {
      console.error('Error creating user:', error);
      if (error.message === 'User with this email already exists') {
        res.status(409).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Failed to create user' });
    }
  };

  /**
   * Get user by ID
   */
  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Try to get from cache first
      const cacheKey = `user:${id}`;
      const cachedUser = await this.redisClient.get(cacheKey);

      if (cachedUser) {
        res.json({ user: JSON.parse(cachedUser) });
        return;
      }

      const user = await this.userRepository.findById(id);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Remove password_hash from response
      const { password_hash, ...userResponse } = user;

      // Cache the user
      await this.redisClient.set(cacheKey, JSON.stringify(userResponse), this.CACHE_TTL);

      res.json({ user: userResponse });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  };

  /**
   * Get all users with filtering and pagination
   */
  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const query: UserListQuery = req.query;
      const result = await this.userRepository.findAll(query);

      // Remove password_hash from all users
      const users = result.users.map(({ password_hash, ...user }) => user);

      res.json({
        users,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  };

  /**
   * Update user
   */
  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData: UpdateUserData = req.body;

      const updatedUser = await this.userRepository.update(id, updateData);

      if (!updatedUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Remove password_hash from response
      const { password_hash, ...userResponse } = updatedUser;

      // Invalidate cache
      await this.redisClient.delete(`user:${id}`);

      res.json({
        message: 'User updated successfully',
        user: userResponse,
      });
    } catch (error: any) {
      console.error('Error updating user:', error);
      if (error.message === 'User with this email already exists') {
        res.status(409).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Failed to update user' });
    }
  };

  /**
   * Delete user
   */
  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const deleted = await this.userRepository.delete(id);

      if (!deleted) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Invalidate cache
      await this.redisClient.delete(`user:${id}`);

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  };

  /**
   * Update user status
   */
  updateStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const updatedUser = await this.userRepository.updateStatus(id, status);

      if (!updatedUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Remove password_hash from response
      const { password_hash, ...userResponse } = updatedUser;

      // Invalidate cache
      await this.redisClient.delete(`user:${id}`);

      res.json({
        message: 'User status updated successfully',
        user: userResponse,
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).json({ error: 'Failed to update user status' });
    }
  };

  /**
   * Upload profile photo
   */
  uploadPhoto = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      // Generate URL for the uploaded file
      const photoUrl = `/uploads/profile-photos/${req.file.filename}`;

      // Update user with new photo URL
      const updatedUser = await this.userRepository.update(id, {
        profile_photo_url: photoUrl,
      });

      if (!updatedUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Remove password_hash from response
      const { password_hash, ...userResponse } = updatedUser;

      // Invalidate cache
      await this.redisClient.delete(`user:${id}`);

      res.json({
        message: 'Profile photo uploaded successfully',
        user: userResponse,
        photoUrl,
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      res.status(500).json({ error: 'Failed to upload photo' });
    }
  };
}

export default UserController;
