import Database from '../config/database';
import {
  Technician,
  CreateTechnicianData,
  UpdateTechnicianData,
  TechnicianResponse,
  TechnicianListQuery,
  PaginatedTechnicianResponse,
  TechnicianStatistics,
  TechnicianSchedule,
  CreateScheduleData,
  UpdateScheduleData,
} from '../models/technician.model';

/**
 * Technician repository for database operations
 */
class TechnicianRepository {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
  }

  /**
   * Create a new technician profile
   */
  async create(techData: CreateTechnicianData): Promise<Technician> {
    const query = `
      INSERT INTO technicians (
        user_id, specialization, certification_level, bio, skills,
        service_radius_km, hourly_rate, is_available
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      techData.user_id,
      techData.specialization || null,
      techData.certification_level || null,
      techData.bio || null,
      techData.skills || [],
      techData.service_radius_km || 50,
      techData.hourly_rate || null,
      techData.is_available !== undefined ? techData.is_available : true,
    ];

    try {
      const result = await this.db.query(query, values);
      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23505') {
        throw new Error('Technician profile already exists for this user');
      }
      if (error.code === '23503') {
        throw new Error('User not found');
      }
      throw error;
    }
  }

  /**
   * Find technician by ID with user details
   */
  async findById(id: string): Promise<TechnicianResponse | null> {
    const query = `
      SELECT
        t.*,
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
      FROM technicians t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = $1
    `;

    const result = await this.db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find technician by user_id
   */
  async findByUserId(userId: string): Promise<Technician | null> {
    const query = 'SELECT * FROM technicians WHERE user_id = $1';
    const result = await this.db.query(query, [userId]);
    return result.rows[0] || null;
  }

  /**
   * Find all technicians with filtering, pagination, and sorting
   */
  async findAll(queryParams: TechnicianListQuery): Promise<PaginatedTechnicianResponse> {
    const {
      page = 1,
      limit = 10,
      specialization,
      is_available,
      min_rating,
      skills,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = queryParams;

    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;

    // Build WHERE conditions
    if (specialization) {
      conditions.push(`t.specialization = $${paramCounter++}`);
      values.push(specialization);
    }

    if (is_available !== undefined) {
      conditions.push(`t.is_available = $${paramCounter++}`);
      values.push(is_available);
    }

    if (min_rating !== undefined) {
      conditions.push(`t.rating >= $${paramCounter++}`);
      values.push(min_rating);
    }

    if (skills && skills.length > 0) {
      conditions.push(`t.skills && $${paramCounter++}`);
      values.push(skills);
    }

    if (search) {
      conditions.push(
        `(u.first_name ILIKE $${paramCounter} OR u.last_name ILIKE $${paramCounter} OR t.specialization ILIKE $${paramCounter})`
      );
      values.push(`%${search}%`);
      paramCounter++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) FROM technicians t
      JOIN users u ON t.user_id = u.id
      ${whereClause}
    `;
    const countResult = await this.db.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated results with user details
    const dataQuery = `
      SELECT
        t.*,
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
      FROM technicians t
      JOIN users u ON t.user_id = u.id
      ${whereClause}
      ORDER BY t.${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;
    values.push(limit, offset);

    const result = await this.db.query(dataQuery, values);
    const technicians = result.rows;

    return {
      technicians,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update technician
   */
  async update(id: string, updateData: UpdateTechnicianData): Promise<Technician | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;

    // Build SET clause dynamically
    if (updateData.specialization !== undefined) {
      fields.push(`specialization = $${paramCounter++}`);
      values.push(updateData.specialization);
    }

    if (updateData.certification_level !== undefined) {
      fields.push(`certification_level = $${paramCounter++}`);
      values.push(updateData.certification_level);
    }

    if (updateData.bio !== undefined) {
      fields.push(`bio = $${paramCounter++}`);
      values.push(updateData.bio);
    }

    if (updateData.skills !== undefined) {
      fields.push(`skills = $${paramCounter++}`);
      values.push(updateData.skills);
    }

    if (updateData.service_radius_km !== undefined) {
      fields.push(`service_radius_km = $${paramCounter++}`);
      values.push(updateData.service_radius_km);
    }

    if (updateData.hourly_rate !== undefined) {
      fields.push(`hourly_rate = $${paramCounter++}`);
      values.push(updateData.hourly_rate);
    }

    if (updateData.is_available !== undefined) {
      fields.push(`is_available = $${paramCounter++}`);
      values.push(updateData.is_available);
    }

    if (fields.length === 0) {
      return this.findByIdSimple(id);
    }

    values.push(id);

    const query = `
      UPDATE technicians
      SET ${fields.join(', ')}
      WHERE id = $${paramCounter}
      RETURNING *
    `;

    const result = await this.db.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Find technician by ID (simple, without user details)
   */
  private async findByIdSimple(id: string): Promise<Technician | null> {
    const query = 'SELECT * FROM technicians WHERE id = $1';
    const result = await this.db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Delete technician
   */
  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM technicians WHERE id = $1';
    const result = await this.db.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  /**
   * Get technician statistics
   */
  async getStatistics(technicianId: string): Promise<TechnicianStatistics | null> {
    const query = `
      SELECT
        t.id as technician_id,
        t.total_tasks_completed,
        COALESCE(SUM(tasks.actual_hours), 0) as total_hours_worked,
        t.rating as average_rating,
        COALESCE(SUM(tasks.actual_hours * t.hourly_rate), 0) as total_revenue,
        COUNT(CASE WHEN tasks.completed_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as tasks_this_month,
        COALESCE(SUM(CASE WHEN tasks.completed_at >= DATE_TRUNC('month', CURRENT_DATE) THEN tasks.actual_hours ELSE 0 END), 0) as hours_this_month,
        COALESCE(SUM(CASE WHEN tasks.completed_at >= DATE_TRUNC('month', CURRENT_DATE) THEN tasks.actual_hours * t.hourly_rate ELSE 0 END), 0) as revenue_this_month
      FROM technicians t
      LEFT JOIN tasks ON t.id = tasks.technician_id AND tasks.status = 'completed'
      WHERE t.id = $1
      GROUP BY t.id
    `;

    const result = await this.db.query(query, [technicianId]);
    return result.rows[0] || null;
  }

  /**
   * Create schedule entry
   */
  async createSchedule(scheduleData: CreateScheduleData): Promise<TechnicianSchedule> {
    const query = `
      INSERT INTO technician_schedules (
        technician_id, date, start_time, end_time, is_available, notes
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      scheduleData.technician_id,
      scheduleData.date,
      scheduleData.start_time,
      scheduleData.end_time,
      scheduleData.is_available !== undefined ? scheduleData.is_available : true,
      scheduleData.notes || null,
    ];

    try {
      const result = await this.db.query(query, values);
      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23505') {
        throw new Error('Schedule entry already exists for this time slot');
      }
      throw error;
    }
  }

  /**
   * Find schedules by technician ID
   */
  async findSchedulesByTechnicianId(
    technicianId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<TechnicianSchedule[]> {
    let query = `
      SELECT * FROM technician_schedules
      WHERE technician_id = $1
    `;
    const values: any[] = [technicianId];

    if (startDate && endDate) {
      query += ' AND date >= $2 AND date <= $3';
      values.push(startDate, endDate);
    }

    query += ' ORDER BY date ASC, start_time ASC';

    const result = await this.db.query(query, values);
    return result.rows;
  }

  /**
   * Update schedule entry
   */
  async updateSchedule(
    scheduleId: string,
    updateData: UpdateScheduleData
  ): Promise<TechnicianSchedule | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;

    if (updateData.date !== undefined) {
      fields.push(`date = $${paramCounter++}`);
      values.push(updateData.date);
    }

    if (updateData.start_time !== undefined) {
      fields.push(`start_time = $${paramCounter++}`);
      values.push(updateData.start_time);
    }

    if (updateData.end_time !== undefined) {
      fields.push(`end_time = $${paramCounter++}`);
      values.push(updateData.end_time);
    }

    if (updateData.is_available !== undefined) {
      fields.push(`is_available = $${paramCounter++}`);
      values.push(updateData.is_available);
    }

    if (updateData.notes !== undefined) {
      fields.push(`notes = $${paramCounter++}`);
      values.push(updateData.notes);
    }

    if (fields.length === 0) {
      const query = 'SELECT * FROM technician_schedules WHERE id = $1';
      const result = await this.db.query(query, [scheduleId]);
      return result.rows[0] || null;
    }

    values.push(scheduleId);

    const query = `
      UPDATE technician_schedules
      SET ${fields.join(', ')}
      WHERE id = $${paramCounter}
      RETURNING *
    `;

    const result = await this.db.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Delete schedule entry
   */
  async deleteSchedule(scheduleId: string): Promise<boolean> {
    const query = 'DELETE FROM technician_schedules WHERE id = $1';
    const result = await this.db.query(query, [scheduleId]);
    return (result.rowCount || 0) > 0;
  }
}

export default TechnicianRepository;
