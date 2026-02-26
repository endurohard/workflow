#!/bin/bash

# Script to create all GitHub issues for the workflow project
# Run this after: gh auth login

set -e

REPO="endurohard/workflow"

echo "Creating GitHub issues for $REPO..."
echo "========================================"

# Backend Services
echo "Creating backend service issues..."

gh issue create \
  --repo "$REPO" \
  --title "🔐 [AUTH-001] Implement JWT authentication & authorization system" \
  --label "backend,auth,high-priority" \
  --body "## Description
Implement complete JWT-based authentication and authorization system for the Auth Service.

## Tasks
- [ ] Set up bcrypt password hashing
- [ ] Implement JWT token generation and validation
- [ ] Create user registration endpoint with validation
- [ ] Create login endpoint with credentials verification
- [ ] Implement refresh token mechanism
- [ ] Create logout endpoint (token blacklist in Redis)
- [ ] Implement password reset flow
- [ ] Add forgot password functionality
- [ ] Create middleware for JWT verification
- [ ] Implement role-based access control (RBAC)
- [ ] Add rate limiting for auth endpoints
- [ ] Create unit tests (80%+ coverage)

## Technical Requirements
- Node.js + Express + TypeScript
- PostgreSQL for user storage
- Redis for token blacklist
- Joi for validation
- JWT secret from environment variables

## Acceptance Criteria
- All endpoints working and tested
- JWT tokens properly validated
- Password reset flow functional
- Tests passing with 80%+ coverage
- Security best practices followed

## Priority
High

## Estimated Time
3-4 days"

gh issue create \
  --repo "$REPO" \
  --title "👥 [USERS-001] Complete users CRUD & technician management" \
  --label "backend,users,high-priority" \
  --body "## Description
Implement complete user management system with CRUD operations and technician-specific functionality.

## Tasks
- [ ] Create users CRUD endpoints (GET, POST, PUT, DELETE)
- [ ] Implement technician profile management
- [ ] Add client management endpoints
- [ ] Create user search and filtering
- [ ] Implement user role management
- [ ] Add technician schedule availability
- [ ] Create technician statistics endpoints
- [ ] Implement profile photo upload
- [ ] Add user status management (active/inactive)
- [ ] Create Redis caching for frequently accessed profiles
- [ ] Add pagination and sorting
- [ ] Create unit and integration tests

## Technical Requirements
- Node.js + Express + TypeScript
- PostgreSQL (users, technicians, clients tables)
- Redis for caching
- File upload handling for photos

## Acceptance Criteria
- All CRUD operations working
- Technician profiles properly managed
- Caching implemented and tested
- Tests passing with 80%+ coverage
- API documented

## Priority
High

## Estimated Time
3-4 days"

gh issue create \
  --repo "$REPO" \
  --title "📋 [TASKS-001] Implement orders & tasks management system" \
  --label "backend,tasks,high-priority" \
  --body "## Description
Build comprehensive order and task management system with status tracking and technician assignment.

## Tasks
- [ ] Create order CRUD endpoints
- [ ] Implement task CRUD endpoints
- [ ] Add order status management (new, assigned, in_progress, completed, cancelled)
- [ ] Create task assignment logic
- [ ] Implement automatic technician assignment based on availability
- [ ] Add order status history tracking
- [ ] Create task comments functionality
- [ ] Implement task filtering and search
- [ ] Add real-time updates via Redis pub/sub
- [ ] Create task priority management
- [ ] Implement SLA tracking
- [ ] Add unit and integration tests

## Technical Requirements
- Node.js + Express + TypeScript
- PostgreSQL (orders, tasks, order_status_history tables)
- Redis for real-time updates and queues

## Acceptance Criteria
- Order lifecycle fully functional
- Task assignment working correctly
- Status tracking accurate
- Real-time updates working
- Tests passing with 80%+ coverage

## Priority
High

## Estimated Time
4-5 days"

gh issue create \
  --repo "$REPO" \
  --title "📅 [SCHEDULE-001] Build scheduling & calendar functionality" \
  --label "backend,schedule,high-priority" \
  --body "## Description
Implement scheduling system for technicians with calendar view and availability management.

