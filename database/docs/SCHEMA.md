# Database Schema Documentation

## Overview

This document describes the complete database schema for the Workflow Service Management System. The database is designed with PostgreSQL and includes comprehensive features for managing users, orders, tasks, schedules, notifications, and reporting.

## Features

- ✅ Complete relational schema with proper foreign keys
- ✅ Performance-optimized indexes on all critical queries
- ✅ Check constraints for data validation
- ✅ Soft delete functionality on all major tables
- ✅ Automatic timestamp updates via triggers
- ✅ Comprehensive audit logging
- ✅ Business logic triggers
- ✅ Complex query views
- ✅ Full-text search support via JSONB
- ✅ Geospatial support for technician locations

## Entity Relationship Diagram

```
┌─────────────────┐
│     USERS       │
│─────────────────│
│ * id (PK)       │
│   email (UK)    │
│   password_hash │
│   first_name    │
│   last_name     │
│   phone         │
│   role          │
│   status        │
│   deleted_at    │
└────────┬────────┘
         │
         ├──────────────────────┐
         │                      │
         ▼                      ▼
┌──────────────────┐   ┌──────────────────┐
│   TECHNICIANS    │   │     CLIENTS      │
│──────────────────│   │──────────────────│
│ * id (PK)        │   │ * id (PK)        │
│ * user_id (FK,UK)│   │ * user_id (FK,UK)│
│   specialization │   │   company_name   │
│   experience     │   │   address        │
│   rating         │   │   city           │
│   hourly_rate    │   │   loyalty_points │
│   is_available   │   │   total_orders   │
│   deleted_at     │   │   deleted_at     │
└────────┬─────────┘   └────────┬─────────┘
         │                      │
         │              ┌───────┘
         │              ▼
         │     ┌──────────────────┐
         │     │     ORDERS       │
         │     │──────────────────│
         │     │ * id (PK)        │
         │     │   order_number(UK)│
         │     │ * client_id (FK) │
         │     │   title          │
         │     │   description    │
         │     │   status         │
         │     │   priority       │
         │     │   service_type   │
         │     │   estimated_cost │
         │     │   scheduled_at   │
         │     │   deleted_at     │
         │     └────────┬─────────┘
         │              │
         │              ├─────────────────────┐
         │              │                     │
         │              ▼                     ▼
         │     ┌──────────────────┐  ┌──────────────────┐
         │     │      TASKS       │  │ORDER_STATUS_HIST │
         │     │──────────────────│  │──────────────────│
         │     │ * id (PK)        │  │ * id (PK)        │
         │     │ * order_id (FK)  │  │ * order_id (FK)  │
         ├────→│   technician_id  │  │   old_status     │
         │     │   assigned_by    │  │   new_status     │
         │     │   title          │  │   changed_by (FK)│
         │     │   status         │  │   created_at     │
         │     │   priority       │  └──────────────────┘
         │     │   deleted_at     │
         │     └────────┬─────────┘
         │              │
         │              ├──────────────────┐
         │              │                  │
         │              ▼                  ▼
         │     ┌──────────────────┐ ┌──────────────────┐
         │     │  TASK_COMMENTS   │ │    SCHEDULES     │
         │     │──────────────────│ │──────────────────│
         │     │ * id (PK)        │ │ * id (PK)        │
         │     │ * task_id (FK)   │ │ * technician_id  │
         │     │ * user_id (FK)   │ │   task_id (FK)   │
         │     │   comment        │ │   start_time     │
         │     │   attachments    │ │   end_time       │
         │     │   is_internal    │ │   status         │
         │     │   deleted_at     │ │   deleted_at     │
         │     └──────────────────┘ └──────────────────┘
         │
         ├──────────────────────────┐
         │                          │
         ▼                          ▼
┌──────────────────┐       ┌──────────────────┐
│  NOTIFICATIONS   │       │     REPORTS      │
│──────────────────│       │──────────────────│
│ * id (PK)        │       │ * id (PK)        │
│ * user_id (FK)   │       │ * order_id (FK)  │
│   type           │       │   technician_id  │
│   status         │       │   report_type    │
│   title          │       │   title          │
│   message        │       │   summary        │
│   read_at        │       │   labor_hours    │
│   deleted_at     │       │   total_cost     │
└──────────────────┘       │   approved_by(FK)│
                           │   deleted_at     │
                           └──────────────────┘

┌──────────────────┐
│   AUDIT_LOG      │
│──────────────────│
│ * id (PK)        │
│   table_name     │
│   record_id      │
│   operation      │
│   old_data       │
│   new_data       │
│   changed_by     │
│   changed_at     │
└──────────────────┘
```

