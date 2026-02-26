-- Seed Data for Development and Testing
-- This file contains initial test data for the system
-- Password for all test users: password123 (hashed with bcrypt, rounds=10)

-- ============================================================================
-- USERS
-- ============================================================================

INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, status, email_verified) VALUES
    ('11111111-1111-1111-1111-111111111111', 'admin@example.com', '$2b$10$rKvVl4YKmZ8WqWYU9VYzZOqS6qYJ3pF8FxPqZFqZ6pF8pZ6pF8pZ6', 'Admin', 'User', '+79001234567', 'admin', 'active', true),
    ('22222222-2222-2222-2222-222222222222', 'dispatcher@example.com', '$2b$10$rKvVl4YKmZ8WqWYU9VYzZOqS6qYJ3pF8FxPqZFqZ6pF8pZ6pF8pZ6', 'Dispatcher', 'User', '+79001234568', 'dispatcher', 'active', true),
    ('33333333-3333-3333-3333-333333333333', 'tech1@example.com', '$2b$10$rKvVl4YKmZ8WqWYU9VYzZOqS6qYJ3pF8FxPqZFqZ6pF8pZ6pF8pZ6', 'Ivan', 'Petrov', '+79001234569', 'technician', 'active', true),
    ('44444444-4444-4444-4444-444444444444', 'tech2@example.com', '$2b$10$rKvVl4YKmZ8WqWYU9VYzZOqS6qYJ3pF8FxPqZFqZ6pF8pZ6pF8pZ6', 'Sergey', 'Ivanov', '+79001234570', 'technician', 'active', true),
    ('55555555-5555-5555-5555-555555555555', 'client1@example.com', '$2b$10$rKvVl4YKmZ8WqWYU9VYzZOqS6qYJ3pF8FxPqZFqZ6pF8pZ6pF8pZ6', 'Maria', 'Sidorova', '+79001234571', 'client', 'active', true),
    ('66666666-6666-6666-6666-666666666666', 'client2@example.com', '$2b$10$rKvVl4YKmZ8WqWYU9VYzZOqS6qYJ3pF8FxPqZFqZ6pF8pZ6pF8pZ6', 'Alexey', 'Volkov', '+79001234572', 'client', 'active', true);

-- ============================================================================
-- TECHNICIANS
-- ============================================================================

INSERT INTO technicians (id, user_id, specialization, experience_years, certification_number, rating, total_reviews, hourly_rate, is_available, working_radius_km, skills) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'HVAC Systems', 8, 'CERT-HVAC-2015-001', 4.75, 120, 1500.00, true, 50, ARRAY['Air Conditioning', 'Heating', 'Ventilation', 'Repair', 'Installation']),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', 'Electrical Systems', 5, 'CERT-ELEC-2018-045', 4.50, 85, 1800.00, true, 75, ARRAY['Electrical Repair', 'Wiring', 'Panel Installation', 'Troubleshooting']);

-- ============================================================================
-- CLIENTS
-- ============================================================================

INSERT INTO clients (id, user_id, company_name, tax_id, address, city, postal_code, preferred_contact_method, loyalty_points) VALUES
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '55555555-5555-5555-5555-555555555555', 'ABC Manufacturing Ltd', '7701234567', '123 Factory Street, Building 5', 'Moscow', '101000', 'email', 150),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', '66666666-6666-6666-6666-666666666666', NULL, NULL, '456 Residential Ave, Apt 12', 'St. Petersburg', '190000', 'phone', 50);

-- ============================================================================
-- ORDERS
-- ============================================================================