## Tasks
- [ ] Create schedule CRUD endpoints
- [ ] Implement technician availability checking
- [ ] Add calendar view API (daily, weekly, monthly)
- [ ] Create schedule conflict detection
- [ ] Implement time slot booking
- [ ] Add recurring schedules support
- [ ] Create schedule optimization algorithm
- [ ] Implement technician working hours management
- [ ] Add holiday/vacation management
- [ ] Create Redis caching for schedules
- [ ] Add timezone support
- [ ] Create unit and integration tests

## Technical Requirements
- Node.js + Express + TypeScript
- PostgreSQL (schedules table)
- Redis for caching
- Date/time libraries (date-fns or luxon)

## Acceptance Criteria
- Scheduling system fully functional
- Conflict detection working
- Calendar API returning correct data
- Tests passing with 80%+ coverage
- Performance optimized with caching

## Priority
High

## Estimated Time
3-4 days"

gh issue create \
  --repo "$REPO" \
  --title "🔔 [NOTIFY-001] Create notification service (Email/Push/Telegram)" \
  --label "backend,notifications,high-priority" \
  --body "## Description
Build comprehensive notification system supporting Email, Push, and Telegram notifications.

## Tasks
- [ ] Set up notification service architecture
- [ ] Implement Email notifications (nodemailer)
- [ ] Create push notification system
- [ ] Integrate Telegram Bot API
- [ ] Add notification templates system
- [ ] Implement notification queue with Redis
- [ ] Create notification preferences management
- [ ] Add notification history tracking
- [ ] Implement retry logic for failed notifications
- [ ] Create notification event triggers
- [ ] Add unsubscribe functionality
- [ ] Create unit and integration tests

## Technical Requirements
- Node.js + Express + TypeScript
- PostgreSQL (notifications table)
- Redis for queue management
- Nodemailer for emails
- Telegram Bot API
- Firebase Cloud Messaging (optional for push)

## Acceptance Criteria
- All notification types working
- Queue system processing reliably
- Templates rendering correctly
- Tests passing with 80%+ coverage
- Retry logic handling failures

## Priority
High

## Estimated Time
4-5 days"

gh issue create \
  --repo "$REPO" \
  --title "📊 [REPORTS-001] Develop analytics & reporting engine" \
  --label "backend,reports,medium-priority" \
  --body "## Description
Create comprehensive reporting and analytics system with dashboards and metrics.

## Tasks
- [ ] Create dashboard data API
- [ ] Implement task completion reports
- [ ] Add technician performance metrics
- [ ] Create revenue analytics
- [ ] Implement time tracking reports
- [ ] Add SLA compliance reports
- [ ] Create customer satisfaction metrics
- [ ] Implement export functionality (CSV, PDF)
- [ ] Add custom report builder
- [ ] Create Redis caching for reports
- [ ] Implement date range filtering
- [ ] Add unit and integration tests

## Technical Requirements
- Node.js + Express + TypeScript
- PostgreSQL (complex queries and aggregations)
- Redis for caching
- Chart data generation
- Export libraries (csv-writer, pdfkit)

## Acceptance Criteria
- All reports generating correctly
- Dashboard API returning accurate data
- Export functionality working
- Tests passing with 80%+ coverage
- Performance optimized

## Priority
Medium

## Estimated Time
3-4 days"

# Telegram Bot
echo "Creating Telegram bot issues..."

gh issue create \
  --repo "$REPO" \
  --title "🤖 [BOT-001] Create Telegram bot core architecture" \
  --label "telegram,bot,high-priority" \
  --body "## Description
Build core Telegram bot infrastructure and architecture.

## Tasks
- [ ] Set up Telegram Bot API integration
- [ ] Create bot command handler system
- [ ] Implement user authentication via bot
- [ ] Add bot state management (Redis)
- [ ] Create keyboard layouts (inline and reply)
- [ ] Implement webhook receiver
- [ ] Add error handling and logging
- [ ] Create bot middleware system
- [ ] Implement session management
- [ ] Add multi-language support structure
- [ ] Create bot configuration system
- [ ] Add unit tests

## Technical Requirements
- Node.js + TypeScript
- telegraf or node-telegram-bot-api
- Redis for state management
- Webhook endpoint via Express

## Acceptance Criteria
- Bot responding to commands
- User authentication working
- State management functional
- Tests passing
- Webhook processing reliably

## Priority
High

## Estimated Time
2-3 days"

