# Production-Ready Intelligent Chatbot Backend

A comprehensive Node.js + Express backend featuring real-time data fetching, RAG with PDF uploads, multi-user sessions, async PDF processing, rate limiting, security, and analytics.

## Key Features

### Core Functionality
- **Real-time Data Integration** - Live weather, news, exchange rates, and time
- **RAG System** - Vector similarity search with knowledge base
- **Custom PDFs** - Upload and index PDFs for personalized RAG
- **Multi-source Response Merging** - Intelligent combination of data from multiple sources
- **LLM Integration** - OpenAI or Groq support with custom prompts

### Advanced Features
- **Multi-user Sessions** - Isolated sessions with per-user document storage
- **Intent Detection** - Automatic query classification (realtime/rag/general)
- **Async PDF Processing** - Background queue with Bull.js (Redis-backed)
- **Response Merging** - Intelligent source prioritization and confidence scoring
- **Rate Limiting** - Per-user and per-IP protection against abuse
- **Security** - Input validation, PDF scanning, API key protection
- **Analytics** - Query tracking, cache metrics, performance monitoring
- **Comprehensive Logging** - Winston-based multi-file logging system
- **Caching** - In-memory cache with TTL to reduce API costs

## System Architecture

\`\`\`
Frontend (Next.js)
     ↓ (X-Session-ID header)
Backend (Express)
     ├── Intent Detector → Query Classification
     ├── Real-time Service → Weather, News, Rates APIs
     ├── PDF Service → User-uploaded documents
     ├── RAG Service → Knowledge base
     ├── Response Merger → Multi-source aggregation
     ├── LLM Service → Final response generation
     ├── Queue Processor → Async PDF background jobs
     ├── Analytics → Metrics tracking
     └── Rate Limiter → Security & quota enforcement
\`\`\`

## Prerequisites

- Node.js >= 16.x
- npm or yarn
- Redis (optional, for Bull.js queue; falls back to immediate processing)
- API keys:
  - OpenAI or Groq (LLM)
  - NewsAPI (News data)

## Installation

### Step 1: Setup Backend

\`\`\`bash
cd backend
npm install
\`\`\`

### Step 2: Configure Environment Variables

\`\`\`bash
cp .env.example .env
\`\`\`

Edit `.env` with your API keys and settings.

### Step 3: Get API Keys

#### OpenAI
1. Visit https://platform.openai.com/api-keys
2. Create new API key
3. Add to `.env`: `OPENAI_API_KEY=sk-...`

#### Groq (Alternative to OpenAI)
1. Visit https://console.groq.com
2. Create API key
3. Set `LLM_PROVIDER=groq` and add `GROQ_API_KEY` to `.env`

#### NewsAPI
1. Visit https://newsapi.org
2. Sign up (free tier available)
3. Add to `.env`: `NEWS_API_KEY=...`

### Step 4: Optional - Setup Redis for Queue Processing

\`\`\`bash
# Using Docker
docker run -d -p 6379:6379 redis

# Or install locally
# macOS: brew install redis
# Ubuntu: sudo apt-get install redis-server
\`\`\`

Update `.env`:
\`\`\`env
REDIS_HOST=localhost
REDIS_PORT=6379
\`\`\`

## Running the Backend

### Development (auto-reload)
\`\`\`bash
npm run dev
\`\`\`

### Production
\`\`\`bash
npm start
\`\`\`

Server runs on `http://localhost:5000` by default.

## API Reference

