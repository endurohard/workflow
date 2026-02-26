import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Database connection configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'service_manager_test',
  user: process.env.DB_USER || 'serviceuser',
  password: process.env.DB_PASSWORD || 'servicepass',
});

describe('Database Schema Tests', () => {
  beforeAll(async () => {
    // Run the migration to set up the schema
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../migrations/1709000000000_initial-schema.sql'),
      'utf8'
    );
    await pool.query(migrationSQL);
  });

  afterAll(async () => {
    // Clean up - run rollback
    const rollbackSQL = fs.readFileSync(
      path.join(__dirname, '../migrations/1709000000000_initial-schema-down.sql'),
      'utf8'
    );
    await pool.query(rollbackSQL);
    await pool.end();
  });

  describe('Table Creation', () => {
    test('should create users table', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'users'
        );
      `);
      expect(result.rows[0].exists).toBe(true);
    });

    test('should create technicians table', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'technicians'
        );
      `);
      expect(result.rows[0].exists).toBe(true);
    });

    test('should create clients table', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'clients'
        );
      `);
      expect(result.rows[0].exists).toBe(true);
    });

    test('should create orders table', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'orders'
        );
      `);
      expect(result.rows[0].exists).toBe(true);
    });

    test('should create tasks table', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'tasks'
        );
      `);
      expect(result.rows[0].exists).toBe(true);
    });

    test('should create schedules table', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'schedules'
        );
      `);
      expect(result.rows[0].exists).toBe(true);
    });

    test('should create notifications table', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'notifications'
        );
      `);
      expect(result.rows[0].exists).toBe(true);
    });

    test('should create task_comments table', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'task_comments'
        );
      `);
      expect(result.rows[0].exists).toBe(true);
    });

    test('should create order_status_history table', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'order_status_history'
        );
      `);
      expect(result.rows[0].exists).toBe(true);
    });

    test('should create reports table', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'reports'
        );
      `);
      expect(result.rows[0].exists).toBe(true);
    });

    test('should create audit_log table', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'audit_log'
        );
      `);
      expect(result.rows[0].exists).toBe(true);
    });
  });

  describe('Foreign Key Constraints', () => {
    test('should have foreign key from technicians to users', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_type = 'FOREIGN KEY'
          AND table_name = 'technicians'
          AND constraint_name LIKE '%user_id%'
        );
      `);
      expect(result.rows[0].exists).toBe(true);
    });

    test('should have foreign key from clients to users', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_type = 'FOREIGN KEY'
          AND table_name = 'clients'
          AND constraint_name LIKE '%user_id%'
        );
      `);
      expect(result.rows[0].exists).toBe(true);
    });

    test('should have foreign key from orders to clients', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_type = 'FOREIGN KEY'
          AND table_name = 'orders'
          AND constraint_name LIKE '%client_id%'
        );
      `);
      expect(result.rows[0].exists).toBe(true);
    });

    test('should have foreign key from tasks to orders', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_type = 'FOREIGN KEY'
          AND table_name = 'tasks'
          AND constraint_name LIKE '%order_id%'
        );
      `);
      expect(result.rows[0].exists).toBe(true);
    });
  });

  describe('Indexes', () => {
    test('should have index on users.email', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_indexes
          WHERE tablename = 'users'
          AND indexname = 'idx_users_email'
        );
      `);
      expect(result.rows[0].exists).toBe(true);
    });

    test('should have index on orders.status', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_indexes
          WHERE tablename = 'orders'
          AND indexname = 'idx_orders_status'
        );
      `);
      expect(result.rows[0].exists).toBe(true);
    });

    test('should have index on tasks.technician_id', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_indexes
          WHERE tablename = 'tasks'
          AND indexname = 'idx_tasks_technician'
        );
      `);
      expect(result.rows[0].exists).toBe(true);
    });

    test('should have GIN index on orders.metadata', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_indexes
          WHERE tablename = 'orders'
          AND indexname = 'idx_orders_metadata'
        );
      `);
      expect(result.rows[0].exists).toBe(true);
    });
  });

  describe('Views', () => {
    test('should create v_active_orders view', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.views
          WHERE table_schema = 'public'
          AND table_name = 'v_active_orders'
        );
      `);
      expect(result.rows[0].exists).toBe(true);
    });

    test('should create v_technician_workload view', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.views
          WHERE table_schema = 'public'
          AND table_name = 'v_technician_workload'
        );
      `);
      expect(result.rows[0].exists).toBe(true);
    });

    test('should create v_order_analytics view', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.views
          WHERE table_schema = 'public'
          AND table_name = 'v_order_analytics'
        );
      `);
      expect(result.rows[0].exists).toBe(true);
    });

    test('should create v_unread_notifications view', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.views
          WHERE table_schema = 'public'
          AND table_name = 'v_unread_notifications'
        );
      `);
      expect(result.rows[0].exists).toBe(true);
    });
  });

  describe('Triggers', () => {
    test('should create update_updated_at trigger on users', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_trigger
          WHERE tgname = 'update_users_updated_at'
        );
      `);
      expect(result.rows[0].exists).toBe(true);
    });

    test('should create audit trigger on users', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_trigger
          WHERE tgname = 'audit_users'
        );
      `);
      expect(result.rows[0].exists).toBe(true);
    });

    test('should create log_order_status trigger on orders', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_trigger
          WHERE tgname = 'log_order_status'
        );
      `);
      expect(result.rows[0].exists).toBe(true);
    });
  });

  describe('Check Constraints', () => {
    test('should enforce email format constraint', async () => {
      await expect(
        pool.query(`
          INSERT INTO users (email, password_hash, first_name, last_name, role)
          VALUES ('invalid-email', 'hash', 'Test', 'User', 'client')
        `)
      ).rejects.toThrow();
    });

    test('should enforce rating range constraint', async () => {
      // First create a valid user
      const userResult = await pool.query(`
        INSERT INTO users (email, password_hash, first_name, last_name, role)
        VALUES ('tech@test.com', 'hash', 'Test', 'Tech', 'technician')
        RETURNING id
      `);

      // Try to create technician with invalid rating
      await expect(
        pool.query(`
          INSERT INTO technicians (user_id, rating)
          VALUES ($1, 6.0)
        `, [userResult.rows[0].id])
      ).rejects.toThrow();
    });

    test('should enforce positive cost constraint', async () => {
      // Create required dependencies
      const userResult = await pool.query(`
        INSERT INTO users (email, password_hash, first_name, last_name, role)
        VALUES ('client@test.com', 'hash', 'Test', 'Client', 'client')
        RETURNING id
      `);

      const clientResult = await pool.query(`
        INSERT INTO clients (user_id)
        VALUES ($1)
        RETURNING id
      `, [userResult.rows[0].id]);

      // Try to create order with negative cost
      await expect(
        pool.query(`
          INSERT INTO orders (order_number, client_id, title, description, service_type, estimated_cost, service_address)
          VALUES ('TEST-001', $1, 'Test Order', 'Test Description', 'Test Service', -100, '123 Test St')
        `, [clientResult.rows[0].id])
      ).rejects.toThrow();
    });
  });

  describe('Soft Delete Functionality', () => {
    test('should support soft delete on users', async () => {
      const result = await pool.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'deleted_at'
      `);
      expect(result.rows.length).toBe(1);
    });

    test('should support soft delete on orders', async () => {
      const result = await pool.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'orders'
        AND column_name = 'deleted_at'
      `);
      expect(result.rows.length).toBe(1);
    });

    test('should support soft delete on tasks', async () => {
      const result = await pool.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'tasks'
        AND column_name = 'deleted_at'
      `);
      expect(result.rows.length).toBe(1);
    });
  });

  describe('Enum Types', () => {
    test('should create user_role enum', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_type
          WHERE typname = 'user_role'
        );
      `);
      expect(result.rows[0].exists).toBe(true);
    });

    test('should create order_status enum', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_type
          WHERE typname = 'order_status'
        );
      `);
      expect(result.rows[0].exists).toBe(true);
    });

    test('should create task_status enum', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_type
          WHERE typname = 'task_status'
        );
      `);
      expect(result.rows[0].exists).toBe(true);
    });
  });

  describe('Extensions', () => {
    test('should enable uuid-ossp extension', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_extension
          WHERE extname = 'uuid-ossp'
        );
      `);
      expect(result.rows[0].exists).toBe(true);
    });

    test('should enable pgcrypto extension', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_extension
          WHERE extname = 'pgcrypto'
        );
      `);
      expect(result.rows[0].exists).toBe(true);
    });
  });
});

