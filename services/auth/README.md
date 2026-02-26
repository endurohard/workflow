# Auth Service

JWT-based authentication and authorization service for the Workflow Management System.

## Features

- User registration with email and password
- User login with JWT token generation
- Refresh token mechanism
- Password reset flow
- Logout with token blacklisting (Redis)
- Role-based access control (RBAC)
- Rate limiting on authentication endpoints
- Request validation using Joi
- Comprehensive test coverage (80%+)

## Tech Stack

- Node.js + Express + TypeScript
- PostgreSQL for user storage
- Redis for token blacklist
- JWT for authentication
- Bcrypt for password hashing
- Joi for validation
- Jest for testing

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Update environment variables in `.env`

4. Run database migrations:
```bash
psql -U postgres -d workflow_auth -f migrations/001_create_users_table.sql
```

5. Start the service:
```bash
npm run dev
```

## API Endpoints

### Public Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Protected Endpoints

- `POST /api/auth/logout` - Logout user (blacklist token)
- `GET /api/auth/profile` - Get current user profile

## Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test
```

## Linting

Run linter:
```bash
npm run lint
```

Fix linting issues:
```bash
npm run lint:fix
```

## User Roles

- `admin` - Full system access
- `manager` - Manage tasks and users
- `technician` - Execute tasks
- `client` - View task status

## Security Features

- Password hashing with bcrypt (10 rounds)
- JWT tokens with expiration
- Refresh token rotation
- Token blacklisting on logout
- Rate limiting on auth endpoints
- Input validation
- CORS protection
- Helmet security headers