INSERT INTO orders (id, order_number, client_id, title, description, status, priority, service_type, estimated_cost, service_address, scheduled_at) VALUES
    ('e1111111-1111-1111-1111-111111111111', 'ORD-2024-001', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'HVAC System Maintenance', 'Annual maintenance and inspection of industrial HVAC system in production facility', 'pending', 'medium', 'HVAC Maintenance', 25000.00, '123 Factory Street, Building 5, Moscow', CURRENT_TIMESTAMP + INTERVAL '2 days'),
    ('e2222222-2222-2222-2222-222222222222', 'ORD-2024-002', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'AC Unit Repair', 'Air conditioning unit not cooling properly, suspected refrigerant leak', 'assigned', 'high', 'HVAC Repair', 8500.00, '456 Residential Ave, Apt 12, St. Petersburg', CURRENT_TIMESTAMP + INTERVAL '1 day'),
    ('e3333333-3333-3333-3333-333333333333', 'ORD-2024-003', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Electrical Panel Upgrade', 'Upgrade main electrical panel to support increased load', 'in_progress', 'high', 'Electrical Installation', 45000.00, '123 Factory Street, Building 5, Moscow', CURRENT_TIMESTAMP);

-- ============================================================================
-- TASKS
-- ============================================================================

INSERT INTO tasks (id, order_id, technician_id, assigned_by, title, description, status, priority, estimated_hours, assigned_at) VALUES
    ('f1111111-1111-1111-1111-111111111111', 'e2222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'Diagnose AC cooling issue', 'Inspect AC unit, check refrigerant levels, identify leak source', 'in_progress', 'high', 2.5, CURRENT_TIMESTAMP - INTERVAL '2 hours'),
    ('f2222222-2222-2222-2222-222222222222', 'e3333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Install new electrical panel', 'Install 200A main panel with updated breakers', 'in_progress', 'high', 6.0, CURRENT_TIMESTAMP - INTERVAL '1 day');

-- ============================================================================
-- SCHEDULES
-- ============================================================================

INSERT INTO schedules (id, technician_id, task_id, start_time, end_time, status, notes) VALUES
    ('91111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'f1111111-1111-1111-1111-111111111111', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '3 hours', 'busy', 'Client requested afternoon visit'),
    ('92222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'f2222222-2222-2222-2222-222222222222', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '8 hours', 'busy', 'Full day installation'),
    ('93333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NULL, CURRENT_TIMESTAMP + INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '1 day' + INTERVAL '8 hours', 'available', 'Available for new assignments');

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

INSERT INTO notifications (id, user_id, type, status, title, message, sent_at) VALUES
    ('a1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'in_app', 'sent', 'New Task Assigned', 'You have been assigned to task: Diagnose AC cooling issue', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
    ('a2222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', 'email', 'sent', 'Technician Assigned', 'A technician has been assigned to your order ORD-2024-002', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
    ('a3333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'in_app', 'sent', 'New Task Assigned', 'You have been assigned to task: Install new electrical panel', CURRENT_TIMESTAMP - INTERVAL '1 day');

-- ============================================================================
-- TASK COMMENTS
-- ============================================================================

INSERT INTO task_comments (id, task_id, user_id, comment, is_internal) VALUES
    ('b1111111-1111-1111-1111-111111111111', 'f1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Arrived on site. Starting diagnostic procedures.', false),
    ('b2222222-2222-2222-2222-222222222222', 'f1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Confirmed refrigerant leak in condenser coil. Need replacement part.', true),
    ('b3333333-3333-3333-3333-333333333333', 'f2222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'Old panel removed. Installing new 200A panel.', false);

-- ============================================================================
-- ORDER STATUS HISTORY
-- ============================================================================

INSERT INTO order_status_history (id, order_id, old_status, new_status, changed_by, comment) VALUES
    ('c1111111-1111-1111-1111-111111111111', 'e2222222-2222-2222-2222-222222222222', 'pending', 'assigned', '22222222-2222-2222-2222-222222222222', 'Assigned to technician Ivan Petrov'),
    ('c2222222-2222-2222-2222-222222222222', 'e3333333-3333-3333-3333-333333333333', 'pending', 'assigned', '22222222-2222-2222-2222-222222222222', 'Assigned to technician Sergey Ivanov'),
    ('c3333333-3333-3333-3333-333333333333', 'e3333333-3333-3333-3333-333333333333', 'assigned', 'in_progress', '44444444-4444-4444-4444-444444444444', 'Started work on electrical panel installation');

-- ============================================================================
-- REPORTS
-- ============================================================================

-- Note: Reports are typically created after task completion
-- This is just sample data
INSERT INTO reports (id, order_id, technician_id, report_type, title, summary, labor_hours) VALUES
    ('d1111111-1111-1111-1111-111111111111', 'e3333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'installation', 'Electrical Panel Installation - In Progress', 'Installation of 200A main electrical panel ongoing. Old panel removed successfully.', 4.0);