## Tables

### 1. users
Core user table for all system users (admins, dispatchers, technicians, clients).

**Columns:**
- `id` (UUID, PK) - Unique identifier
- `email` (VARCHAR, UNIQUE) - User email address
- `password_hash` (VARCHAR) - Bcrypt hashed password
- `first_name` (VARCHAR) - First name
- `last_name` (VARCHAR) - Last name
- `phone` (VARCHAR) - Phone number
- `role` (ENUM) - User role: admin, dispatcher, technician, client
- `status` (ENUM) - Account status: active, inactive, suspended, pending
- `email_verified` (BOOLEAN) - Email verification status
- `last_login_at` (TIMESTAMPTZ) - Last login timestamp
- `created_at` (TIMESTAMPTZ) - Record creation time
- `updated_at` (TIMESTAMPTZ) - Last update time
- `deleted_at` (TIMESTAMPTZ) - Soft delete timestamp

**Constraints:**
- Email format validation
- Phone format validation
- Name length minimum 2 characters

**Indexes:**
- `idx_users_email` - Email lookup (where not deleted)
- `idx_users_role` - Filter by role
- `idx_users_status` - Filter by status
- `idx_users_created_at` - Sort by creation date

### 2. technicians
Extended information for users with technician role.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → users.id, UNIQUE)
- `specialization` (VARCHAR) - Area of expertise
- `experience_years` (INTEGER) - Years of experience
- `certification_number` (VARCHAR) - Professional certification
- `rating` (DECIMAL) - Average rating (0-5)
- `total_reviews` (INTEGER) - Number of reviews
- `hourly_rate` (DECIMAL) - Hourly service rate
- `is_available` (BOOLEAN) - Current availability
- `current_location` (POINT) - GPS coordinates
- `working_radius_km` (INTEGER) - Service area radius
- `skills` (TEXT[]) - Array of skills
- `deleted_at` (TIMESTAMPTZ)

**Constraints:**
- Experience >= 0
- Rating between 0 and 5
- Hourly rate > 0
- Working radius 1-500 km

**Indexes:**
- `idx_technicians_user_id` - User lookup
- `idx_technicians_available` - Find available technicians
- `idx_technicians_rating` - Sort by rating
- `idx_technicians_location` - Geospatial queries (GIST index)

### 3. clients
Extended information for users with client role.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → users.id, UNIQUE)
- `company_name` (VARCHAR) - Company name (if business)
- `tax_id` (VARCHAR) - Tax identification number
- `address` (TEXT) - Full address
- `city` (VARCHAR) - City
- `postal_code` (VARCHAR) - Postal code
- `country` (VARCHAR) - Country (default: Russia)
- `preferred_contact_method` (VARCHAR) - email, phone, sms, app
- `loyalty_points` (INTEGER) - Accumulated loyalty points
- `total_orders` (INTEGER) - Total orders count (auto-updated)
- `deleted_at` (TIMESTAMPTZ)

**Constraints:**
- Valid contact method
- Loyalty points >= 0
- Total orders >= 0

**Indexes:**
- `idx_clients_user_id` - User lookup
- `idx_clients_company` - Company search
- `idx_clients_city` - Geographic filtering

