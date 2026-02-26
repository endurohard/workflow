import { Pool, PoolClient } from 'pg';
import UserRepository from '../user.repository';
import { CreateUserData, UpdateUserData, UserRole, UserStatus, UserListQuery } from '../../models/user.model';
import bcrypt from 'bcrypt';

// Mock the database
jest.mock('../../config/database');

describe('UserRepository', () => {
  let userRepository: UserRepository;
  let mockQuery: jest.Mock;
  let mockGetClient: jest.Mock;
  let mockClient: Partial<PoolClient>;

  beforeEach(() => {
    // Reset mocks
    mockQuery = jest.fn();
    mockGetClient = jest.fn();
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    mockGetClient.mockResolvedValue(mockClient);

    // Mock Database.getInstance()
    const Database = require('../../config/database').default;
    Database.getInstance = jest.fn(() => ({
      query: mockQuery,
      getClient: mockGetClient,
    }));

    userRepository = new UserRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user with hashed password', async () => {
      const userData: CreateUserData = {
        email: 'test@example.com',
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe',
        role: UserRole.CLIENT,
        phone: '+1234567890',
      };

      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: userData.email,
        password_hash: 'hashed_password',
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone,
        role: userData.role,
        status: UserStatus.ACTIVE,
        profile_photo_url: null,
        created_at: new Date(),
        updated_at: new Date(),
        last_login_at: null,
      };

      mockQuery.mockResolvedValue({ rows: [mockUser], rowCount: 1 });

      const result = await userRepository.create(userData);

      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockQuery.mock.calls[0][0]).toContain('INSERT INTO users');
      expect(mockQuery.mock.calls[0][0]).toContain('password_hash');
      expect(result).toEqual(mockUser);
    });

    it('should throw error if email already exists', async () => {
      const userData: CreateUserData = {
        email: 'existing@example.com',
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe',
        role: UserRole.CLIENT,
      };

      mockQuery.mockRejectedValue({ code: '23505' }); // Unique violation

      await expect(userRepository.create(userData)).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should return user by id', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Doe',
        phone: null,
        role: UserRole.CLIENT,
        status: UserStatus.ACTIVE,
        profile_photo_url: null,
        created_at: new Date(),
        updated_at: new Date(),
        last_login_at: null,
      };

      mockQuery.mockResolvedValue({ rows: [mockUser], rowCount: 1 });

      const result = await userRepository.findById(userId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM users WHERE id = $1'),
        [userId]
      );
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      const result = await userRepository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      const email = 'test@example.com';
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email,
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Doe',
        phone: null,
        role: UserRole.CLIENT,
        status: UserStatus.ACTIVE,
        profile_photo_url: null,
        created_at: new Date(),
        updated_at: new Date(),
        last_login_at: null,
      };

      mockQuery.mockResolvedValue({ rows: [mockUser], rowCount: 1 });

      const result = await userRepository.findByEmail(email);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM users WHERE email = $1'),
        [email]
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('findAll', () => {
    it('should return paginated users with default pagination', async () => {
      const mockUsers = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'user1@example.com',
          password_hash: 'hash1',
          first_name: 'User',
          last_name: 'One',
          phone: null,
          role: UserRole.CLIENT,
          status: UserStatus.ACTIVE,
          profile_photo_url: null,
          created_at: new Date(),
          updated_at: new Date(),
          last_login_at: null,
        },
      ];

      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '10' }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: mockUsers, rowCount: 1 });

      const query: UserListQuery = {};
      const result = await userRepository.findAll(query);

      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(result.users).toEqual(mockUsers);
      expect(result.total).toBe(10);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should filter users by role', async () => {
      const mockUsers = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'tech@example.com',
          password_hash: 'hash',
          first_name: 'Tech',
          last_name: 'User',
          phone: null,
          role: UserRole.TECHNICIAN,
          status: UserStatus.ACTIVE,
          profile_photo_url: null,
          created_at: new Date(),
          updated_at: new Date(),
          last_login_at: null,
        },
      ];

      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '5' }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: mockUsers, rowCount: 1 });

      const query: UserListQuery = { role: UserRole.TECHNICIAN };
      const result = await userRepository.findAll(query);

      expect(mockQuery.mock.calls[0][0]).toContain('WHERE role = $1');
      expect(mockQuery.mock.calls[0][1]).toContain(UserRole.TECHNICIAN);
      expect(result.users).toEqual(mockUsers);
    });

    it('should search users by email, first_name, or last_name', async () => {
      const mockUsers = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'john.doe@example.com',
          password_hash: 'hash',
          first_name: 'John',
          last_name: 'Doe',
          phone: null,
          role: UserRole.CLIENT,
          status: UserStatus.ACTIVE,
          profile_photo_url: null,
          created_at: new Date(),
          updated_at: new Date(),
          last_login_at: null,
        },
      ];

      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: mockUsers, rowCount: 1 });

      const query: UserListQuery = { search: 'john' };
      const result = await userRepository.findAll(query);

      expect(mockQuery.mock.calls[0][0]).toContain('ILIKE');
      expect(result.users).toEqual(mockUsers);
    });

    it('should sort users by specified field', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '10' }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const query: UserListQuery = { sortBy: 'email', sortOrder: 'desc' };
      await userRepository.findAll(query);

      expect(mockQuery.mock.calls[1][0]).toContain('ORDER BY email DESC');
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const updateData: UpdateUserData = {
        first_name: 'Jane',
        last_name: 'Smith',
        phone: '+0987654321',
      };

      const mockUpdatedUser = {
        id: userId,
        email: 'test@example.com',
        password_hash: 'hash',
        first_name: 'Jane',
        last_name: 'Smith',
        phone: '+0987654321',
        role: UserRole.CLIENT,
        status: UserStatus.ACTIVE,
        profile_photo_url: null,
        created_at: new Date(),
        updated_at: new Date(),
        last_login_at: null,
      };

      mockQuery.mockResolvedValue({ rows: [mockUpdatedUser], rowCount: 1 });

      const result = await userRepository.update(userId, updateData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET'),
        expect.arrayContaining([userId])
      );
      expect(result).toEqual(mockUpdatedUser);
    });

    it('should hash password if provided in update', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const updateData: UpdateUserData = {
        password: 'newpassword123',
      };

      mockQuery.mockResolvedValue({ rows: [{ id: userId }], rowCount: 1 });

      await userRepository.update(userId, updateData);

      expect(mockQuery.mock.calls[0][0]).toContain('password_hash');
    });

    it('should return null if user not found', async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      const result = await userRepository.update('non-existent-id', { first_name: 'Test' });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete user by id', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });

      const result = await userRepository.delete(userId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM users WHERE id = $1'),
        [userId]
      );
      expect(result).toBe(true);
    });

    it('should return false if user not found', async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      const result = await userRepository.delete('non-existent-id');

      expect(result).toBe(false);
    });
  });

  describe('updateStatus', () => {
    it('should update user status', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const newStatus = UserStatus.INACTIVE;

      const mockUser = {
        id: userId,
        email: 'test@example.com',
        password_hash: 'hash',
        first_name: 'John',
        last_name: 'Doe',
        phone: null,
        role: UserRole.CLIENT,
        status: newStatus,
        profile_photo_url: null,
        created_at: new Date(),
        updated_at: new Date(),
        last_login_at: null,
      };

      mockQuery.mockResolvedValue({ rows: [mockUser], rowCount: 1 });

      const result = await userRepository.updateStatus(userId, newStatus);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET status = $1'),
        [newStatus, userId]
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login timestamp', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });

      await userRepository.updateLastLogin(userId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET last_login_at = CURRENT_TIMESTAMP'),
        [userId]
      );
    });
  });
});