gh issue create \
  --repo "$REPO" \
  --title "👨‍🔧 [BOT-002] Implement master commands & workflows" \
  --label "telegram,bot,high-priority" \
  --body "## Description
Implement all Telegram bot commands and workflows for technicians (masters).

## Tasks
- [ ] Create /start command for masters
- [ ] Implement /mytasks - view assigned tasks
- [ ] Add /accept [task_id] - accept new task
- [ ] Create /decline [task_id] - decline task
- [ ] Implement /status [task_id] [status] - update task status
- [ ] Add /complete [task_id] - mark task as complete
- [ ] Create /upload [task_id] - upload photos
- [ ] Implement /report [task_id] - submit work report
- [ ] Add /schedule - view daily schedule
- [ ] Create /stats - view personal statistics
- [ ] Implement inline keyboard workflows
- [ ] Add confirmation dialogs

## Technical Requirements
- Integration with Tasks Service API
- Integration with Schedule Service API
- File upload handling for photos
- Inline keyboards for better UX

## Acceptance Criteria
- All commands working correctly
- Tasks properly updated via bot
- Photos uploading successfully
- Workflows intuitive and user-friendly
- Tests passing

## Priority
High

## Estimated Time
3-4 days"

gh issue create \
  --repo "$REPO" \
  --title "👨‍💼 [BOT-003] Implement admin commands & notifications" \
  --label "telegram,bot,medium-priority" \
  --body "## Description
Implement admin-specific commands and automated notifications for administrators.

## Tasks
- [ ] Create /dashboard - view system overview
- [ ] Implement /newtasks - view unassigned tasks
- [ ] Add /assign [task_id] [tech_id] - manually assign task
- [ ] Create /technicians - view all technicians and status
- [ ] Implement /alerts - view overdue/problematic tasks
- [ ] Add automated notifications for new tasks
- [ ] Create notifications for task status changes
- [ ] Implement SLA breach alerts
- [ ] Add system health notifications
- [ ] Create daily summary reports
- [ ] Implement broadcast message functionality
- [ ] Add admin access control

## Technical Requirements
- Admin role verification
- Integration with all backend services
- Push notifications
- Scheduled notification jobs

## Acceptance Criteria
- Admin commands working
- Notifications sent timely
- Access control enforced
- Reports accurate
- Tests passing

## Priority
Medium

## Estimated Time
2-3 days"

gh issue create \
  --repo "$REPO" \
  --title "📸 [BOT-004] Photo upload & report submission" \
  --label "telegram,bot,medium-priority" \
  --body "## Description
Implement photo upload functionality and structured report submission through Telegram bot.

## Tasks
- [ ] Create photo upload handler
- [ ] Implement before/after photo workflow
- [ ] Add photo compression and optimization
- [ ] Create file storage integration
- [ ] Implement photo metadata extraction
- [ ] Add photo gallery view in bot
- [ ] Create structured report form
- [ ] Implement parts/materials tracking in reports
- [ ] Add work time logging
- [ ] Create report validation
- [ ] Implement draft saving
- [ ] Add tests for file handling

## Technical Requirements
- File upload via Telegram API
- Image processing (sharp or jimp)
- File storage (local or S3)
- Form-like conversation flow

## Acceptance Criteria
- Photos uploading successfully
- Images properly compressed
- Reports submitting correctly
- Storage working reliably
- Tests passing

## Priority
Medium

## Estimated Time
2-3 days"

# Frontend
echo "Creating frontend issues..."

gh issue create \
  --repo "$REPO" \
  --title "📊 [FE-001] Admin dashboard & analytics" \
  --label "frontend,admin,high-priority" \
  --body "## Description
Build comprehensive admin dashboard with analytics and key metrics.

## Tasks
- [ ] Create dashboard layout
- [ ] Implement KPI cards (total tasks, revenue, etc.)
- [ ] Add task status chart (pie/donut)
- [ ] Create technician performance table
- [ ] Implement revenue trend chart
- [ ] Add task timeline/gantt view
- [ ] Create real-time updates (WebSocket/SSE)
- [ ] Implement date range selector
- [ ] Add export functionality
- [ ] Create responsive design
- [ ] Add loading states and error handling
- [ ] Write component tests

## Technical Requirements
- React + TypeScript
- TanStack Query for data fetching
- Recharts or Chart.js for visualizations
- Tailwind CSS or Material-UI
- React Router

