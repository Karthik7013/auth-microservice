#!/bin/bash

# Authentication Microservice Setup Script
# This script automates the initial setup process

set -e

echo "================================"
echo "Auth Microservice Setup"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi
print_status "Node.js $(node -v) detected"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    print_warning "PostgreSQL command-line tools not found. Make sure PostgreSQL is installed."
else
    print_status "PostgreSQL detected"
fi

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install
print_status "Dependencies installed"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "Creating environment file..."
    cp .env.example .env
    
    # Generate JWT secrets
    echo ""
    echo "Generating secure JWT secrets..."
    ACCESS_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    
    # Update .env file with generated secrets
    sed -i.bak "s/JWT_ACCESS_SECRET=.*/JWT_ACCESS_SECRET=$ACCESS_SECRET/" .env
    sed -i.bak "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=$REFRESH_SECRET/" .env
    rm .env.bak
    
    print_status "Environment file created with secure JWT secrets"
    
    echo ""
    print_warning "IMPORTANT: Please update the following in your .env file:"
    echo "  - DATABASE_* settings (host, port, username, password, name)"
    echo "  - SMTP_* settings (host, port, user, password)"
    echo "  - EMAIL_FROM"
    echo "  - FRONTEND_URL and BACKEND_URL"
else
    print_status "Environment file already exists"
fi

# Prompt for database setup
echo ""
read -p "Do you want to create the PostgreSQL database now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    read -p "Enter PostgreSQL username (default: postgres): " DB_USER
    DB_USER=${DB_USER:-postgres}
    
    read -p "Enter database name (default: auth_microservice_db): " DB_NAME
    DB_NAME=${DB_NAME:-auth_microservice_db}
    
    echo "Creating database..."
    if psql -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
        print_warning "Database '$DB_NAME' already exists"
    else
        createdb -U $DB_USER $DB_NAME && print_status "Database '$DB_NAME' created successfully" || print_error "Failed to create database"
    fi
fi

# Prompt for email configuration help
echo ""
read -p "Do you need help setting up Gmail for email sending? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Gmail Setup Instructions:"
    echo "1. Go to your Google Account: https://myaccount.google.com/"
    echo "2. Navigate to Security → 2-Step Verification (enable if not already)"
    echo "3. Navigate to Security → App passwords"
    echo "4. Select 'Mail' and 'Other (Custom name)'"
    echo "5. Enter a name like 'Auth Microservice'"
    echo "6. Copy the generated 16-character password"
    echo "7. Use this password in your .env file for SMTP_PASSWORD"
    echo ""
    echo "Your SMTP settings should be:"
    echo "  SMTP_HOST=smtp.gmail.com"
    echo "  SMTP_PORT=587"
    echo "  SMTP_SECURE=false"
    echo "  SMTP_USER=your_email@gmail.com"
    echo "  SMTP_PASSWORD=your_app_password"
fi

# Summary
echo ""
echo "================================"
echo "Setup Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Update your .env file with correct values"
echo "2. Run database migrations: npm run migration:run"
echo "3. Start development server: npm run start:dev"
echo ""
echo "The API will be available at: http://localhost:3000"
echo "API Documentation: http://localhost:3000/api/docs"
echo ""
print_status "Happy coding!"
