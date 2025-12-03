# Complete API Documentation

Comprehensive reference for all backend endpoints.

## Base URL

\`\`\`
http://localhost:5000
\`\`\`

## Authentication

Session-based using header:
\`\`\`
X-Session-ID: your_session_id
\`\`\`

Auto-created if not provided.

## Response Format

All endpoints return JSON:
\`\`\`json
{
  "success": true/false,
  "data": {...},
  "error": "error message if applicable",
  "timestamp": "2024-01-15T10:30:00Z"
}
\`\`\`

## Endpoints

### Health & Status

#### GET /health

Server health check.

**Response:**
\`\`\`json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z"
}
\`\`\`

**Status Codes:** 200

---

### Chat API

#### POST /api/chat

Main chat endpoint with intent detection and multi-source routing.

**Headers:**
\`\`\`
Content-Type: application/json
X-Session-ID: optional_session_id
\`\`\`

**Request:**
\`\`\`json
{
  "message": "What's the weather in Paris?"
}
\`\`\`

**Response:**
\`\`\`json
{
  "reply": "The weather in Paris is currently sunny with 18°C temperature...",
  "intent": "realtime",
  "sources": [
    {
      "source": "realtime",
      "confidence": 0.95,
      "metadata": {
        "type": "weather",
        "apiUsed": "Open-Meteo API",
        "cached": false
      }
    },
    {
      "source": "rag",
      "confidence": 0.75,
      "metadata": {
        "documentsFound": 2
      }
    }
  ],
  "confidenceScore": 0.95,
  "sessionId": "session_12345",
  "responseTime": 342,
  "timestamp": "2024-01-15T10:30:00Z"
}
\`\`\`

**Query Types:**
- Realtime: "weather", "news", "exchange", "time"
- RAG: "explain", "what is", "tell me", "describe"
- General: "hi", "help", conversational

**Status Codes:**
- 200: Success
- 400: Invalid message
- 429: Rate limited
- 500: Server error

**Rate Limit:** 30 requests/minute per session

---

### PDF Management

#### POST /api/pdf/upload

Upload and process a PDF document.

**Headers:**
\`\`\`
Content-Type: multipart/form-data
X-Session-ID: session_id
\`\`\`

**Form Data:**
\`\`\`
file: <pdf_file>
\`\`\`

**Example:**
\`\`\`bash
curl -X POST http://localhost:5000/api/pdf/upload \
  -H "X-Session-ID: session_123" \
  -F "file=@document.pdf"
\`\`\`

**Response (Immediate):**
\`\`\`json
{
  "success": true,
  "message": "PDF processed immediately",
  "documentId": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "research.pdf",
  "chunksCreated": 45
}
\`\`\`

**Response (Queued):**
\`\`\`json
{
  "success": true,
  "message": "PDF queued for processing",
  "jobId": "job_12345",
  "filename": "research.pdf"
}
\`\`\`

**Limits:**
- Max size: 10MB
- File type: PDF only
- Max uploads: 5 per hour per user

**Status Codes:**
- 200: Success
- 400: Invalid file
- 413: File too large
- 429: Upload limit exceeded
- 500: Processing error

**Rate Limit:** 5 uploads/hour per user

---

#### GET /api/pdf/list

List all PDFs uploaded by current user/session.

**Headers:**
\`\`\`
X-Session-ID: session_id
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "count": 2,
  "pdfs": [
    {
      "documentId": "550e8400-e29b-41d4-a716-446655440000",
      "filename": "research.pdf",
      "pageCount": 25,
      "chunks": 120,
      "uploadedAt": "2024-01-15T09:00:00Z"
    },
    {
      "documentId": "660e8400-e29b-41d4-a716-446655440001",
      "filename": "report.pdf",
      "pageCount": 18,
      "chunks": 85,
      "uploadedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
\`\`\`

**Status Codes:** 200, 500

---

#### GET /api/pdf/:documentId

Get information about a specific PDF.

**Parameters:**
- `documentId`: Document UUID

**Response:**
\`\`\`json
{
  "success": true,
  "document": {
    "documentId": "550e8400-e29b-41d4-a716-446655440000",
    "filename": "research.pdf",
    "uploadedAt": "2024-01-15T09:00:00Z",
    "pageCount": 25,
    "chunks": 120
  }
}
\`\`\`

**Status Codes:** 200, 404, 500

---

#### DELETE /api/pdf/:documentId

Delete a PDF document.

**Parameters:**
- `documentId`: Document UUID

**Response:**
\`\`\`json
{
  "success": true,
  "message": "PDF deleted successfully",
  "documentId": "550e8400-e29b-41d4-a716-446655440000"
}
\`\`\`

**Status Codes:** 200, 404, 500

---

### Analytics & Monitoring

#### GET /api/analytics

Get comprehensive analytics and metrics.

**Response:**
\`\`\`json
{
  "success": true,
  "analytics": {
    "totalQueries": 250,
    "queriesBySource": {
      "realtime": 85,
      "rag": 120,
      "llm": 45
    },
    "cacheStats": {
      "hits": 180,
      "misses": 70,
      "hitRate": "72%"
    },
    "pdfStats": {
      "uploaded": 8,
      "processed": 8
    },
    "performance": {
      "averageResponseTimeMs": 428,
      "errorCount": 5
    },
    "uptime": "245 minutes"
  },
  "activeSessions": 12,
  "timestamp": "2024-01-15T10:30:00Z"
}
\`\`\`

**Metrics:**
- `totalQueries`: Total chat requests
- `queriesBySource`: Breakdown by source type
- `cacheStats`: Cache hit rate
- `pdfStats`: PDF processing metrics
- `performance`: Response times and errors
- `uptime`: Server uptime

**Status Codes:** 200, 500

---

#### GET /api/analytics/sessions

Get list of active sessions.

**Response:**
\`\`\`json
{
  "success": true,
  "sessions": [
    {
      "sessionId": "session_12345",
      "userId": "user_001",
      "createdAt": "2024-01-15T08:00:00Z",
      "lastActivity": "2024-01-15T10:30:00Z",
      "documentsCount": 2
    },
    {
      "sessionId": "session_12346",
      "userId": "user_002",
      "createdAt": "2024-01-15T09:15:00Z",
      "lastActivity": "2024-01-15T10:25:00Z",
      "documentsCount": 0
    }
  ]
}
\`\`\`

**Status Codes:** 200, 500

---

## Error Responses

### 400 Bad Request

\`\`\`json
{
  "error": "Message is required and must be a string"
}
\`\`\`

### 429 Too Many Requests

\`\`\`json
{
  "error": "Too many chat requests, please wait before sending another message."
}
\`\`\`

### 500 Internal Server Error

\`\`\`json
{
  "error": "Failed to generate response",
  "timestamp": "2024-01-15T10:30:00Z"
}
\`\`\`

---

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/chat` | 30 | 1 minute |
| `/api/pdf/upload` | 5 | 1 hour |
| Global | 100 | 15 minutes |