## Acceptance Criteria
- Dashboard displaying all metrics
- Charts rendering correctly
- Real-time updates working
- Responsive on all devices
- Tests passing

## Priority
High

## Estimated Time
3-4 days"

gh issue create \
  --repo "$REPO" \
  --title "📋 [FE-002] Orders management interface" \
  --label "frontend,orders,high-priority" \
  --body "## Description
Build comprehensive orders management interface with filtering and actions.

## Tasks
- [ ] Create orders list view with table
- [ ] Implement order creation form
- [ ] Add order detail view/modal
- [ ] Create order editing functionality
- [ ] Implement status update workflow
- [ ] Add filtering (status, date, technician)
- [ ] Create search functionality
- [ ] Implement sorting and pagination
- [ ] Add bulk actions
- [ ] Create order assignment to technician
- [ ] Implement order comments/history
- [ ] Add tests

## Technical Requirements
- React + TypeScript
- TanStack Query
- Form handling (React Hook Form)
- Modal library
- Table component with sorting/filtering

## Acceptance Criteria
- Orders list displaying correctly
- CRUD operations working
- Filtering and search functional
- Assignment workflow smooth
- Tests passing

## Priority
High

## Estimated Time
4-5 days"

gh issue create \
  --repo "$REPO" \
  --title "👥 [FE-003] Technician management interface" \
  --label "frontend,technicians,medium-priority" \
  --body "## Description
Build technician management interface with profiles and scheduling.

## Tasks
- [ ] Create technicians list view
- [ ] Implement technician creation form
- [ ] Add technician profile view
- [ ] Create profile editing
- [ ] Implement technician availability calendar
- [ ] Add workload visualization
- [ ] Create performance metrics view
- [ ] Implement photo upload for profiles
- [ ] Add technician status management
- [ ] Create skills/specializations tags
- [ ] Implement search and filtering
- [ ] Add tests

## Technical Requirements
- React + TypeScript
- Calendar component (react-big-calendar)
- File upload component
- Form validation

## Acceptance Criteria
- Technician CRUD working
- Calendar displaying correctly
- Profile management functional
- Tests passing

## Priority
Medium

## Estimated Time
3-4 days"

gh issue create \
  --repo "$REPO" \
  --title "📅 [FE-004] Schedule & calendar views" \
  --label "frontend,schedule,medium-priority" \
  --body "## Description
Create interactive schedule and calendar views for task and technician management.

## Tasks
- [ ] Implement calendar component
- [ ] Create daily view
- [ ] Add weekly view
- [ ] Implement monthly view
- [ ] Add drag-and-drop task scheduling
- [ ] Create technician availability overlay
- [ ] Implement task conflict detection UI
- [ ] Add task quick-view on calendar
- [ ] Create schedule filters
- [ ] Implement print view
- [ ] Add calendar export (iCal)
- [ ] Write tests

## Technical Requirements
- React + TypeScript
- react-big-calendar or FullCalendar
- Drag-and-drop library (react-dnd)
- Date manipulation (date-fns)

## Acceptance Criteria
- Calendar views working
- Drag-and-drop functional
- Filters working correctly
- Export generating valid files
- Tests passing

## Priority
Medium

## Estimated Time
3-4 days"

gh issue create \
  --repo "$REPO" \
  --title "🔧 [FE-005] Master personal cabinet" \
  --label "frontend,master,medium-priority" \
  --body "## Description
Build personal cabinet for technicians (masters) to manage their tasks and profile.

## Tasks
- [ ] Create personal dashboard
- [ ] Implement my tasks view
- [ ] Add task detail view
- [ ] Create status update interface
- [ ] Implement photo upload for tasks
- [ ] Add work report form
- [ ] Create my schedule view
- [ ] Implement personal statistics
- [ ] Add profile editing
- [ ] Create notification center
- [ ] Implement task filters
- [ ] Add tests

## Technical Requirements
- React + TypeScript
- Mobile-responsive design
- File upload
- Form handling

## Acceptance Criteria
- Dashboard showing relevant info
- Task management working
- Report submission functional
- Mobile-friendly
- Tests passing

## Priority
Medium

## Estimated Time
3-4 days"

# Database & Infrastructure
echo "Creating database and infrastructure issues..."

