# Deployment Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed
- npm or yarn package manager
- Email service (Gmail, SendGrid, etc.)

## Local Development Setup

### 1. Clone and Install

```bash
# Install dependencies
npm install

# or
yarn install
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb auth_microservice_db

# Or using psql
psql -U postgres
CREATE DATABASE auth_microservice_db;
\q
```

### 3. Environment Configuration

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your values
nano .env
```

**Required Environment Variables:**

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=auth_microservice_db

# JWT Secrets (Generate strong random strings)
JWT_ACCESS_SECRET=your_very_secure_access_secret_min_32_chars
JWT_REFRESH_SECRET=your_very_secure_refresh_secret_min_32_chars

# Email (Example for Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM=noreply@yourapp.com

# URLs
FRONTEND_URL=http://localhost:3001
BACKEND_URL=http://localhost:3000
```

### 4. Generate JWT Secrets

```bash
# Generate secure random strings for JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 5. Gmail App Password Setup

1. Go to Google Account Settings
2. Security → 2-Step Verification (enable it)
3. App passwords → Generate new app password
4. Select "Mail" and "Other (Custom name)"
5. Copy the generated password to `SMTP_PASSWORD` in .env

### 6. Run Database Migrations

```bash
# Run migrations
npm run migration:run

# If you need to create new migrations
npm run migration:generate -- -n MigrationName
```

### 7. Start Development Server

```bash
npm run start:dev
```

Application will start on `http://localhost:3000`
API Documentation: `http://localhost:3000/api/docs`

---

## Production Deployment

### Option 1: Docker Deployment

#### 1. Create Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]
```

#### 2. Create docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: auth_microservice_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      DATABASE_USERNAME: postgres
      DATABASE_PASSWORD: ${DATABASE_PASSWORD}
      DATABASE_NAME: auth_microservice_db
      JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      SMTP_HOST: ${SMTP_HOST}
      SMTP_PORT: ${SMTP_PORT}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASSWORD: ${SMTP_PASSWORD}
      EMAIL_FROM: ${EMAIL_FROM}
      FRONTEND_URL: ${FRONTEND_URL}
      BACKEND_URL: ${BACKEND_URL}
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

volumes:
  postgres_data:
```

#### 3. Deploy with Docker

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop
docker-compose down
```

---

### Option 2: Cloud Platform Deployment

#### Heroku

```bash
# Install Heroku CLI
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_ACCESS_SECRET=your_secret
heroku config:set JWT_REFRESH_SECRET=your_secret
heroku config:set SMTP_HOST=smtp.gmail.com
heroku config:set SMTP_PORT=587
heroku config:set SMTP_USER=your_email@gmail.com
heroku config:set SMTP_PASSWORD=your_app_password
heroku config:set EMAIL_FROM=noreply@yourapp.com

# Deploy
git push heroku main

# Run migrations
heroku run npm run migration:run
```

#### AWS EC2

```bash
# SSH into EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Clone your repository
git clone your-repo-url
cd your-repo

# Install dependencies
npm ci --only=production

# Set up environment
cp .env.example .env
nano .env

# Build application
npm run build

# Install PM2 for process management
sudo npm install -g pm2

# Start application
pm2 start dist/main.js --name auth-service

# Save PM2 configuration
pm2 save
pm2 startup

# Setup Nginx reverse proxy
sudo apt-get install nginx

# Configure Nginx (create /etc/nginx/sites-available/auth-service)
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/auth-service /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL with Let's Encrypt
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

#### DigitalOcean App Platform

1. Connect your GitHub repository
2. Configure build settings:
   - Build Command: `npm run build`
   - Run Command: `node dist/main`
3. Add PostgreSQL database
4. Set environment variables in UI
5. Deploy

---

### Option 3: Kubernetes Deployment

#### 1. Create deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
    spec:
      containers:
      - name: auth-service
        image: your-registry/auth-service:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_HOST
          valueFrom:
            secretKeyRef:
              name: auth-secrets
              key: database-host
        # Add other env vars from secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: auth-service
spec:
  selector:
    app: auth-service
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

#### 2. Deploy to Kubernetes

```bash
# Create secrets
kubectl create secret generic auth-secrets \
  --from-literal=database-host=your-db-host \
  --from-literal=jwt-access-secret=your-secret

# Apply deployment
kubectl apply -f deployment.yaml

# Check status
kubectl get pods
kubectl get services
```

---

## Environment-Specific Configurations

### Development

```env
NODE_ENV=development
DATABASE_HOST=localhost
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
```

### Staging

```env
NODE_ENV=staging
DATABASE_HOST=staging-db.example.com
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
```

### Production

```env
NODE_ENV=production
DATABASE_HOST=prod-db.example.com
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
```

---

## Security Checklist for Production

- [ ] Use strong, unique JWT secrets (64+ characters)
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure CORS with specific origins
- [ ] Set secure environment variables
- [ ] Enable rate limiting
- [ ] Use environment-specific database credentials
- [ ] Enable database SSL connections
- [ ] Set up monitoring and logging
- [ ] Configure proper backup strategy
- [ ] Enable database connection pooling
- [ ] Set up firewall rules
- [ ] Disable database synchronize in production
- [ ] Use process manager (PM2, systemd)
- [ ] Set up health check endpoints
- [ ] Configure proper error logging (Sentry, etc.)

---

## Monitoring and Logging

### Setup Application Monitoring

```bash
# Install Sentry SDK
npm install @sentry/node

# Add to main.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: 'your-sentry-dsn',
  environment: process.env.NODE_ENV,
});
```

### Health Check Endpoint

Add to `app.controller.ts`:

```typescript
@Get('health')
healthCheck() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
  };
}
```

### Logging

```bash
# Install winston
npm install winston

# Configure in main.ts for structured logging
```

---

## Database Backup

### Automated Backup Script

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="auth_microservice_db"

pg_dump $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

### Restore from Backup

```bash
psql auth_microservice_db < backup_20240101_120000.sql
```

---

## Performance Optimization

1. **Database Connection Pooling**
   - Already configured in TypeORM

2. **Caching** (Redis)
   ```bash
   npm install @nestjs/cache-manager cache-manager
   ```

3. **Compression**
   ```bash
   npm install compression
   ```

4. **Database Indexing**
   - Email field is already indexed
   - Add more indexes as needed

---

## Troubleshooting

### Application won't start
- Check all environment variables are set
- Verify database connection
- Check port 3000 is not in use

### Email not sending
- Verify SMTP credentials
- Check Gmail security settings
- Enable "Less secure app access" or use App Password

### Database connection failed
- Verify PostgreSQL is running
- Check database credentials
- Ensure database exists

### 401 Unauthorized errors
- Check JWT secrets match
- Verify token hasn't expired
- Ensure email is verified

---

## Support

For issues or questions:
1. Check the documentation
2. Review error logs
3. Check GitHub issues
4. Contact support team
