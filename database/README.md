# Database Management

This directory contains the complete database schema, migrations, and management tools for the Workflow Service Management System.

## Directory Structure

```
database/
├── docs/               # Documentation
│   └── SCHEMA.md       # Complete schema documentation with ER diagram
├── init/               # Initial setup scripts
│   └── 01-seed-data.sql # Test data for development
├── migrations/         # Database migrations
│   ├── 1709000000000_initial-schema.sql      # Main schema migration
│   └── 1709000000000_initial-schema-down.sql # Rollback script
├── package.json        # Node.js dependencies
├── .env.example        # Environment variables template
└── .pgmigrate.json     # Migration tool configuration
```

## Quick Start

### 1. Install Dependencies

```bash
cd database
npm install
```

### 2. Configure Database Connection

Copy the example environment file and update with your database credentials:

```bash
cp .env.example .env
```

Edit `.env` with your database connection details:

```env
DATABASE_URL=postgres://serviceuser:servicepass@localhost:5432/service_manager
DB_HOST=localhost
DB_PORT=5432
DB_NAME=service_manager
DB_USER=serviceuser
DB_PASSWORD=servicepass
```

### 3. Run Migrations

Apply all migrations to create the database schema:

```bash
npm run migrate:up
```

### 4. Load Seed Data (Development Only)

If using Docker Compose, seed data is automatically loaded from `init/01-seed-data.sql`.

For manual loading:

```bash
psql -U serviceuser -d service_manager -f init/01-seed-data.sql
```

## Features

### ✅ Complete Schema
- 11 tables with proper relationships
- 8 enum types for type safety
- Full normalization with efficient joins

### ✅ Performance Optimized
- 50+ strategic indexes
- GIN indexes for JSONB columns
- GIST indexes for geospatial queries
- Partial indexes for soft-deleted records

### ✅ Data Integrity
- Foreign key constraints
- Check constraints for validation
- Unique constraints
- NOT NULL enforcement

### ✅ Soft Delete
- All major tables support soft delete
- `deleted_at` timestamp column
- Indexes exclude deleted records

### ✅ Audit Logging
- Comprehensive audit_log table
- Automatic logging via triggers
- Tracks INSERT, UPDATE, DELETE operations
- Stores old and new data as JSONB

### ✅ Business Logic Triggers
- Auto-update timestamps
- Order status change logging
- Client order count updates
- Technician rating validation

### ✅ Complex Query Views
- `v_active_orders` - Active orders with details
- `v_technician_workload` - Workload analysis
- `v_order_analytics` - Daily statistics
- `v_unread_notifications` - Notification counts

## Available Scripts

### Migration Commands

```bash
# Apply all pending migrations
npm run migrate:up

# Rollback last migration
npm run migrate:down

# Create a new migration
npm run migrate:create <migration-name>

# Redo last migration (down then up)
npm run migrate:redo
```

### Testing Commands

```bash
# Run all tests
npm test

# Run tests with coverage
npm test:coverage
```

## Schema Overview

### Core Tables

1. **users** - All system users (admin, dispatcher, technician, client)
2. **technicians** - Extended info for technician users
3. **clients** - Extended info for client users
4. **orders** - Service orders/requests
5. **tasks** - Individual tasks assigned to technicians
6. **schedules** - Technician availability and scheduling
7. **notifications** - System notifications
8. **task_comments** - Task communication
9. **order_status_history** - Order status audit trail
10. **reports** - Service completion reports
11. **audit_log** - Comprehensive change audit log

### Key Relationships

- Users → Technicians (1:1)
- Users → Clients (1:1)
- Clients → Orders (1:N)
- Orders → Tasks (1:N)
- Technicians → Tasks (1:N)
- Technicians → Schedules (1:N)
- Tasks → Task Comments (1:N)
- Orders → Order Status History (1:N)
- Orders → Reports (1:N)

## Database Access

### Via Docker Compose

```bash
# Connect to database
docker-compose exec postgres psql -U serviceuser -d service_manager

# View tables
\dt

# Describe table
\d users

# View all views
\dv

# View all triggers
\dy
```

### Direct Connection

```bash
# Using psql
psql -h localhost -U serviceuser -d service_manager

# Using connection string
psql postgres://serviceuser:servicepass@localhost:5432/service_manager
```

## Common Queries