gh issue create \
  --repo "$REPO" \
  --title "🗄️ [DB-001] Complete database schema & migrations" \
  --label "database,infrastructure,high-priority" \
  --body "## Description
Complete PostgreSQL database schema with all tables, relationships, and migrations.

## Tasks
- [ ] Create all table schemas
- [ ] Add indexes for performance
- [ ] Implement foreign key constraints
- [ ] Add check constraints
- [ ] Create database triggers
- [ ] Implement soft delete
- [ ] Add audit logging tables
- [ ] Create views for complex queries
- [ ] Set up migration system (node-pg-migrate or Knex)
- [ ] Add rollback scripts
- [ ] Document schema
- [ ] Create ER diagram

## Tables Required
- users, roles, permissions
- technicians, clients
- orders, tasks, order_status_history
- schedules, technician_availability
- notifications, notification_preferences
- reports, task_comments
- attachments/photos

## Acceptance Criteria
- All tables created
- Relationships properly defined
- Migrations working forward/backward
- Performance optimized
- Documentation complete

## Priority
High

## Estimated Time
2-3 days"

gh issue create \
  --repo "$REPO" \
  --title "🌱 [DB-002] Seed data & test fixtures" \
  --label "database,testing,medium-priority" \
  --body "## Description
Create seed data and test fixtures for development and testing.

## Tasks
- [ ] Create admin user seeds
- [ ] Add test technicians
- [ ] Create test clients
- [ ] Add sample orders
- [ ] Create sample tasks
- [ ] Add schedule data
- [ ] Create notification templates
- [ ] Add sample reports
- [ ] Create development data script
- [ ] Add test data reset script
- [ ] Create production seed script
- [ ] Document seed process

## Acceptance Criteria
- Seed scripts working
- Test data realistic
- Reset functionality working
- Documentation complete

## Priority
Medium

## Estimated Time
1-2 days"

gh issue create \
  --repo "$REPO" \
  --title "⚡ [REDIS-001] Implement caching strategy" \
  --label "redis,infrastructure,high-priority" \
  --body "## Description
Implement comprehensive Redis caching strategy for performance optimization.

## Tasks
- [ ] Set up Redis connection pooling
- [ ] Implement cache-aside pattern
- [ ] Add user profile caching
- [ ] Cache technician schedules
- [ ] Implement query result caching
- [ ] Add cache invalidation logic
- [ ] Create cache warming strategies
- [ ] Implement cache statistics
- [ ] Add TTL management
- [ ] Create cache monitoring
- [ ] Document caching patterns
- [ ] Add tests

## Acceptance Criteria
- Caching reducing DB load
- Invalidation working correctly
- TTL properly configured
- Monitoring in place
- Tests passing

## Priority
High

## Estimated Time
2-3 days"

gh issue create \
  --repo "$REPO" \
  --title "📬 [REDIS-002] Set up job queues" \
  --label "redis,infrastructure,high-priority" \
  --body "## Description
Set up Redis-based job queues for background processing.

## Tasks
- [ ] Set up Bull or BullMQ
- [ ] Create email notification queue
- [ ] Add push notification queue
- [ ] Implement Telegram notification queue
- [ ] Create report generation queue
- [ ] Add retry logic
- [ ] Implement job prioritization
- [ ] Create job monitoring dashboard
- [ ] Add job failure handling
- [ ] Implement dead letter queue
- [ ] Create queue metrics
- [ ] Add tests

## Acceptance Criteria
- Queues processing jobs
- Retry logic working
- Monitoring functional
- Error handling robust
- Tests passing

## Priority
High

## Estimated Time
2-3 days"

# Testing
echo "Creating testing issues..."

gh issue create \
  --repo "$REPO" \
  --title "🧪 [TEST-001] Backend unit tests" \
  --label "testing,backend,medium-priority" \
  --body "## Description
Create comprehensive unit tests for all backend services.

## Tasks
- [ ] Set up Jest testing framework
- [ ] Add tests for Auth Service (80%+ coverage)
- [ ] Add tests for Users Service (80%+ coverage)
- [ ] Add tests for Tasks Service (80%+ coverage)
- [ ] Add tests for Schedule Service (80%+ coverage)
- [ ] Add tests for Notifications Service (80%+ coverage)
- [ ] Add tests for Reports Service (80%+ coverage)
- [ ] Create test utilities and mocks
- [ ] Add coverage reporting
- [ ] Set up CI test running
- [ ] Document testing guidelines
- [ ] Create test data factories