Rate limit exceeded returns: `429 Too Many Requests`

---

## Session Management

### Creating a Session

Auto-created on first request. Header returned:
\`\`\`
X-Session-ID: new_session_id
\`\`\`

### Using a Session

Send with requests:
\`\`\`bash
curl -H "X-Session-ID: my_session_123" http://localhost:5000/api/chat
\`\`\`

### Session Features

- Isolated document storage
- 24-hour auto-cleanup
- Per-user query tracking
- Session metadata storage

---

## Example Workflows

### 1. Simple Chat Query

\`\`\`bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: session_123" \
  -d '{"message": "What is artificial intelligence?"}'
\`\`\`

### 2. Upload and Ask About PDF

\`\`\`bash
# Upload PDF
curl -X POST http://localhost:5000/api/pdf/upload \
  -H "X-Session-ID: session_123" \
  -F "file=@research.pdf"

# Ask about it
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: session_123" \
  -d '{"message": "Summarize the methodology"}'
\`\`\`

### 3. Get Session Analytics

\`\`\`bash
curl http://localhost:5000/api/analytics/sessions
\`\`\`

---

## Data Types

### Intent Types
- `realtime`: Weather, news, currency, time
- `rag`: Knowledge base queries
- `general`: Conversational

### Source Types
- `realtime`: Live API data
- `rag`: Knowledge base
- `pdf`: User-uploaded PDFs
- `llm`: LLM fallback

### Confidence Score
- 0.0 - 0.3: Low confidence
- 0.3 - 0.7: Medium confidence
- 0.7 - 1.0: High confidence

---

## Troubleshooting

### Common Errors

**"Message is required"**
- Ensure message field is provided and non-empty

**"PDF size exceeds 10MB"**
- Upload smaller PDF or adjust MAX_PDF_SIZE_MB

**"Too many requests"**
- Wait before sending more requests (rate limited)

**"Session not found"**
- Session auto-created, check X-Session-ID header

---

## Performance Tips

- Use caching for repeated queries
- Upload PDFs during off-peak hours
- Monitor analytics for bottlenecks
- Keep message content concise
- Batch PDF uploads when possible

---

## SDK/Client Examples

See `examples/` directory for:
- JavaScript/Node.js client
- Python client
- cURL examples
- Postman collection

---

Last updated: 2024
