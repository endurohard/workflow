import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { User, CreateUserDTO, UpdateUserDTO } from '../models/user.model';

export class UserRepository {
  constructor(private pool: Pool) {}

  async create(userData: CreateUserDTO): Promise<User> {
    const id = uuidv4();
    const query = `
      INSERT INTO users (id, email, password, first_name, last_name, role, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      id,
      userData.email.toLowerCase(),
      userData.password,
      userData.firstName,
      userData.lastName,
      userData.role,
      true,
    ];

    const result = await this.pool.query(query, values);
    return this.mapRowToUser(result.rows[0]);
  }

  async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await this.pool.query(query, [email.toLowerCase()]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  async findById(id: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await this.pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  async update(id: string, userData: UpdateUserDTO): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (userData.firstName !== undefined) {
      fields.push(`first_name = $${paramIndex++}`);
      values.push(userData.firstName);
    }

    if (userData.lastName !== undefined) {
      fields.push(`last_name = $${paramIndex++}`);
      values.push(userData.lastName);
    }

    if (userData.isActive !== undefined) {
      fields.push(`is_active = $${paramIndex++}`);
      values.push(userData.isActive);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    const query = `
      UPDATE users
      SET password = $1, updated_at = NOW()
      WHERE id = $2
    `;
    await this.pool.query(query, [hashedPassword, id]);
  }

  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM users WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      password: row.password,
      firstName: row.first_name,
      lastName: row.last_name,
      role: row.role,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
