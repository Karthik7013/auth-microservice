# System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
│  (Web Browser, Mobile App, Desktop App, API Client)           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Load Balancer                              │
│                    (Nginx, AWS ALB)                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   NestJS Application                            │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Auth Module  │  │ Users Module │  │ Email Module │         │
│  │              │  │              │  │              │         │
│  │ - Controller │  │ - Controller │  │ - Service    │         │
│  │ - Service    │  │ - Service    │  │ - Templates  │         │
│  │ - Guards     │  │ - Repository │  │              │         │
│  │ - Strategies │  │ - Entity     │  │              │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                 │
│         └──────────────────┴──────────────────┘                 │
│                            │                                    │
│         ┌──────────────────┴──────────────────┐                │
│         ▼                                      ▼                │
│  ┌─────────────┐                       ┌─────────────┐         │
│  │  TypeORM    │                       │  Nodemailer │         │
│  └──────┬──────┘                       └──────┬──────┘         │
└─────────┼─────────────────────────────────────┼────────────────┘
          │                                      │
          ▼                                      ▼
┌─────────────────┐                    ┌─────────────────┐
│   PostgreSQL    │                    │  SMTP Server    │
│    Database     │                    │   (Gmail)       │
└─────────────────┘                    └─────────────────┘
```

## Module Architecture

### Auth Module
```
auth/
├── controllers/
│   └── auth.controller.ts          # HTTP endpoints
├── services/
│   └── auth.service.ts              # Business logic
├── strategies/
│   ├── jwt.strategy.ts              # JWT validation
│   └── refresh-token.strategy.ts   # Refresh token validation
├── guards/
│   ├── jwt-auth.guard.ts            # Route protection
│   ├── refresh-token.guard.ts      # Refresh endpoint protection
│   └── roles.guard.ts               # RBAC implementation
├── factories/
│   └── token.factory.ts             # Token creation (Factory Pattern)
├── decorators/
│   └── auth.decorator.ts            # Custom decorators
├── dto/
│   └── auth.dto.ts                  # Data transfer objects
└── auth.module.ts                   # Module definition
```

### Users Module
```
users/
├── controllers/
│   └── users.controller.ts          # User management endpoints
├── services/
│   └── users.service.ts             # User business logic
├── repositories/
│   └── users.repository.ts          # Data access (Repository Pattern)
├── entities/
│   └── user.entity.ts               # Database model
├── dto/
│   └── create-user.dto.ts           # DTOs
└── users.module.ts                  # Module definition
```

### Email Module
```
email/
├── email.service.ts                 # Email sending logic
├── templates/                       # HTML email templates
└── email.module.ts                  # Module definition
```

## Design Patterns Used

### 1. Repository Pattern
**Location:** `users/repositories/users.repository.ts`

**Purpose:** Abstracts data access logic

```typescript
@Injectable()
export class UsersRepository {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}
  
  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }
  // ... more methods
}
```

### 2. Factory Pattern
**Location:** `auth/factories/token.factory.ts`

**Purpose:** Creates different types of tokens

```typescript
@Injectable()
export class TokenFactory {
  createAccessToken(payload: TokenPayload): string { }
  createRefreshToken(payload: TokenPayload): string { }
  createEmailVerificationToken(): string { }
  createPasswordResetToken(): string { }
}
```

### 3. Strategy Pattern
**Location:** `auth/strategies/*.strategy.ts`

**Purpose:** Different authentication strategies

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  async validate(payload: TokenPayload) { }
}

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  async validate(req: Request, payload: TokenPayload) { }
}
```

### 4. Guard Pattern
**Location:** `auth/guards/*.guard.ts`

**Purpose:** Route protection and authorization

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') { }

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean { }
}
```

### 5. Decorator Pattern
**Location:** `auth/decorators/auth.decorator.ts`

**Purpose:** Add metadata to routes

```typescript
export const Public = () => SetMetadata('isPublic', true);
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
```

### 6. Dependency Injection
**Built into NestJS**

**Purpose:** Loose coupling, testability

```typescript
@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly emailService: EmailService,
    private readonly tokenFactory: TokenFactory,
  ) {}
}
```

## Request Flow

### Registration Flow
```
1. Client sends POST /auth/register
   ↓
2. AuthController receives request
   ↓
3. ValidationPipe validates RegisterDto
   ↓
4. AuthService.register() called
   ↓
5. UsersRepository.findByEmail() checks if user exists
   ↓
6. UsersRepository.create() creates new user
   ↓
7. TokenFactory.createEmailVerificationToken()
   ↓
8. UsersRepository.setEmailVerificationToken()
   ↓
9. EmailService.sendVerificationEmail()
   ↓
10. Response returned to client
```

### Login Flow
```
1. Client sends POST /auth/login
   ↓
2. AuthController receives request
   ↓
3. ValidationPipe validates LoginDto
   ↓
4. AuthService.login() called
   ↓
5. UsersRepository.findByEmail()
   ↓
6. User.validatePassword() verifies password
   ↓
7. Check if email is verified
   ↓
8. TokenFactory.createTokens() generates JWT tokens
   ↓
9. UsersRepository.updateRefreshToken() stores hashed refresh token
   ↓
10. UsersRepository.updateLastLogin()
   ↓
11. Response with tokens returned to client
```

### Protected Route Access
```
1. Client sends request with Authorization header
   ↓
2. JwtAuthGuard intercepts request
   ↓
3. JwtStrategy.validate() verifies token
   ↓
4. UsersRepository.findById() loads user
   ↓
5. Checks: email verified, account active
   ↓
6. User object attached to request
   ↓
7. Controller method executes
   ↓
8. Response returned to client
```

### Token Refresh Flow
```
1. Client sends POST /auth/refresh with refresh token
   ↓
2. RefreshTokenGuard intercepts request
   ↓
3. RefreshTokenStrategy.validate() verifies refresh token
   ↓
4. AuthService.refreshTokens() called
   ↓
5. UsersRepository.findById()
   ↓
6. Compare refresh token with stored hash
   ↓
7. TokenFactory.createTokens() generates new tokens
   ↓
8. UsersRepository.updateRefreshToken() updates stored token
   ↓
9. New tokens returned to client
```

## Database Schema

### User Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  role VARCHAR(20) DEFAULT 'user',
  status VARCHAR(20) DEFAULT 'inactive',
  is_email_verified BOOLEAN DEFAULT false,
  email_verification_token VARCHAR(255),
  email_verification_expires TIMESTAMP,
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP,
  refresh_token TEXT,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

## Security Layers

### 1. Application Layer
- Helmet security headers
- CORS configuration
- Rate limiting (10 req/min)
- Input validation
- XSS protection

### 2. Authentication Layer
- JWT tokens (RS256 or HS256)
- Refresh token rotation
- Token expiration (15 min access, 7 days refresh)
- Password hashing (bcrypt, 10 rounds)

### 3. Authorization Layer
- Role-based access control (RBAC)
- Route guards
- Email verification requirement

### 4. Data Layer
- Parameterized queries (TypeORM)
- Data validation
- Sensitive data exclusion
- SQL injection prevention

## Scalability Considerations

### Horizontal Scaling
- Stateless authentication (JWT)
- No session storage required
- Can run multiple instances
- Load balancer distributes requests

### Caching Strategy (Future)
- Redis for token blacklisting
- Cache user roles and permissions
- Cache email verification status

### Database Optimization
- Indexed email field
- Connection pooling
- Read replicas (future)
- Query optimization

### Email Queue (Future)
- Bull queue with Redis
- Retry failed emails
- Rate limit email sending
- Batch email processing

## Monitoring & Observability

### Health Checks
```
GET /health
- Application status
- Database connection
- Email service status
```

### Metrics to Monitor
- Request rate
- Error rate
- Response time
- Authentication success/failure rate
- Token refresh rate
- Email delivery rate
- Database query performance

### Logging
- Request/Response logging
- Error logging
- Security event logging
- Audit trail

## Deployment Architecture

### Development
```
Local Machine
├── Node.js Application
├── PostgreSQL (local)
└── Gmail SMTP
```

### Production (Example)
```
Load Balancer (AWS ALB)
├── App Instance 1 (ECS/EC2)
├── App Instance 2 (ECS/EC2)
└── App Instance 3 (ECS/EC2)
    ↓
RDS PostgreSQL (Multi-AZ)
    ↓
S3 (logs, backups)
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | NestJS | Application framework |
| Language | TypeScript | Type-safe development |
| Runtime | Node.js 18+ | JavaScript runtime |
| Database | PostgreSQL 14+ | Relational database |
| ORM | TypeORM | Database abstraction |
| Authentication | JWT + Passport | Token-based auth |
| Email | Nodemailer | Email delivery |
| Validation | class-validator | DTO validation |
| Documentation | Swagger | API documentation |
| Security | Helmet, bcrypt | Security headers, hashing |
| Rate Limiting | @nestjs/throttler | DoS protection |

## Configuration Management

### Environment Variables
```
Development  → .env.development
Staging      → .env.staging
Production   → .env.production
```

### Secrets Management
- Environment variables
- AWS Secrets Manager (production)
- HashiCorp Vault (enterprise)
- Never commit secrets to git

## Error Handling Strategy

### Layers
1. **Validation Layer** - class-validator DTOs
2. **Service Layer** - Business logic exceptions
3. **Global Filter** - HttpExceptionFilter
4. **Client Response** - Formatted error responses

### Error Response Format
```json
{
  "statusCode": 400,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/auth/login",
  "method": "POST",
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

## Best Practices Implemented

✅ Clean Architecture
✅ SOLID Principles
✅ Separation of Concerns
✅ Single Responsibility
✅ Dependency Injection
✅ Interface Segregation
✅ Error Handling
✅ Input Validation
✅ Security First
✅ Scalable Design
✅ Testable Code
✅ Documentation