### Check Active Orders

```sql
SELECT * FROM v_active_orders
WHERE status IN ('pending', 'assigned', 'in_progress')
ORDER BY priority DESC, created_at ASC;
```

### Find Available Technicians

```sql
SELECT
    t.id,
    u.first_name || ' ' || u.last_name as name,
    t.specialization,
    t.rating,
    t.is_available
FROM technicians t
JOIN users u ON t.user_id = u.id
WHERE t.is_available = true
    AND t.deleted_at IS NULL
    AND u.status = 'active'
ORDER BY t.rating DESC;
```

### Technician Workload

```sql
SELECT * FROM v_technician_workload
ORDER BY active_tasks DESC, rating DESC;
```

### Order Analytics (Last 30 Days)

```sql
SELECT * FROM v_order_analytics
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date DESC;
```

### Audit Trail for Order

```sql
SELECT
    operation,
    old_data->>'status' as old_status,
    new_data->>'status' as new_status,
    changed_at
FROM audit_log
WHERE table_name = 'orders'
    AND record_id = 'order-uuid-here'
ORDER BY changed_at DESC;
```

## Test Data

The seed data includes:

### Users
- 1 Admin user
- 1 Dispatcher user
- 2 Technician users
- 2 Client users

**Default password for all users:** `password123`

### Sample Data
- 3 Orders (various statuses)
- 2 Tasks (in progress)
- 3 Schedules
- 3 Notifications
- 3 Task comments
- 3 Order status history records
- 1 Report

## Maintenance

### Vacuum and Analyze

Regular maintenance for optimal performance:

```sql
-- Vacuum all tables
VACUUM ANALYZE;

-- Vacuum specific table
VACUUM ANALYZE users;

-- Full vacuum (requires exclusive lock)
VACUUM FULL;
```

### Index Maintenance

```sql
-- Check index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;

-- Rebuild index
REINDEX INDEX idx_users_email;

-- Rebuild all indexes on table
REINDEX TABLE users;
```

### Monitor Query Performance

```sql
-- Enable query logging
ALTER DATABASE service_manager SET log_min_duration_statement = 1000;

-- View slow queries
SELECT
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

## Backup and Restore

### Backup

```bash
# Full database backup
pg_dump -U serviceuser -d service_manager > backup.sql

# Schema only
pg_dump -U serviceuser -d service_manager --schema-only > schema.sql

# Data only
pg_dump -U serviceuser -d service_manager --data-only > data.sql

# Compressed backup
pg_dump -U serviceuser -d service_manager | gzip > backup.sql.gz
```

### Restore

```bash
# Restore from backup
psql -U serviceuser -d service_manager < backup.sql

# Restore from compressed backup
gunzip -c backup.sql.gz | psql -U serviceuser -d service_manager
```

## Troubleshooting

### Connection Issues

```bash
# Test connection
pg_isready -h localhost -p 5432 -U serviceuser

# Check PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres
```

### Migration Issues

```bash
# Check migration status
psql -U serviceuser -d service_manager -c "SELECT * FROM pgmigrations ORDER BY id;"

# Manually mark migration as run
psql -U serviceuser -d service_manager -c "INSERT INTO pgmigrations (name, run_on) VALUES ('migration-name', NOW());"

# Reset migrations (DANGER: drops all data)
psql -U serviceuser -d service_manager -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

### Performance Issues

```sql
-- Check table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index sizes
SELECT
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) AS size
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexname::regclass) DESC;

-- Find missing indexes (tables with lots of sequential scans)
SELECT
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    seq_tup_read / seq_scan AS avg_seq_read
FROM pg_stat_user_tables
WHERE seq_scan > 0
ORDER BY seq_tup_read DESC
LIMIT 10;
```

## Documentation

For complete schema documentation including ER diagrams and detailed table descriptions, see:
- [docs/SCHEMA.md](docs/SCHEMA.md)

## Contributing

When adding new migrations:

1. Create migration using `npm run migrate:create <name>`
2. Write both UP and DOWN scripts
3. Test migration in development
4. Document changes in SCHEMA.md
5. Update this README if needed

## Security

- Never commit `.env` file
- Use strong passwords in production
- Restrict database access by IP
- Enable SSL for database connections in production
- Regularly audit the audit_log table
- Implement row-level security (RLS) if needed

## License

MIT
