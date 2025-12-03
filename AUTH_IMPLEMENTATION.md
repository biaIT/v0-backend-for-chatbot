# Authentication System Implementation Guide

## Overview

The chatbot now includes a complete authentication system with user registration, approval workflow, and query logging. This guide explains the complete flow and integration points.

## Key Features

1. **User Registration** - New users register with email, password, and name
2. **Account Approval** - Admins must approve accounts before users can chat
3. **JWT Authentication** - Secure token-based authentication
4. **Query Logging** - All chat queries are logged to database
5. **User Statistics** - Track queries and PDF uploads per user
6. **Profile Management** - Users can update their profile information

## Authentication Flow

### Registration Flow

\`\`\`
User → POST /api/auth/register
       (email, password, name)
       ↓
Backend: Hash password with bcrypt
         Create User with status: "pending"
       ↓
Response: User created, waiting for approval
       ↓
Frontend: Show "Pending Approval" message
\`\`\`

### Login Flow

\`\`\`
User → POST /api/auth/login
       (email, password)
       ↓
Backend: Find user
         Check status = "approved"
         Verify password with bcrypt
         Update lastLoginAt + lastActiveAt
         Generate JWT tokens
         Store refresh token in DB
       ↓
Response: accessToken, refreshToken (HTTP-only cookies)
       ↓
Frontend: Store accessToken in localStorage
          Redirect to /chat
\`\`\`

### Protected Request Flow

\`\`\`
Frontend → GET /api/auth/me
          Header: Authorization: Bearer <accessToken>
         ↓
Backend Middleware:
  - Extract token from Authorization header
  - Verify JWT signature
  - Check token expiration
  - Attach user info to request
         ↓
Route Handler: Access req.user and req.userId
             Return user profile
\`\`\`

### Token Refresh Flow

\`\`\`
Frontend: Token expires (401 response)
        ↓
        POST /api/auth/refresh
        Body/Cookie: refreshToken
        ↓
Backend: Verify refreshToken in DB
         Generate new accessToken
         Return new token
        ↓
Frontend: Update Authorization header
         Retry original request
\`\`\`

## API Endpoints

### Authentication Routes

#### POST /api/auth/register
Register new user (status will be "pending")

**Request:**
\`\`\`json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
\`\`\`

**Response (201):**
\`\`\`json
{
  "success": true,
  "message": "User registered successfully. Waiting for admin approval.",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
\`\`\`

#### POST /api/auth/login
Login user and receive tokens

**Request:**
\`\`\`json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "status": "approved"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
\`\`\`

**Cookies Set:**
- `accessToken` (HTTP-only, 15 min expiry)
- `refreshToken` (HTTP-only, 7 days expiry)

#### GET /api/auth/me
Get current user profile (requires auth)

**Headers:**
\`\`\`
Authorization: Bearer <accessToken>
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "role": "user",
    "status": "approved",
    "totalQueries": 15,
    "totalPdfUploads": 3,
    "lastLoginAt": "2024-01-15T10:30:00Z",
    "createdAt": "2024-01-14T08:00:00Z"
  }
}
\`\`\`

#### PUT /api/auth/profile
Update user profile (requires auth)

**Request:**
\`\`\`json
{
  "name": "John Smith",
  "phone": "+1 (555) 987-6543",
  "avatarUrl": "https://..."
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": { ... }
}
\`\`\`

#### POST /api/auth/refresh
Refresh access token

**Request:**
\`\`\`json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
\`\`\`

#### POST /api/auth/logout
Logout user

**Headers:**
\`\`\`
Authorization: Bearer <accessToken>
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "message": "Logged out successfully"
}
\`\`\`

### User Management Routes (Admin)

#### GET /api/admin/users
List all users (admin only)

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `status` - Filter by status (pending, approved, rejected)

**Response:**
\`\`\`json
{
  "success": true,
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  },
  "users": [ ... ]
}
\`\`\`

#### POST /api/admin/users/:id/approve
Approve pending user (admin only)

**Response:**
\`\`\`json
{
  "success": true,
  "message": "User user@example.com approved",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "status": "approved",
    "approvedAt": "2024-01-15T10:30:00Z"
  }
}
\`\`\`

#### POST /api/admin/users/:id/reject
Reject pending user (admin only)

**Response:**
\`\`\`json
{
  "success": true,
  "message": "User user@example.com rejected",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "status": "rejected",
    "rejectedAt": "2024-01-15T10:30:00Z"
  }
}
\`\`\`

#### POST /api/admin/users/:id/promote
Promote user to admin (admin only)

**Response:**
\`\`\`json
{
  "success": true,
  "message": "User user@example.com promoted to admin",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "admin"
  }
}
\`\`\`

#### GET /api/admin/users/:id/logs
Get query logs for user (admin only)

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Response:**
\`\`\`json
{
  "success": true,
  "pagination": { ... },
  "logs": [
    {
      "id": "uuid",
      "question": "What is the weather?",
      "answer": "The weather is...",
      "intent": "realtime",
      "sourceType": "realtime",
      "confidenceScore": 0.95,
      "durationMs": 342,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
\`\`\`

## Frontend Integration

### Using Axios or Fetch

\`\`\`typescript
// Login
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // Include cookies
  body: JSON.stringify({ email, password })
})

const { accessToken, user } = await response.json()
localStorage.setItem('accessToken', accessToken)

// Make authenticated request
const meResponse = await fetch('http://localhost:5000/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
})

// Chat with authentication
const chatResponse = await fetch('http://localhost:5000/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  },
  body: JSON.stringify({ message: 'Hello' })
})
\`\`\`

### Protected Routes

All chat-related endpoints now require authentication:

\`\`\`typescript
// Protected endpoints
- POST /api/chat (requires auth + approval)
- POST /api/pdf/upload (requires auth + approval)
- GET /api/pdf/list (requires auth + approval)
- DELETE /api/pdf/:documentId (requires auth + approval)
- GET /api/auth/me (requires auth + approval)
- PUT /api/auth/profile (requires auth + approval)
\`\`\`

### Admin Endpoints

All admin endpoints require admin role:

\`\`\`typescript
// Admin endpoints
- GET /api/admin/users (requires admin)
- POST /api/admin/users/:id/approve (requires admin)
- POST /api/admin/users/:id/reject (requires admin)
- POST /api/admin/users/:id/promote (requires admin)
- GET /api/admin/users/:id/logs (requires admin)
\`\`\`

## Security Best Practices

1. **Passwords** - Hashed with bcrypt, minimum 6 characters
2. **Tokens** - Short-lived access tokens (15 min), refresh tokens stored in DB
3. **Cookies** - HTTP-only, Secure, SameSite=strict
4. **HTTPS** - Use in production
5. **CORS** - Restricted to frontend origin
6. **Rate Limiting** - Applied to auth endpoints
7. **Input Validation** - All inputs validated before processing
8. **SQL Injection** - Prevented by Prisma ORM

## Error Handling

Common error responses:

\`\`\`json
// Invalid credentials
{
  "error": "Invalid credentials"
}

// Account not approved
{
  "error": "Account is pending"
}

// Token expired
{
  "error": "Invalid or expired token"
}

// Unauthorized
{
  "error": "Authentication required"
}

// Forbidden (admin only)
{
  "error": "Admin access required"
}
\`\`\`

## Testing

### Test Registration

\`\`\`bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123",
    "name": "Test User"
  }'
\`\`\`

### Test Login

\`\`\`bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "admin@chatbot.local",
    "password": "admin123"
  }'
\`\`\`

### Test Protected Endpoint

\`\`\`bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <accessToken>"
\`\`\`

### Test Admin Approval

\`\`\`bash
curl -X POST http://localhost:5000/api/admin/users/<userId>/approve \
  -H "Authorization: Bearer <adminToken>"
