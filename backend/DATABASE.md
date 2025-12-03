# Database Setup Guide

## Overview

The chatbot backend uses PostgreSQL with Prisma ORM for data persistence. This guide explains how to set up the database, run migrations, and manage data.

## Prerequisites

- PostgreSQL 12+ installed and running
- Node.js 18+ 
- Prisma CLI installed globally or via npm

## Setup Instructions

### 1. Create PostgreSQL Database

\`\`\`bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE chatbot_db;

# Exit psql
\q
\`\`\`

### 2. Configure Environment Variables

Update `backend/.env` with your database connection:

\`\`\`env
DATABASE_URL="postgresql://user:password@localhost:5432/chatbot_db"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
\`\`\`

### 3. Generate Prisma Client

\`\`\`bash
cd backend
npm run prisma:generate
\`\`\`

### 4. Run Migrations

\`\`\`bash
npm run db:push
\`\`\`

Or use Prisma migrate for schema versioning:

\`\`\`bash
npm run prisma:migrate
\`\`\`

### 5. Seed Sample Data

\`\`\`bash
npm run db:seed
\`\`\`

This creates:
- Admin user: `admin@chatbot.local` / `admin123`
- Test user (pending): `user@chatbot.local` / `password123`
- Approved user: `approved@chatbot.local` / `password123`
- Sample query logs and documents

## Database Schema

### User Table
Stores user accounts and authentication data.

**Fields:**
- `id` - Unique identifier (CUID)
- `email` - User email (unique)
- `passwordHash` - Bcrypt hashed password
- `role` - "user" | "admin"
- `status` - "pending" | "approved" | "rejected"
- `name` - User's full name
- `phone` - Optional phone number
- `avatarUrl` - Optional profile picture URL
- `totalQueries` - Count of questions asked
- `totalPdfUploads` - Count of PDFs uploaded
- `lastLoginAt` - Last login timestamp
- `lastActiveAt` - Last activity timestamp
- `approvedAt` - Admin approval timestamp
- `rejectedAt` - Admin rejection timestamp
- `createdAt` - Account creation timestamp
- `updatedAt` - Last profile update timestamp

### QueryLog Table
Records every chat query for analytics and audit trails.

**Fields:**
- `id` - Unique identifier
- `userId` - Reference to User
- `question` - User's question
- `answer` - AI-generated response
- `intent` - Query type (realtime, rag, knowledge)
- `sourceType` - "RAG" | "realtime" | "pdf" | "hybrid"
- `apiUsed` - Which API was called (e.g., "open-meteo")
- `confidenceScore` - Response confidence (0-1)
- `documentsUsed` - Array of PDF document names used
- `durationMs` - Query processing time
- `createdAt` - Query timestamp

### Document Table
Tracks user-uploaded PDF files.

**Fields:**
- `id` - Unique identifier
- `userId` - Reference to User
- `documentName` - Original filename
- `size` - File size in bytes
- `pageCount` - Number of pages
- `vectorCount` - Number of embeddings created
- `uploadedAt` - Upload timestamp

### RefreshToken Table
Stores JWT refresh tokens for session management.

**Fields:**
- `id` - Unique identifier
- `userId` - Reference to User
- `token` - JWT refresh token
- `expiresAt` - Token expiration timestamp
- `createdAt` - Token creation timestamp

## Common Prisma Commands

\`\`\`bash
# View database in studio GUI
npm run prisma:studio

# Check database schema
npx prisma schema validate

# Generate migrations from schema changes
npm run prisma:migrate -- --name migration_name

# View migration history
npx prisma migrate status

# Reset database (delete all data)
npx prisma migrate reset

# Seed database again
npm run db:seed
\`\`\`

## Backup and Restore

### Backup Database

\`\`\`bash
pg_dump -U user chatbot_db > backup.sql
\`\`\`

### Restore Database

\`\`\`bash
psql -U user chatbot_db < backup.sql
\`\`\`

## Troubleshooting

### Connection Issues

\`\`\`bash
# Test connection
psql -U user -d chatbot_db -c "SELECT 1"
\`\`\`

### Clear All Data

\`\`\`bash
npx prisma migrate reset
npm run db:seed
\`\`\`

### Schema Sync Issues

\`\`\`bash
npm run prisma:generate
npm run db:push
\`\`\`

## Production Considerations

1. **Use strong passwords** for database users
2. **Enable SSL connections** to PostgreSQL
3. **Set up automated backups**
4. **Use environment-specific .env files**
5. **Rotate JWT_SECRET regularly**
6. **Monitor database performance** and indexes
7. **Set up proper logging** for audit trails
8. **Use connection pooling** in production (e.g., pgBouncer)

## Performance Tips

1. Add indexes to frequently queried fields (already in schema)
2. Archive old QueryLog entries
3. Partition QueryLog by date for large databases
4. Use database replication for high availability
5. Monitor slow queries with PostgreSQL logs