### Authentication
Use `X-Session-ID` header for multi-user support:
\`\`\`bash
curl -H "X-Session-ID: session_123" http://localhost:5000/api/chat
\`\`\`

If not provided, a new session is auto-created.

### 1. Chat Endpoint

**POST** `/api/chat`

Request:
\`\`\`json
{
  "message": "What's the weather in Paris?"
}
\`\`\`

Response:
\`\`\`json
{
  "reply": "The weather in Paris is...",
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
    }
  ],
  "confidenceScore": 0.95,
  "sessionId": "session_123",
  "responseTime": 245,
  "timestamp": "2024-01-15T10:30:00Z"
}
\`\`\`

**Intent Types:**
- `realtime` - Weather, news, currency, time queries
- `rag` - Knowledge base questions
- `general` - Conversational queries

### 2. PDF Upload Endpoint

**POST** `/api/pdf/upload`

Request:
\`\`\`bash
curl -X POST http://localhost:5000/api/pdf/upload \
  -H "X-Session-ID: session_123" \
  -F "file=@document.pdf"
\`\`\`

Response:
\`\`\`json
{
  "success": true,
  "message": "PDF processed immediately",
  "documentId": "uuid-here",
  "filename": "document.pdf",
  "chunksCreated": 45
}
\`\`\`

**Limits:**
- Max file size: 10MB
- File type: PDF only
- Max uploads: 5 per hour per user

### 3. List User PDFs

**GET** `/api/pdf/list`

Response:
\`\`\`json
{
  "success": true,
  "count": 2,
  "pdfs": [
    {
      "documentId": "uuid-1",
      "filename": "research.pdf",
      "pageCount": 25,
      "chunks": 120,
      "uploadedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
\`\`\`

### 4. Delete PDF

**DELETE** `/api/pdf/{documentId}`

Response:
\`\`\`json
{
  "success": true,
  "message": "PDF deleted successfully",
  "documentId": "uuid-1"
}
\`\`\`

### 5. Analytics Endpoint

**GET** `/api/analytics`

Response:
\`\`\`json
{
  "success": true,
  "analytics": {
    "totalQueries": 150,
    "queriesBySource": {
      "realtime": 45,
      "rag": 60,
      "llm": 45
    },
    "cacheStats": {
      "hits": 120,
      "misses": 30,
      "hitRate": "80%"
    },
    "pdfStats": {
      "uploaded": 5,
      "processed": 5
    },
    "performance": {
      "averageResponseTimeMs": 342,
      "errorCount": 3
    },
    "uptime": "125 minutes"
  },
  "activeSessions": 8,
  "timestamp": "2024-01-15T10:30:00Z"
}
\`\`\`

### 6. Session List

**GET** `/api/analytics/sessions`

Response:
\`\`\`json
{
  "success": true,
  "sessions": [
    {
      "sessionId": "session_123",
      "userId": "user_123",
      "createdAt": "2024-01-15T09:00:00Z",
      "lastActivity": "2024-01-15T10:30:00Z",
      "documentsCount": 2
    }
  ]
}
\`\`\`

### 7. Health Check

**GET** `/health`

Response:
\`\`\`json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z"
}
\`\`\`

## Intent Detection

The system automatically classifies queries:

\`\`\`
Query                           → Intent    → Source
"What's the weather?"           → realtime  → Weather API
"Latest news on AI"             → realtime  → News API
"USD to EUR rate?"              → realtime  → Exchange Rate API
"What time is it?"              → realtime  → System Time
"Explain machine learning"      → rag       → Knowledge Base
"What is AI?"                   → rag       → Knowledge Base
"Hi, how are you?"              → general   → LLM
"Can you help me?"              → general   → LLM
\`\`\`

## Multi-User Sessions

Each request creates or uses an existing session:

\`\`\`bash
# Create session (auto-generated)
curl http://localhost:5000/api/chat

# Use specific session
curl -H "X-Session-ID: my_session_id" http://localhost:5000/api/chat
\`\`\`

**Session Features:**
- Isolated document storage (PDFs)
- Per-user query history
- Auto-cleanup of expired sessions (24 hours)
- Session metadata and timestamps

## Response Merging Logic

When multiple sources have answers, the system prioritizes:

**For Realtime Queries:**
1. Real-time API (highest priority)
2. User PDFs (if relevant)
3. Knowledge base
4. LLM (fallback)

**For RAG Queries:**
1. User PDFs (highest priority if available)
2. Knowledge base
3. Real-time APIs
4. LLM (fallback)

**For General Queries:**
1. LLM (highest priority)
2. Knowledge base (context)
3. User PDFs (context)
4. Real-time APIs (context)

Each source includes a confidence score (0-1) shown to the user.

## Async PDF Processing

PDFs are processed in background via Bull.js queue:

\`\`\`bash
# Upload triggers background job
POST /api/pdf/upload → Job created → Processing in background

# Processing includes:
1. Text extraction
2. Chunking (500 chars per chunk, 50 char overlap)
3. Metadata storage
4. Searchability indexing
\`\`\`

**Without Redis:** Falls back to immediate processing
**With Redis:** Queued with retry logic and progress tracking

## Rate Limiting

Protection against abuse:

| Endpoint | Limit | Window |
|----------|-------|--------|
| Global | 100 req | 15 min |
| Chat | 30 req | 1 min |
| PDF Upload | 5 uploads | 1 hour |

User ID or IP address used as key.

## Security Features

1. **PDF Validation**
   - File type checking (.pdf only)
   - Size limits (10MB max)
   - MIME type verification

2. **Input Validation**
   - Message length checks
   - Type validation
   - Sanitization

3. **API Security**
   - API keys kept in `.env` (never exposed)
   - Helmet.js for HTTP headers
   - CORS configuration

4. **Rate Limiting**
   - Per-user request throttling
   - Per-IP protection
   - Graceful error responses

## Logging

Winston logger saves to `/logs/`:

\`\`\`
/logs/
├── combined.log    # All events
├── error.log       # Errors only
└── requests.log    # HTTP requests
\`\`\`

View logs:
\`\`\`bash
tail -f logs/combined.log
tail -f logs/error.log
\`\`\`

Log levels: error, warn, info, debug

## Folder Structure

\`\`\`
backend/
├── src/
│   ├── index.js                    # Main server
│   ├── routes/
│   │   ├── chat.js                 # Chat API
│   │   ├── pdf.js                  # PDF management
│   │   └── analytics.js            # Analytics & monitoring
│   ├── services/
│   │   ├── intentDetector.js       # Query classification
│   │   ├── realtime.js             # Real-time APIs
│   │   ├── rag.js                  # Vector similarity search
│   │   ├── pdfProcessor.js         # PDF text extraction & chunking
│   │   ├── responseMerger.js       # Multi-source merging
│   │   ├── llm.js                  # LLM integration
│   │   ├── queueProcessor.js       # Bull.js queue
│   │   └── cron.js                 # Scheduled jobs
│   └── utils/
│       ├── logger.js               # Winston configuration
│       ├── rateLimiter.js          # Rate limiting & validation
│       ├── sessionManager.js       # Multi-user sessions
│       ├── analytics.js            # Metrics tracking
│       └── cache.js                # TTL cache
├── data/
│   └── documents.json              # RAG knowledge base
├── logs/                           # Generated log files
├── .env.example                    # Environment template
├── package.json
└── README.md
\`\`\`

## Environment Variables

See `.env.example` for all options:

\`\`\`env
# Server
PORT=5000
NODE_ENV=development

# LLM
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
GROQ_API_KEY=...

# APIs
NEWS_API_KEY=...

# PDF Processing
MAX_PDF_SIZE_MB=10

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# Security
CORS_ORIGIN=http://localhost:3000
\`\`\`

## Cron Jobs

Automatic background tasks (configurable):

- News refresh (5 min)
- Document reindexing (5 min)
- Session cleanup (hourly)
- Cache optimization (hourly)

Edit in `src/services/cron.js`:
\`\`\`javascript
cron.schedule('*/5 * * * *', async () => {
  // Runs every 5 minutes
})
\`\`\`

[Cron syntax reference](https://crontab.guru/)

## Performance Optimization

- **Caching**: 80%+ reduction in API calls via TTL cache
- **Async Processing**: PDFs processed in background queue
- **Response Merging**: Combines sources intelligently
- **Rate Limiting**: Protects APIs from overuse
- **Index Optimization**: Fast document retrieval

## Example Queries

### Real-time Examples
\`\`\`bash
# Weather
"What's the weather in Tokyo?"
"How warm is London?"
"Will it rain tomorrow?"

# News
"Show me latest tech news"
"What's happening in finance?"
"Breaking news today"

# Exchange Rates
"USD to EUR conversion"
"Bitcoin to dollars"
"Exchange rates"

# Time
"What time is it?"
"Current time in NYC"
\`\`\`

### RAG Examples
\`\`\`bash
"Explain machine learning"
"What is deep learning?"
"Tell me about neural networks"
"Define natural language processing"
\`\`\`

### PDF Examples (after upload)
\`\`\`bash
"Summarize the main points"
"What methodology was used?"
"Find information about X"
"Extract key findings"
\`\`\`

## Troubleshooting

### Issue: Port Already in Use
\`\`\`bash
PORT=5001 npm start
\`\`\`

### Issue: API Keys Not Found
Check `.env` has all required keys. Restart after changes.

### Issue: Redis Connection Failed
Queue falls back to immediate processing. For full async, ensure Redis is running.

### Issue: PDF Upload Fails
- Check file size (< 10MB)
- Verify it's a valid PDF
- Check rate limit (5 per hour)

### Issue: CORS Errors
Update `CORS_ORIGIN` in `.env` to match frontend URL.

### Issue: No PDF Results in Chat
- Verify PDF was processed successfully
- Use `GET /api/pdf/list` to check uploaded PDFs
- Queries must match document content

## Deployment

### Vercel
1. Create `vercel.json`:
\`\`\`json
{
  "buildCommand": "cd backend && npm install",
  "outputDirectory": "backend"
}
\`\`\`

2. Deploy: `vercel deploy`

### Docker
\`\`\`dockerfile
FROM node:18
WORKDIR /app/backend
COPY backend/ .
RUN npm install
CMD ["npm", "start"]
\`\`\`

### Heroku
\`\`\`bash
git push heroku main
heroku config:set OPENAI_API_KEY=sk-...
\`\`\`

## Monitoring & Alerts

Check `/api/analytics` endpoint for:
- Query counts by source
- Cache hit rates
- PDF processing status
- Error tracking
- Performance metrics

Set up alerts for:
- High error rates
- Cache hit rate drops
- Response time increases
- Queue processing delays

## Best Practices

1. **Always use `.env`** - Never hardcode API keys
2. **Monitor rate limits** - Check API quotas regularly
3. **Scale cache TTL** - Adjust for your use case
4. **Test PDFs** - Verify extraction works
5. **Use Redis** - For production queue processing
6. **Regular backups** - Keep session/PDF data
7. **Monitor logs** - Check for errors/warnings
8. **Update dependencies** - Keep packages current

## Support & Issues

1. Check logs: `tail -f logs/error.log`
2. Verify API keys in `.env`
3. Test health: `curl http://localhost:5000/health`
4. Check session: `curl -H "X-Session-ID: test" http://localhost:5000/api/chat`
5. Review analytics: `curl http://localhost:5000/api/analytics`

## License

MIT