### 4. orders
Service orders/requests created by clients.

**Columns:**
- `id` (UUID, PK)
- `order_number` (VARCHAR, UNIQUE) - Human-readable order number
- `client_id` (UUID, FK → clients.id)
- `title` (VARCHAR) - Order title
- `description` (TEXT) - Detailed description
- `status` (ENUM) - pending, assigned, in_progress, completed, cancelled, on_hold
- `priority` (ENUM) - low, medium, high, urgent
- `service_type` (VARCHAR) - Type of service
- `estimated_cost` (DECIMAL) - Estimated cost
- `actual_cost` (DECIMAL) - Actual cost
- `estimated_duration_hours` (INTEGER) - Estimated duration
- `actual_duration_hours` (INTEGER) - Actual duration
- `service_address` (TEXT) - Service location address
- `service_location` (POINT) - GPS coordinates
- `scheduled_at` (TIMESTAMPTZ) - Scheduled time
- `started_at` (TIMESTAMPTZ) - Actual start time
- `completed_at` (TIMESTAMPTZ) - Completion time
- `cancelled_at` (TIMESTAMPTZ) - Cancellation time
- `cancellation_reason` (TEXT) - Reason for cancellation
- `metadata` (JSONB) - Additional flexible data
- `deleted_at` (TIMESTAMPTZ)

**Constraints:**
- Costs >= 0
- Duration > 0
- Title length >= 5
- Description length >= 10
- Scheduled date must be after creation
- Completion after start

**Indexes:**
- `idx_orders_number` - Order number lookup
- `idx_orders_client` - Client's orders
- `idx_orders_status` - Filter by status
- `idx_orders_priority` - Filter by priority
- `idx_orders_scheduled` - Scheduled orders
- `idx_orders_location` - Geospatial queries (GIST)
- `idx_orders_metadata` - JSONB queries (GIN)

### 5. tasks
Individual tasks assigned to technicians for completing orders.

**Columns:**
- `id` (UUID, PK)
- `order_id` (UUID, FK → orders.id)
- `technician_id` (UUID, FK → technicians.id)
- `assigned_by` (UUID, FK → users.id)
- `title` (VARCHAR) - Task title
- `description` (TEXT) - Task description
- `status` (ENUM) - pending, in_progress, completed, cancelled
- `priority` (ENUM) - low, medium, high, urgent
- `estimated_hours` (DECIMAL) - Estimated hours
- `actual_hours` (DECIMAL) - Actual hours
- `assigned_at` (TIMESTAMPTZ) - Assignment time
- `started_at` (TIMESTAMPTZ) - Start time
- `completed_at` (TIMESTAMPTZ) - Completion time
- `due_date` (TIMESTAMPTZ) - Due date
- `checklist` (JSONB) - Task checklist
- `completion_notes` (TEXT) - Notes upon completion
- `deleted_at` (TIMESTAMPTZ)

**Constraints:**
- Hours > 0
- Title length >= 3
- Completion after start
- Due date after creation

**Indexes:**
- `idx_tasks_order` - Order's tasks
- `idx_tasks_technician` - Technician's tasks
- `idx_tasks_status` - Filter by status
- `idx_tasks_priority` - Filter by priority
- `idx_tasks_due_date` - Upcoming tasks
- `idx_tasks_checklist` - JSONB queries (GIN)

### 6. schedules
Technician availability and task scheduling.

**Columns:**
- `id` (UUID, PK)
- `technician_id` (UUID, FK → technicians.id)
- `task_id` (UUID, FK → tasks.id, nullable)
- `start_time` (TIMESTAMPTZ) - Schedule start
- `end_time` (TIMESTAMPTZ) - Schedule end
- `status` (ENUM) - available, busy, off, vacation
- `notes` (TEXT) - Additional notes
- `deleted_at` (TIMESTAMPTZ)

**Constraints:**
- End time after start time
- Maximum 24-hour time range

