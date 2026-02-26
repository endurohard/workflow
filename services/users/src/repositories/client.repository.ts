import Database from '../config/database';
import {
  Client,
  CreateClientData,
  UpdateClientData,
  ClientResponse,
  ClientListQuery,
  PaginatedClientResponse,
} from '../models/client.model';

/**
 * Client repository for database operations
 */
class ClientRepository {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
  }

  /**
   * Create a new client profile
   */
  async create(clientData: CreateClientData): Promise<Client> {
    const query = `
      INSERT INTO clients (
        user_id, company_name, company_registration, tax_id,
        billing_address, shipping_address, payment_terms, credit_limit, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      clientData.user_id,
      clientData.company_name || null,
      clientData.company_registration || null,
      clientData.tax_id || null,
      clientData.billing_address || null,
      clientData.shipping_address || null,
      clientData.payment_terms || null,
      clientData.credit_limit || null,
      clientData.notes || null,
    ];

    try {
      const result = await this.db.query(query, values);
      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23505') {
        throw new Error('Client profile already exists for this user');
      }
      if (error.code === '23503') {
        throw new Error('User not found');
      }
      throw error;
    }
  }

  /**
   * Find client by ID with user details
   */
  async findById(id: string): Promise<ClientResponse | null> {
    const query = `
      SELECT
        c.*,
        json_build_object(
          'id', u.id,
          'email', u.email,
          'first_name', u.first_name,
          'last_name', u.last_name,
          'phone', u.phone,
          'role', u.role,
          'status', u.status,
          'profile_photo_url', u.profile_photo_url,
          'created_at', u.created_at,
          'updated_at', u.updated_at,
          'last_login_at', u.last_login_at
        ) as user
      FROM clients c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
    `;

    const result = await this.db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find client by user_id
   */
  async findByUserId(userId: string): Promise<Client | null> {
    const query = 'SELECT * FROM clients WHERE user_id = $1';
    const result = await this.db.query(query, [userId]);
    return result.rows[0] || null;
  }

  /**
   * Find all clients with filtering, pagination, and sorting
   */
  async findAll(queryParams: ClientListQuery): Promise<PaginatedClientResponse> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = queryParams;

    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;

    // Build WHERE conditions
    if (search) {
      conditions.push(
        `(c.company_name ILIKE $${paramCounter} OR u.first_name ILIKE $${paramCounter} OR u.last_name ILIKE $${paramCounter} OR u.email ILIKE $${paramCounter})`
      );
      values.push(`%${search}%`);
      paramCounter++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) FROM clients c
      JOIN users u ON c.user_id = u.id
      ${whereClause}
    `;
    const countResult = await this.db.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated results with user details
    const dataQuery = `
      SELECT
        c.*,
        json_build_object(
          'id', u.id,
          'email', u.email,
          'first_name', u.first_name,
          'last_name', u.last_name,
          'phone', u.phone,
          'role', u.role,
          'status', u.status,
          'profile_photo_url', u.profile_photo_url,
          'created_at', u.created_at,
          'updated_at', u.updated_at,
          'last_login_at', u.last_login_at
        ) as user
      FROM clients c
      JOIN users u ON c.user_id = u.id
      ${whereClause}
      ORDER BY c.${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;
    values.push(limit, offset);

    const result = await this.db.query(dataQuery, values);
    const clients = result.rows;

    return {
      clients,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update client
   */
  async update(id: string, updateData: UpdateClientData): Promise<Client | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;

    // Build SET clause dynamically
    if (updateData.company_name !== undefined) {
      fields.push(`company_name = $${paramCounter++}`);
      values.push(updateData.company_name);
    }

    if (updateData.company_registration !== undefined) {
      fields.push(`company_registration = $${paramCounter++}`);
      values.push(updateData.company_registration);
    }

    if (updateData.tax_id !== undefined) {
      fields.push(`tax_id = $${paramCounter++}`);
      values.push(updateData.tax_id);
    }

    if (updateData.billing_address !== undefined) {
      fields.push(`billing_address = $${paramCounter++}`);
      values.push(updateData.billing_address);
    }

    if (updateData.shipping_address !== undefined) {
      fields.push(`shipping_address = $${paramCounter++}`);
      values.push(updateData.shipping_address);
    }

    if (updateData.payment_terms !== undefined) {
      fields.push(`payment_terms = $${paramCounter++}`);
      values.push(updateData.payment_terms);
    }

    if (updateData.credit_limit !== undefined) {
      fields.push(`credit_limit = $${paramCounter++}`);
      values.push(updateData.credit_limit);
    }

    if (updateData.notes !== undefined) {
      fields.push(`notes = $${paramCounter++}`);
      values.push(updateData.notes);
    }

    if (fields.length === 0) {
      return this.findByIdSimple(id);
    }

    values.push(id);

    const query = `
      UPDATE clients
      SET ${fields.join(', ')}
      WHERE id = $${paramCounter}
      RETURNING *
    `;

    const result = await this.db.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Find client by ID (simple, without user details)
   */
  private async findByIdSimple(id: string): Promise<Client | null> {
    const query = 'SELECT * FROM clients WHERE id = $1';
    const result = await this.db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Delete client
   */
  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM clients WHERE id = $1';
    const result = await this.db.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }
}

export default ClientRepository;
