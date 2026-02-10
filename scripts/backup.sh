#!/bin/bash

# Database Backup Script for NestJS Auth Microservice
# This script creates automated backups of the PostgreSQL database

set -e

# Configuration
BACKUP_DIR="/backups"
DB_HOST="${DATABASE_HOST:-localhost}"
DB_PORT="${DATABASE_PORT:-5432}"
DB_USER="${DATABASE_USERNAME:-postgres}"
DB_NAME="${DATABASE_NAME:-auth_microservice_db}"
RETENTION_DAYS=7

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Generate backup filename with timestamp
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_${DB_NAME}_$DATE.sql"

echo "Starting database backup..."
echo "Database: $DB_NAME"
echo "Host: $DB_HOST"
echo "Backup file: $BACKUP_FILE"

# Perform the backup
PGPASSWORD=$DATABASE_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME > $BACKUP_FILE

# Compress the backup
gzip $BACKUP_FILE
COMPRESSED_FILE="$BACKUP_FILE.gz"

echo "Backup completed: $COMPRESSED_FILE"

# Remove backups older than retention period
echo "Cleaning up backups older than $RETENTION_DAYS days..."
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup cleanup completed."

# Optional: Upload to cloud storage (AWS S3, Google Cloud Storage, etc.)
# aws s3 cp $COMPRESSED_FILE s3://your-bucket/backups/

echo "Backup process completed successfully."