**Indexes:**
- `idx_schedules_technician` - Technician's schedule
- `idx_schedules_task` - Task schedules
- `idx_schedules_time_range` - Time-based queries
- `idx_schedules_status` - Filter by status

### 7. notifications
System notifications for users.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → users.id)
- `type` (ENUM) - email, push, sms, in_app
- `status` (ENUM) - pending, sent, failed, read
- `title` (VARCHAR) - Notification title
- `message` (TEXT) - Notification message
- `link` (VARCHAR) - Link to related resource
- `metadata` (JSONB) - Additional data
- `sent_at` (TIMESTAMPTZ) - Send time
- `read_at` (TIMESTAMPTZ) - Read time
- `created_at` (TIMESTAMPTZ)
- `deleted_at` (TIMESTAMPTZ)

**Indexes:**
- `idx_notifications_user` - User's notifications
- `idx_notifications_status` - Filter by status
- `idx_notifications_type` - Filter by type
- `idx_notifications_unread` - Unread notifications
- `idx_notifications_metadata` - JSONB queries (GIN)

### 8. task_comments
Comments and communication related to tasks.

**Columns:**
- `id` (UUID, PK)
- `task_id` (UUID, FK → tasks.id)
- `user_id` (UUID, FK → users.id)
- `comment` (TEXT) - Comment text
- `attachments` (JSONB) - File attachments
- `is_internal` (BOOLEAN) - Internal note flag
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)
- `deleted_at` (TIMESTAMPTZ)

**Indexes:**
- `idx_task_comments_task` - Task's comments
- `idx_task_comments_user` - User's comments
- `idx_task_comments_internal` - Internal notes

### 9. order_status_history
Audit trail of order status changes.

**Columns:**
- `id` (UUID, PK)
- `order_id` (UUID, FK → orders.id)
- `old_status` (ENUM) - Previous status
- `new_status` (ENUM) - New status
- `changed_by` (UUID, FK → users.id)
- `comment` (TEXT) - Change reason
- `metadata` (JSONB) - Additional data
- `created_at` (TIMESTAMPTZ)

**Constraints:**
- Old and new status must be different

**Indexes:**
- `idx_order_history_order` - Order's history
- `idx_order_history_created` - Time-based queries
- `idx_order_history_changed_by` - Who made changes
- `idx_order_history_metadata` - JSONB queries (GIN)

### 10. reports
Service completion reports generated by technicians.

**Columns:**
- `id` (UUID, PK)
- `order_id` (UUID, FK → orders.id)
- `technician_id` (UUID, FK → technicians.id)
- `report_type` (VARCHAR) - Type of report
- `title` (VARCHAR) - Report title
- `summary` (TEXT) - Executive summary
- `findings` (TEXT) - Detailed findings
- `recommendations` (TEXT) - Recommendations
- `parts_used` (JSONB) - Parts/materials used
- `labor_hours` (DECIMAL) - Labor hours
- `total_cost` (DECIMAL) - Total cost
- `client_signature` (TEXT) - Client signature
- `technician_signature` (TEXT) - Technician signature
- `photos` (JSONB) - Photo attachments
- `attachments` (JSONB) - Document attachments
- `submitted_at` (TIMESTAMPTZ) - Submission time
- `approved_at` (TIMESTAMPTZ) - Approval time
- `approved_by` (UUID, FK → users.id)
- `deleted_at` (TIMESTAMPTZ)

**Constraints:**
- Labor hours > 0
- Total cost >= 0
- Title length >= 5

**Indexes:**
- `idx_reports_order` - Order's reports
- `idx_reports_technician` - Technician's reports
- `idx_reports_type` - Filter by type
- `idx_reports_parts_used` - JSONB queries (GIN)

### 11. audit_log
Comprehensive audit log for all table changes.