## Acceptance Criteria
- 80%+ code coverage on all services
- All critical paths tested
- Tests running in CI
- Documentation complete

## Priority
Medium

## Estimated Time
4-5 days"

gh issue create \
  --repo "$REPO" \
  --title "🔗 [TEST-002] Integration tests" \
  --label "testing,integration,medium-priority" \
  --body "## Description
Create integration tests for API endpoints and service interactions.

## Tasks
- [ ] Set up Supertest for API testing
- [ ] Create test database setup/teardown
- [ ] Add Auth API integration tests
- [ ] Add Users API integration tests
- [ ] Add Tasks API integration tests
- [ ] Add Schedule API integration tests
- [ ] Add Notifications API integration tests
- [ ] Add Reports API integration tests
- [ ] Test Kong gateway integration
- [ ] Test Redis integration
- [ ] Add end-to-end workflow tests
- [ ] Document test scenarios

## Acceptance Criteria
- All API endpoints tested
- Service interactions tested
- Tests running reliably
- Documentation complete

## Priority
Medium

## Estimated Time
3-4 days"

gh issue create \
  --repo "$REPO" \
  --title "🎭 [TEST-003] E2E tests" \
  --label "testing,e2e,low-priority" \
  --body "## Description
Create end-to-end tests for critical user workflows.

## Tasks
- [ ] Set up Playwright or Cypress
- [ ] Create login/logout flow tests
- [ ] Add order creation workflow test
- [ ] Test task assignment workflow
- [ ] Add technician schedule workflow test
- [ ] Test notification flow
- [ ] Create report generation test
- [ ] Add admin dashboard test
- [ ] Implement visual regression testing
- [ ] Add mobile responsive tests
- [ ] Set up CI E2E testing
- [ ] Document test scenarios

## Acceptance Criteria
- Critical workflows tested
- Tests passing consistently
- CI integration working
- Documentation complete

## Priority
Low

## Estimated Time
3-4 days"

# CI/CD
echo "Creating CI/CD issues..."

gh issue create \
  --repo "$REPO" \
  --title "⚙️ [CI-001] GitHub Actions workflows" \
  --label "ci-cd,devops,medium-priority" \
  --body "## Description
Set up GitHub Actions for CI/CD pipeline.

## Tasks
- [ ] Create test workflow (run on PR)
- [ ] Add lint workflow
- [ ] Create build workflow
- [ ] Implement Docker image building
- [ ] Add Docker image publishing
- [ ] Create deployment workflow
- [ ] Add security scanning (Snyk/Dependabot)
- [ ] Implement code coverage reporting
- [ ] Add workflow badges to README
- [ ] Create manual deployment triggers
- [ ] Implement environment-based deployments
- [ ] Document CI/CD process

## Acceptance Criteria
- Tests running on every PR
- Docker images building
- Security scans working
- Documentation complete

## Priority
Medium

## Estimated Time
2-3 days"

gh issue create \
  --repo "$REPO" \
  --title "🚀 [DEPLOY-001] Production deployment setup" \
  --label "deployment,devops,low-priority" \
  --body "## Description
Set up production deployment infrastructure and processes.

## Tasks
- [ ] Choose hosting platform (AWS/GCP/DigitalOcean)
- [ ] Set up production database
- [ ] Configure production Redis
- [ ] Set up Kong in production
- [ ] Configure SSL/TLS certificates
- [ ] Set up domain and DNS
- [ ] Implement database backups
- [ ] Add monitoring (Prometheus/Grafana)
- [ ] Set up logging (ELK/Loki)
- [ ] Configure auto-scaling
- [ ] Add health checks
- [ ] Document deployment process

## Acceptance Criteria
- Production environment running
- SSL configured
- Backups automated
- Monitoring functional
- Documentation complete

## Priority
Low

## Estimated Time
5-7 days"

echo ""
echo "========================================"
echo "✅ All issues created successfully!"
echo ""
echo "Next steps:"
echo "1. View issues: gh issue list --repo $REPO"
echo "2. Start working: gh issue view <issue-number> --repo $REPO"
echo "========================================"
