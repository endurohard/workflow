import Database from '../config/database';
import {
  User,
  CreateUserData,
  UpdateUserData,
  UserResponse,
  UserListQuery,
  PaginatedUserResponse,
  UserStatus,
} from '../models/user.model';
import bcrypt from 'bcrypt';

/**
 * User repository for database operations
 */
class UserRepository {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
  }

  /**
   * Hash password using bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Convert User to UserResponse (remove sensitive data)
   */
  private toUserResponse(user: User): UserResponse {
    const { password_hash, ...userResponse } = user;
    return userResponse as UserResponse;
  }

  /**
   * Create a new user
   */
  async create(userData: CreateUserData): Promise<User> {
    const passwordHash = await this.hashPassword(userData.password);

    const query = `
      INSERT INTO users (
        email, password_hash, first_name, last_name, phone, role, status, profile_photo_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      userData.email,
      passwordHash,
      userData.first_name,
      userData.last_name,
      userData.phone || null,
      userData.role,
      userData.status || 'active',
      userData.profile_photo_url || null,
    ];

    try {
      const result = await this.db.query(query, values);
      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23505') {
        // Unique violation
        throw new Error('User with this email already exists');
      }
      throw error;
    }
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await this.db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await this.db.query(query, [email]);
    return result.rows[0] || null;
  }

  /**
   * Find all users with filtering, pagination, and sorting
   */
  async findAll(queryParams: UserListQuery): Promise<PaginatedUserResponse> {
    const {
      page = 1,
      limit = 10,
      role,
      status,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = queryParams;

    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;

    // Build WHERE conditions
    if (role) {
      conditions.push(`role = $${paramCounter++}`);
      values.push(role);
    }

    if (status) {
      conditions.push(`status = $${paramCounter++}`);
      values.push(status);
    }

    if (search) {
      conditions.push(
        `(email ILIKE $${paramCounter} OR first_name ILIKE $${paramCounter} OR last_name ILIKE $${paramCounter})`
      );
      values.push(`%${search}%`);
      paramCounter++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM users ${whereClause}`;
    const countResult = await this.db.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated results
    const dataQuery = `
      SELECT * FROM users
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;
    values.push(limit, offset);

    const result = await this.db.query(dataQuery, values);
    const users = result.rows;

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update user
   */
  async update(id: string, updateData: UpdateUserData): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;

    // Build SET clause dynamically
    if (updateData.email !== undefined) {
      fields.push(`email = $${paramCounter++}`);
      values.push(updateData.email);
    }

    if (updateData.password !== undefined) {
      const passwordHash = await this.hashPassword(updateData.password);
      fields.push(`password_hash = $${paramCounter++}`);
      values.push(passwordHash);
    }

    if (updateData.first_name !== undefined) {
      fields.push(`first_name = $${paramCounter++}`);
      values.push(updateData.first_name);
    }

    if (updateData.last_name !== undefined) {
      fields.push(`last_name = $${paramCounter++}`);
      values.push(updateData.last_name);
    }

    if (updateData.phone !== undefined) {
      fields.push(`phone = $${paramCounter++}`);
      values.push(updateData.phone);
    }

    if (updateData.role !== undefined) {
      fields.push(`role = $${paramCounter++}`);
      values.push(updateData.role);
    }

    if (updateData.status !== undefined) {
      fields.push(`status = $${paramCounter++}`);
      values.push(updateData.status);
    }

    if (updateData.profile_photo_url !== undefined) {
      fields.push(`profile_photo_url = $${paramCounter++}`);
      values.push(updateData.profile_photo_url);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramCounter}
      RETURNING *
    `;

    const result = await this.db.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Delete user
   */
  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM users WHERE id = $1';
    const result = await this.db.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  /**
   * Update user status
   */
  async updateStatus(id: string, status: UserStatus): Promise<User | null> {
    const query = `
      UPDATE users
      SET status = $1
      WHERE id = $2
      RETURNING *
    `;
    const result = await this.db.query(query, [status, id]);
    return result.rows[0] || null;
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: string): Promise<void> {
    const query = `
      UPDATE users
      SET last_login_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await this.db.query(query, [id]);
  }

  /**
   * Verify password
   */
  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

export default UserRepository;
