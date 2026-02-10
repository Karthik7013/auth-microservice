# Quick Start Guide

Get your authentication microservice up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed (or use Docker)
- Gmail account (for email sending)

## Option 1: Quick Setup (Recommended)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Setup Script
```bash
chmod +x setup.sh
./setup.sh
```

The script will:
- ✅ Check Node.js version
- ✅ Install dependencies
- ✅ Create `.env` file
- ✅ Generate secure JWT secrets
- ✅ Help with database setup
- ✅ Provide Gmail configuration instructions

### 3. Configure Environment

Edit `.env` and update these values:

```env
# Database
DATABASE_PASSWORD=your_postgres_password

# Email (Get from Gmail App Password)
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_16_char_app_password
EMAIL_FROM=noreply@yourapp.com

# URLs
FRONTEND_URL=http://localhost:3001
BACKEND_URL=http://localhost:3000
```

### 4. Create Database

```bash
# If you didn't do it in setup script
createdb -U postgres auth_microservice_db
```

### 5. Start Application

```bash
npm run start:dev
```

🎉 **Done!** Your API is running at:
- API: http://localhost:3000
- Docs: http://localhost:3000/api/docs

---

## Option 2: Docker Setup (Easiest)

### 1. Install Docker & Docker Compose

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Start Everything

```bash
docker-compose up -d
```

This starts:
- ✅ PostgreSQL database
- ✅ NestJS application
- ✅ pgAdmin (optional: use `--profile tools`)

### 4. View Logs

```bash
docker-compose logs -f app
```

🎉 **Done!** Everything is running in Docker!

---

## Option 3: Manual Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Environment File
```bash
cp .env.example .env
```

### 3. Generate JWT Secrets
```bash
# For JWT_ACCESS_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# For JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Copy these to your .env file
```

### 4. Configure Gmail

**Enable 2-Step Verification:**
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification

**Create App Password:**
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Other (Custom name)"
3. Enter "Auth Microservice"
4. Copy the 16-character password
5. Use in `.env` as `SMTP_PASSWORD`

### 5. Setup Database
```bash
# Create database
createdb -U postgres auth_microservice_db

# Update .env with database credentials
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=auth_microservice_db
```

### 6. Start Application
```bash
npm run start:dev
```

---

## Testing the API

### 1. Open API Documentation
Navigate to: http://localhost:3000/api/docs

### 2. Test Registration

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "StrongPassword123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### 3. Check Your Email
You should receive a verification email!

### 4. Verify Email
Click the link in the email, or use:
```bash
curl http://localhost:3000/api/v1/auth/verify-email/YOUR_TOKEN
```

### 5. Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "StrongPassword123!"
  }'
```

You'll receive access and refresh tokens!

### 6. Access Protected Route

```bash
curl http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Common Issues & Solutions

### Issue: Cannot connect to database
**Solution:**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Or on Mac
brew services list

# Start PostgreSQL
sudo systemctl start postgresql  # Linux
brew services start postgresql   # Mac
```

### Issue: Email not sending
**Solutions:**
1. Check if you're using App Password (not regular password)
2. Verify 2-Step Verification is enabled
3. Check SMTP settings in `.env`
4. Try testing with a different email service

### Issue: JWT errors
**Solution:**
Make sure JWT secrets are at least 32 characters:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Issue: Port 3000 already in use
**Solution:**
```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9

# Or change port in .env
PORT=3001
```

---

## Next Steps

1. **Read the Documentation**
   - [README.md](README.md) - Project overview
   - [API_USAGE.md](API_USAGE.md) - Complete API documentation
   - [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
   - [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guides

2. **Customize Your Application**
   - Add your company logo to email templates
   - Customize email templates in `src/email/`
   - Add additional user fields
   - Implement more authentication strategies

3. **Production Deployment**
   - Follow [DEPLOYMENT.md](DEPLOYMENT.md)
   - Set up CI/CD pipeline
   - Configure monitoring
   - Enable HTTPS

4. **Add Features**
   - Social authentication (Google, GitHub)
   - Two-factor authentication
   - Password strength meter
   - Account activity log

---

## Development Commands

```bash
# Development
npm run start:dev          # Start with hot reload
npm run start:debug        # Start with debugging

# Production
npm run build              # Build for production
npm run start:prod         # Start production server

# Testing
npm run test               # Run unit tests
npm run test:watch         # Run tests in watch mode
npm run test:cov           # Generate coverage report
npm run test:e2e           # Run end-to-end tests

# Database
npm run migration:generate -- -n MigrationName  # Generate migration
npm run migration:run      # Run migrations
npm run migration:revert   # Revert last migration

# Code Quality
npm run lint               # Run ESLint
npm run format             # Format code with Prettier
```

---

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Application port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_HOST` | Database host | `localhost` |
| `DATABASE_PORT` | Database port | `5432` |
| `DATABASE_USERNAME` | Database user | `postgres` |
| `DATABASE_PASSWORD` | Database password | `your_password` |
| `DATABASE_NAME` | Database name | `auth_microservice_db` |
| `JWT_ACCESS_SECRET` | Access token secret | `64+ char random string` |
| `JWT_REFRESH_SECRET` | Refresh token secret | `64+ char random string` |
| `JWT_ACCESS_EXPIRATION` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRATION` | Refresh token TTL | `7d` |
| `SMTP_HOST` | SMTP server | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_SECURE` | Use SSL/TLS | `false` |
| `SMTP_USER` | Email address | `your@gmail.com` |
| `SMTP_PASSWORD` | App password | `16-char password` |
| `EMAIL_FROM` | From address | `noreply@app.com` |
| `FRONTEND_URL` | Frontend URL | `http://localhost:3001` |
| `BACKEND_URL` | Backend URL | `http://localhost:3000` |

---

## Support

- 📚 Documentation: Check all `.md` files in the project
- 🐛 Issues: Create an issue on GitHub
- 💬 Questions: Reach out to the team

**Happy Coding! 🚀**
