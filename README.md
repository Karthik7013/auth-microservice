# NestJS Authentication Microservice

A production-ready authentication microservice built with NestJS, PostgreSQL, JWT tokens, and email verification.

## Features

- ✅ User Registration with Email Verification
- ✅ Login with Access & Refresh Tokens
- ✅ Token Refresh Mechanism
- ✅ Password Reset via Email
- ✅ Email Verification
- ✅ Role-Based Access Control (RBAC)
- ✅ OOP Design Patterns (Factory, Strategy, Repository)
- ✅ PostgreSQL with TypeORM
- ✅ Nodemailer Integration
- ✅ Rate Limiting
- ✅ Request Validation
- ✅ Security Best Practices
- ✅ Comprehensive Error Handling
- ✅ API Documentation with Swagger

## Architecture

```
src/
├── auth/                    # Authentication module
│   ├── controllers/         # Request handlers
│   ├── services/            # Business logic
│   ├── strategies/          # Passport strategies
│   ├── guards/              # Authorization guards
│   ├── dto/                 # Data transfer objects
│   └── entities/            # Database entities
├── users/                   # Users module
├── email/                   # Email module
├── config/                  # Configuration
├── common/                  # Shared utilities
│   ├── decorators/
│   ├── filters/
│   ├── interceptors/
│   └── pipes/
└── main.ts
```

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT (Access + Refresh Tokens)
- **Email**: Nodemailer
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI

## Installation

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npm run migration:run

# Start development server
npm run start:dev
```

## Environment Variables

```env
# Application
PORT=3000
NODE_ENV=development

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=auth_db

# JWT
JWT_ACCESS_SECRET=your_access_secret_key_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_key_min_32_chars
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM=noreply@yourapp.com

# Application
FRONTEND_URL=http://localhost:3001
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user
- `GET /auth/verify-email/:token` - Verify email
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password

### Users
- `GET /users/me` - Get current user profile
- `PUT /users/me` - Update current user profile
- `DELETE /users/me` - Delete current user account

## Design Patterns Used

1. **Repository Pattern**: Data access abstraction
2. **Factory Pattern**: Token creation, email template generation
3. **Strategy Pattern**: Different authentication strategies
4. **Dependency Injection**: NestJS built-in DI container
5. **Decorator Pattern**: Custom decorators for metadata
6. **Guard Pattern**: Route protection and authorization

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Refresh token rotation
- Email verification required
- Rate limiting on sensitive endpoints
- CORS configuration
- Helmet security headers
- Input validation and sanitization

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong JWT secrets
3. Configure SSL/TLS for database
4. Enable HTTPS
5. Set up proper CORS origins
6. Configure rate limiting
7. Use environment-specific configs
8. Set up logging and monitoring

## Soft Delete Implementation

### User Account Deletion
- **Soft Delete**: When users delete their accounts via `DELETE /users/me`, the account is soft-deleted
- **Data Preservation**: User data remains in the database for audit and recovery purposes
- **Automatic Exclusion**: Soft-deleted users are automatically excluded from all queries
- **Recovery Option**: Accounts can be recovered by setting `deleted` flag to `false`
- **Hard Delete**: Permanent deletion is available via `hardDelete()` method for admin use

### Database Schema Changes
- `deleted_at`: Timestamp when account was deleted
- `deleted`: Boolean flag indicating soft-deleted status
- `deleted_by`: Tracks who performed the deletion (system/user ID)

### API Response
```json
{
  "message": "Account deleted successfully",
  "deleted": true
}
```

### Best Practices
- Use soft delete for user account removal to maintain data integrity
- Implement proper audit logging for deletion operations
- Consider data retention policies for soft-deleted accounts
- Use hard delete only for compliance or data cleanup requirements