**Columns:**
- `id` (BIGSERIAL, PK)
- `table_name` (VARCHAR) - Affected table
- `record_id` (UUID) - Record ID
- `operation` (VARCHAR) - INSERT, UPDATE, DELETE
- `old_data` (JSONB) - Previous data
- `new_data` (JSONB) - New data
- `changed_by` (UUID) - User who made change
- `changed_at` (TIMESTAMPTZ) - Change timestamp
- `ip_address` (INET) - IP address
- `user_agent` (TEXT) - User agent

**Indexes:**
- `idx_audit_log_table_record` - Find record's history
- `idx_audit_log_changed_at` - Time-based queries
- `idx_audit_log_changed_by` - User's actions

## Views

### v_active_orders
Active orders with client and technician details.

**Purpose:** Provides a denormalized view of active orders with all related information for dashboards and reporting.

**Columns:**
- Order details (id, number, title, status, priority, etc.)
- Client details (name, email, phone, company)
- Task details (id, status)
- Technician details (name, phone, rating)

### v_technician_workload
Technician workload analysis.

**Purpose:** Shows current and historical workload for each technician.

**Metrics:**
- Active tasks count
- Completed tasks count
- Average task hours
- Hours last 30 days
- Upcoming appointments

### v_order_analytics
Daily order analytics.

**Purpose:** Aggregated order statistics by day.

**Metrics:**
- Total orders
- Orders by status
- Average cost
- Average duration
- Average completion time

### v_unread_notifications
Unread notification counts per user.

**Purpose:** Quick lookup for notification badges.

**Columns:**
- user_id
- unread_count
- latest_notification timestamp

## Triggers

### Timestamp Triggers
Automatically update `updated_at` column on UPDATE:
- users
- technicians
- clients
- orders
- tasks
- schedules
- task_comments
- reports

### Audit Triggers
Log all changes to audit_log table:
- users
- orders
- tasks
- reports

### Business Logic Triggers
- `log_order_status` - Automatically log order status changes to order_status_history
- `update_client_orders` - Update client's total_orders count
- `validate_technician_rating` - Ensure rating stays within 0-5 range

## Enums

- `user_role`: admin, dispatcher, technician, client
- `user_status`: active, inactive, suspended, pending
- `order_status`: pending, assigned, in_progress, completed, cancelled, on_hold
- `task_status`: pending, in_progress, completed, cancelled
- `task_priority`: low, medium, high, urgent
- `notification_type`: email, push, sms, in_app
- `notification_status`: pending, sent, failed, read
- `schedule_status`: available, busy, off, vacation

## Soft Delete

All major tables implement soft delete via `deleted_at` column:
- When `deleted_at` IS NULL → record is active
- When `deleted_at` IS NOT NULL → record is deleted

Indexes are created with `WHERE deleted_at IS NULL` for performance.

## Performance Optimization

1. **Strategic Indexes:**
   - All foreign keys are indexed
   - Frequently queried columns have indexes
   - Partial indexes on soft-deleted records
   - GIN indexes for JSONB columns
   - GIST indexes for geospatial queries

2. **Query Optimization:**
   - Views for common complex queries
   - Denormalized data where appropriate
   - Proper use of covering indexes

3. **Data Integrity:**
   - Foreign key constraints
   - Check constraints for validation
   - Unique constraints where needed
   - NOT NULL constraints

## Extensions Used

- `uuid-ossp` - UUID generation
- `pgcrypto` - Cryptographic functions

## Migration Management

Migrations are managed using node-pg-migrate:

```bash
# Run migrations
npm run migrate:up

# Rollback migrations
npm run migrate:down

# Create new migration
npm run migrate:create <migration-name>

# Redo last migration
npm run migrate:redo
```

## Best Practices

1. **Always use soft delete** for user-generated content
2. **Use transactions** for multi-table operations
3. **Validate data** at application level AND database level
4. **Index foreign keys** for join performance
5. **Use JSONB** for flexible/evolving data structures
6. **Monitor slow queries** and add indexes as needed
7. **Regularly vacuum** and analyze tables
8. **Keep audit logs** for compliance and debugging
