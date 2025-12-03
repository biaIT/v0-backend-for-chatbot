# Complete API Reference

## Base URL
\`\`\`
http://localhost:5000
\`\`\`

## Authentication
- Header: `X-Session-ID` (optional, auto-generated)
- Admin routes: Header `X-Admin-Key: admin123`

---

## Chat Endpoints

### POST /api/chat
Send a message to the chatbot with intelligent routing

**Request:**
\`\`\`json
{
  "message": "What's the weather in Paris?"
}
\`\`\`

**Response:**
\`\`\`json
{
  "reply": "The weather in Paris is sunny with 22°C...",
  "intent": "realtime",
  "type": "weather",
  "sources": [
    {
      "source": "realtime",
      "confidence": 0.95,
      "metadata": {
        "type": "weather",
        "apiUsed": "open-meteo",
        "cached": false
      }
    }
  ],
  "confidenceScore": 0.95,
  "timestamp": "2025-01-15T10:30:00Z"
}
\`\`\`

**Status Codes:**
- 200: Success
- 400: Invalid request
- 500: Server error

---

## PDF Endpoints

### POST /api/pdf/upload
Upload a PDF file for custom knowledge base

**Request:**
\`\`\`
Content-Type: multipart/form-data
Body: file (PDF file)
Header: X-Session-ID: your-session-id
\`\`\`

**Response:**
\`\`\`json
{
  "documentId": "doc_12345",
  "filename": "document.pdf",
  "pages": 45,
  "chunksCreated": 150,
  "message": "PDF processed successfully"
}
\`\`\`

**Status Codes:**
- 200: Success
- 400: Invalid file type
- 413: File too large
- 500: Processing error

---

### GET /api/pdf/list
List all PDFs for current session

**Response:**
\`\`\`json
{
  "pdfs": [
    {
      "documentId": "doc_12345",
      "filename": "AI_Guide.pdf",
      "pageCount": 45,
      "chunks": 150,
      "uploadedAt": "2025-01-15T09:00:00Z"
    }
  ],
  "count": 1
}
\`\`\`

---

### DELETE /api/pdf/:documentId
Delete a PDF document

**Response:**
\`\`\`json
{
  "message": "PDF deleted successfully",
  "documentId": "doc_12345"
}
\`\`\`

---

## Admin Endpoints

### GET /api/admin/stats
Get system analytics (requires admin key)

**Headers:**
\`\`\`
X-Admin-Key: admin123
\`\`\`

**Response:**
\`\`\`json
{
  "timestamp": "2025-01-15T10:30:00Z",
  "sessions": {
    "active": 5,
    "total": 42
  },
  "analytics": {
    "queryCounts": { "realtime": 120, "rag": 85, "general": 60 },
    "cacheHits": 200,
    "cacheMisses": 50
  }
}
\`\`\`

---

### GET /api/admin/sessions
List all sessions

**Headers:**
\`\`\`
X-Admin-Key: admin123
\`\`\`

**Response:**
\`\`\`json
{
  "total": 42,
  "sessions": [
    {
      "id": "session_1234567890",
      "createdAt": "2025-01-15T08:00:00Z",
      "lastUsed": "2025-01-15T10:30:00Z",
      "queryCount": 15,
      "pdfCount": 3,
      "isActive": true
    }
  ]
}
\`\`\`

---

### DELETE /api/admin/sessions/:sessionId
Delete a session

**Headers:**
\`\`\`
X-Admin-Key: admin123
\`\`\`

**Response:**
\`\`\`json
{
  "message": "Session deleted",
  "sessionId": "session_1234567890"
}
\`\`\`

---

### GET /api/admin/pdfs
List all PDFs across all sessions

**Headers:**
\`\`\`
X-Admin-Key: admin123
\`\`\`

**Response:**
\`\`\`json
{
  "totalPdfs": 15,
  "bySession": [
    { "sessionId": "session_123", "pdfCount": 3 }
  ],
  "pdfs": [
    {
      "documentId": "doc_12345",
      "filename": "AI_Guide.pdf",
      "sessionId": "session_123",
      "uploadedAt": "2025-01-15T09:00:00Z",
      "pageCount": 45,
      "chunks": 150
    }
  ]
}
\`\`\`

---

### DELETE /api/admin/pdfs/:documentId
Delete any PDF (admin only)

**Headers:**
\`\`\`
X-Admin-Key: admin123
\`\`\`

**Response:**
\`\`\`json
{
  "message": "PDF deleted",
  "documentId": "doc_12345"
}
\`\`\`

---

### GET /api/admin/api-usage
Get API usage statistics

**Headers:**
\`\`\`
X-Admin-Key: admin123
\`\`\`

**Response:**
\`\`\`json
{
  "timestamp": "2025-01-15T10:30:00Z",
  "realtime": {
    "weather": 45,
    "news": 30,
    "currency": 25,
    "total": 100
  },
  "cache": {
    "hits": 200,
    "misses": 50,
    "hitRate": "80.0%"
  },
  "rag": {
    "queries": 85
  },
  "rateLimiter": {
    "blockedRequests": 5
  }
}
\`\`\`

---

## Analytics Endpoints

### GET /api/analytics
Get system-wide analytics

**Response:**
\`\`\`json
{
  "timestamp": "2025-01-15T10:30:00Z",
  "queryCounts": {
    "realtime": 120,
    "rag": 85,
    "general": 60
  },
  "cacheHits": 200,
  "cacheMisses": 50,
  "totalPdfs": 15,
  "activeUsers": 5
}
\`\`\`

---

### GET /api/analytics/sessions
List active sessions with metadata

**Response:**
\`\`\`json
{
  "activeSessions": 5,
  "sessions": [
    {
      "id": "session_123",
      "createdAt": "2025-01-15T08:00:00Z",
      "lastUsed": "2025-01-15T10:30:00Z",
      "queries": 15,
      "pdfs": 3
    }
  ]
}
\`\`\`

---

## Example Endpoints

### GET /api/examples/queries
Get sample test queries

**Response:**
\`\`\`json
{
  "total": 7,
  "categories": [
    { "category": "realtime-weather", "count": 6 },
    { "category": "realtime-news", "count": 5 }
  ],
  "queries": [
    {
      "category": "realtime-weather",
      "queries": [
        "What's the weather like right now?",
        "Is it raining in New York?"
      ]
    }
  ]
}
\`\`\`

### Query by Category
\`\`\`
GET /api/examples/queries?category=realtime-weather
\`\`\`

---

### GET /api/examples/stats
Get statistics about sample data

**Response:**
\`\`\`json
{
  "totalCategories": 7,
  "totalQueries": 38,
  "categories": [
    {
      "name": "realtime-weather",
      "count": 6,
      "examples": ["What's the weather..."]
    }
  ]
}
\`\`\`

---

## Testing Endpoints

### GET /api/selftest
Run system self-test

**Response:**
\`\`\`json
{
  "timestamp": "2025-01-15T10:30:00Z",
  "passed": 4,
  "failed": 0,
  "tests": [
    {
      "name": "Session Management",
      "status": "passed"
    },
    {
      "name": "Analytics Service",
      "status": "passed"
    },
    {
      "name": "API Keys Configuration",
      "status": "passed",
      "note": "2 key(s) configured"
    },
    {
      "name": "Memory Health",
      "status": "passed",
      "note": "Heap: 150.45MB"
    }
  ],
  "summary": "4 passed, 0 failed out of 4 tests"
}
\`\`\`

---

## Health Check

### GET /health
Basic health check

**Response:**
\`\`\`json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00Z"
}
\`\`\`

---

## Error Responses

### 400 Bad Request
\`\`\`json
{
  "error": "Invalid request parameters",
  "timestamp": "2025-01-15T10:30:00Z"
}
\`\`\`

### 401 Unauthorized
\`\`\`json
{
  "error": "Unauthorized",
  "timestamp": "2025-01-15T10:30:00Z"
}
\`\`\`

### 404 Not Found
\`\`\`json
{
  "error": "Route not found",
  "timestamp": "2025-01-15T10:30:00Z"
}
\`\`\`

### 500 Internal Server Error
\`\`\`json
{
  "error": "Internal Server Error",
  "timestamp": "2025-01-15T10:30:00Z"
}
\`\`\`

---

## Rate Limiting

**Limits:**
- Chat: 30 requests/minute per session
- PDF Upload: 5 uploads/hour per session
- Admin: 100 requests/minute per key

**Headers on Rate Limited Response:**
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Timestamp when limit resets

---

## Session Management

**Create Session:**
All requests auto-create session if `X-Session-ID` missing

**Example:**
\`\`\`bash
# Request 1 - Creates session
curl http://localhost:5000/api/chat -H "Content-Type: application/json" -d '{"message":"Hi"}'

# Response includes:
# X-Session-ID: session_1234567890

# Request 2 - Use same session
curl http://localhost:5000/api/chat \
  -H "X-Session-ID: session_1234567890" \
  -H "Content-Type: application/json" \
  -d '{"message":"What is AI?"}'
\`\`\`

---

## Pagination

Some endpoints support pagination (future versions):
- `limit`: Results per page (default: 50, max: 100)
- `offset`: Starting position (default: 0)

Example:
\`\`\`
GET /api/analytics/sessions?limit=10&offset=0