describe('Data Integrity Tests', () => {
  beforeAll(async () => {
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../migrations/1709000000000_initial-schema.sql'),
      'utf8'
    );
    await pool.query(migrationSQL);
  });

  afterEach(async () => {
    // Clean up test data after each test
    await pool.query('TRUNCATE users, technicians, clients, orders, tasks, schedules, notifications, task_comments, order_status_history, reports, audit_log CASCADE');
  });

  afterAll(async () => {
    const rollbackSQL = fs.readFileSync(
      path.join(__dirname, '../migrations/1709000000000_initial-schema-down.sql'),
      'utf8'
    );
    await pool.query(rollbackSQL);
    await pool.end();
  });

  describe('User Operations', () => {
    test('should insert valid user', async () => {
      const result = await pool.query(`
        INSERT INTO users (email, password_hash, first_name, last_name, role)
        VALUES ('test@example.com', 'hashed_password', 'John', 'Doe', 'client')
        RETURNING id, email, role
      `);

      expect(result.rows[0].email).toBe('test@example.com');
      expect(result.rows[0].role).toBe('client');
    });

    test('should prevent duplicate email', async () => {
      await pool.query(`
        INSERT INTO users (email, password_hash, first_name, last_name, role)
        VALUES ('duplicate@example.com', 'hash', 'John', 'Doe', 'client')
      `);

      await expect(
        pool.query(`
          INSERT INTO users (email, password_hash, first_name, last_name, role)
          VALUES ('duplicate@example.com', 'hash', 'Jane', 'Smith', 'client')
        `)
      ).rejects.toThrow();
    });

    test('should auto-generate UUID for user', async () => {
      const result = await pool.query(`
        INSERT INTO users (email, password_hash, first_name, last_name, role)
        VALUES ('uuid@example.com', 'hash', 'Test', 'User', 'client')
        RETURNING id
      `);

      expect(result.rows[0].id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });
  });

  describe('Trigger Functionality', () => {
    test('should auto-update updated_at on user update', async () => {
      const insertResult = await pool.query(`
        INSERT INTO users (email, password_hash, first_name, last_name, role)
        VALUES ('trigger@example.com', 'hash', 'Test', 'User', 'client')
        RETURNING id, updated_at
      `);

      const originalUpdatedAt = insertResult.rows[0].updated_at;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      await pool.query(`
        UPDATE users
        SET first_name = 'Updated'
        WHERE id = $1
      `, [insertResult.rows[0].id]);

      const updateResult = await pool.query(`
        SELECT updated_at FROM users WHERE id = $1
      `, [insertResult.rows[0].id]);

      expect(new Date(updateResult.rows[0].updated_at).getTime())
        .toBeGreaterThan(new Date(originalUpdatedAt).getTime());
    });

    test('should log to audit_log on user insert', async () => {
      const userResult = await pool.query(`
        INSERT INTO users (email, password_hash, first_name, last_name, role)
        VALUES ('audit@example.com', 'hash', 'Audit', 'User', 'client')
        RETURNING id
      `);

      const auditResult = await pool.query(`
        SELECT * FROM audit_log
        WHERE table_name = 'users'
        AND record_id = $1
        AND operation = 'INSERT'
      `, [userResult.rows[0].id]);

      expect(auditResult.rows.length).toBe(1);
      expect(auditResult.rows[0].new_data).toBeDefined();
    });
  });

  describe('Cascading Operations', () => {
    test('should cascade delete from user to technician', async () => {
      const userResult = await pool.query(`
        INSERT INTO users (email, password_hash, first_name, last_name, role)
        VALUES ('cascade@example.com', 'hash', 'Test', 'Technician', 'technician')
        RETURNING id
      `);

      await pool.query(`
        INSERT INTO technicians (user_id, specialization)
        VALUES ($1, 'HVAC')
      `, [userResult.rows[0].id]);

      await pool.query(`
        DELETE FROM users WHERE id = $1
      `, [userResult.rows[0].id]);

      const techResult = await pool.query(`
        SELECT * FROM technicians WHERE user_id = $1
      `, [userResult.rows[0].id]);

      expect(techResult.rows.length).toBe(0);
    });
  });
});
