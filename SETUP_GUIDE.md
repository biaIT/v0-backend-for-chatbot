# Full Setup Guide: Frontend + Backend Integration

This guide walks you through setting up both the Next.js frontend and Node.js backend to work together seamlessly.

## Project Structure

\`\`\`
project-root/
├── app/                    # Next.js app router pages
├── components/            # React components
├── backend/              # Node.js/Express backend (NEW)
│   ├── src/
│   ├── data/
│   ├── logs/
│   ├── .env
│   ├── package.json
│   └── README.md
├── package.json          # Frontend dependencies
└── .env                  # Frontend env vars
\`\`\`

## Step 1: Setup Frontend

Your Next.js frontend is already configured. The chat page at `/` now includes:
- Chat interface with message history
- Real-time message input
- API calls to the backend
- Error handling and loading states
- PDF upload panel with document management
- Multi-source response display with confidence scores
- Session-based user isolation

No additional setup needed for the frontend!

## Step 2: Setup Backend

### 1. Navigate to backend folder
\`\`\`bash
cd backend
\`\`\`

### 2. Install dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Create `.env` file
\`\`\`bash
cp .env.example .env
\`\`\`

### 4. Add your API keys to `.env`

\`\`\`env
# Server Configuration
PORT=5000
NODE_ENV=development

# LLM Provider (openai or groq)
LLM_PROVIDER=openai

# Get from https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your-key-here

# Get from https://newsapi.org/register
NEWS_API_KEY=your-newsapi-key-here

# Optional: Redis for async PDF queue processing
REDIS_HOST=localhost
REDIS_PORT=6379

# Optional: CORS configuration
CORS_ORIGIN=http://localhost:3000

# PDF Configuration
MAX_PDF_SIZE_MB=10
\`\`\`

## Step 3: Optional Setup - Redis for Async Processing

For production-grade async PDF processing, setup Redis:

**macOS:**
\`\`\`bash
brew install redis
brew services start redis
redis-cli ping  # Should return PONG
\`\`\`

**Linux:**
\`\`\`bash
sudo apt-get install redis-server
sudo service redis-server start
redis-cli ping
\`\`\`

**Docker:**
\`\`\`bash
docker run -d -p 6379:6379 redis:latest
\`\`\`

Without Redis, PDFs are processed immediately (no background queue).

## Step 4: Run Backend and Frontend Together

### Terminal 1 - Backend
\`\`\`bash
cd backend
npm start
# Output: Server running on http://localhost:5000
#         Chat endpoint: POST http://localhost:5000/api/chat
#         PDF upload: POST http://localhost:5000/api/pdf/upload
#         Analytics: GET http://localhost:5000/api/analytics
\`\`\`

### Terminal 2 - Frontend
\`\`\`bash
# From project root (not backend folder)
npm run dev
# Output: ▲ Next.js 15.x
#         - Local:        http://localhost:3000
\`\`\`

## Step 5: Test the Integration

### Test Features via Browser

1. **Open** http://localhost:3000
2. **Chat with Real-time Data:**
   - Message: "What's the weather in Paris?"
   - Expected: Returns current weather from Open-Meteo API
   - Source: realtime badge

3. **Chat with Knowledge Base:**
   - Message: "Explain machine learning"
   - Expected: Returns from knowledge base
   - Source: rag badge

4. **Upload and Query PDF:**
   - Click PDF panel (right side)
   - Upload any PDF
   - Ask: "Summarize this document"
   - Expected: Returns relevant sections from your PDF

### Test via cURL

\`\`\`bash
# Health check
curl http://localhost:5000/health

# Real-time weather query
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: test-session" \
  -d '{"message": "What is the weather in Tokyo?"}'

# RAG knowledge query
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: test-session" \
  -d '{"message": "Tell me about artificial intelligence"}'

# Upload PDF
curl -X POST http://localhost:5000/api/pdf/upload \
  -H "X-Session-ID: test-session" \
  -F "file=@document.pdf"

# List user PDFs
curl http://localhost:5000/api/pdf/list \
  -H "X-Session-ID: test-session"

# Get analytics
curl http://localhost:5000/api/analytics
\`\`\`

## Frontend-Backend Communication Flow

\`\`\`
User Types Message
        ↓
[Frontend] Sends X-Session-ID header (for multi-user isolation)
        ↓
[Backend] Intent Detection → Classifies query:
        ├─ realtime (weather, news, rates, time)
        ├─ rag (knowledge base questions)
        └─ general (conversational)
        ↓
[Backend] Query Multiple Sources:
        ├─ Real-time APIs (if realtime query)
        ├─ User PDFs (if available, high priority)
        ├─ Knowledge Base (RAG)
        └─ LLM context
        ↓
[Backend] Response Merging:
        ├─ Prioritize sources by intent & confidence
        ├─ Combine results intelligently
        └─ Include source details & confidence score
        ↓
[Frontend] Display with:
        ├─ Source badges (realtime/rag/pdf)
        ├─ Confidence scores
        ├─ Expandable metadata
        └─ Source attribution
\`\`\`

## Production Features Included

### Query Routing & Intent Detection
- Automatic classification of user queries
- Routes to optimal data source
- Confidence scoring for responses

### Multi-user Sessions
- Each user has isolated session
- Separate PDF storage per user
- Session auto-cleanup after 24 hours
- User-specific analytics

### PDF Management
- Upload PDFs directly from frontend
- Text extraction and chunking
- Semantic search within PDFs
- Delete documents individually
- Limits: 10MB max, 5 uploads/hour per user

### Async Processing
- Background PDF processing via Bull.js queue
- Non-blocking uploads
- Progress tracking
- Fallback to immediate processing without Redis

### Security & Rate Limiting
- Per-user rate limits (30 chat/min)
- PDF upload limits (5/hour)
- Input validation
- PDF type & size checking
- API key protection

### Analytics & Monitoring
- Query tracking by source
- Cache hit/miss statistics
- PDF processing metrics
- Response time tracking
- Error monitoring
- Session statistics

### Response Merging
- Intelligent source prioritization
- Confidence-based ranking
- Multi-source aggregation
- Context preservation

## API Endpoints

### Chat
\`\`\`bash
POST /api/chat
Headers: X-Session-ID (optional, auto-created)
Body: { "message": "..." }
Returns: { "reply": "...", "sources": [...], "confidenceScore": 0.95 }
\`\`\`

### PDF Upload
\`\`\`bash
POST /api/pdf/upload
Headers: X-Session-ID (required for isolation)
Body: multipart/form-data with "file" field
Returns: { "documentId": "...", "chunksCreated": 45 }
\`\`\`

### PDF List
\`\`\`bash
GET /api/pdf/list
Headers: X-Session-ID
Returns: { "pdfs": [...], "count": 3 }
\`\`\`

### Delete PDF
\`\`\`bash
DELETE /api/pdf/:documentId
Headers: X-Session-ID
Returns: { "success": true }
\`\`\`

### Analytics
\`\`\`bash
GET /api/analytics
Returns: { "totalQueries": 250, "cacheStats": {...}, "pdfStats": {...} }
\`\`\`

## Environment Variables

### Backend (backend/.env)
\`\`\`env
# Server
PORT=5000
NODE_ENV=development

# LLM
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
GROQ_API_KEY=...  # Alternative to OpenAI

# APIs
NEWS_API_KEY=...

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# PDF
MAX_PDF_SIZE_MB=10

# CORS
CORS_ORIGIN=http://localhost:3000

# Cache TTL (minutes)
CACHE_TTL_WEATHER_MINUTES=30
CACHE_TTL_NEWS_MINUTES=60
CACHE_TTL_RATES_MINUTES=360
\`\`\`

## Testing Scenarios

### Real-time Weather (with caching)
\`\`\`
Message: "What's the weather in London?"
Expected: Current weather from Open-Meteo API
Source: realtime
Cache: Cached for 30 minutes on repeat queries
\`\`\`

### News Query
\`\`\`
Message: "What are latest headlines?"
Expected: Top news articles from NewsAPI
Source: realtime
Cache: 1-hour cache to respect API quotas
\`\`\`

### Knowledge Base Query
\`\`\`
Message: "Explain machine learning"
Expected: Relevant documents from knowledge base
Source: rag
\`\`\`

### PDF Query (after upload)
\`\`\`
1. Upload PDF via frontend
2. Message: "Summarize main findings"
Expected: Relevant sections from your PDF
Source: pdf (highest priority for RAG queries)
\`\`\`

### Multi-source Response
\`\`\`
Message: "Tell me about weather and AI"
Expected: Combines weather (realtime) + AI info (rag/pdf)
Sources: Multiple badges showing each source
\`\`\`

## Performance Tips

### Caching
- Weather: 30 min (adjust to your needs)
- News: 1 hour (respects API quotas)
- Rates: 6 hours (stable data)

### PDF Processing
- Use Redis for background processing
- Without Redis: immediate processing works fine
- Large PDFs may take a few seconds to chunk

### Rate Limiting
- Chat: 30 requests/minute per session
- PDF: 5 uploads/hour per session
- Monitor via /api/analytics

## Logs

### Backend Logs
\`\`\`bash
# All logs
tail -f backend/logs/combined.log

# Errors only
tail -f backend/logs/error.log

# HTTP requests
tail -f backend/logs/requests.log
\`\`\`

### Frontend Console
Press F12 in browser to see frontend logs and API calls

### Analytics Dashboard
\`\`\`bash
curl http://localhost:5000/api/analytics | jq .
\`\`\`

Shows:
- Total queries by source
- Cache hit rate
- Average response time
- PDF statistics
- Error count
- Active sessions

## Common Issues

### Issue: "Cannot connect to http://localhost:5000"
**Solution:**
1. Backend running: `npm start` in `/backend`
2. Check PORT=5000 in `.env`
3. No firewall blocking port 5000

### Issue: "OPENAI_API_KEY is not set"
**Solution:**
1. Verify `.env` in `/backend` exists
2. Add key: `OPENAI_API_KEY=sk-...`
3. Restart backend

### Issue: "Too many requests" error
**Solution:**
- Chat: Wait 1+ minute before sending more messages
- PDF: Wait 1+ hour before uploading more PDFs
- Check `/api/analytics` for usage stats

### Issue: "PDF upload fails or times out"
**Solution:**
1. Check file size (< 10MB)
2. Verify it's a valid PDF
3. Check Redis if enabled: `redis-cli ping`
4. View logs: `tail -f backend/logs/error.log`

### Issue: "Session not found"
**Solution:**
- Sessions auto-created
- Check X-Session-ID header in requests
- New session ID returned in response headers

### Issue: "No PDF results in chat"
**Solution:**
1. Upload PDF and wait for processing
2. Verify: `GET /api/pdf/list`
3. Ask questions matching PDF content
4. Check chunk count in response

### Issue: "Redis connection refused"
**Solution:**
- Without Redis: Works fine (immediate processing)
- With Redis: Start Redis: `redis-server`
- Check REDIS_HOST/PORT in `.env`

## Deployment

See `backend/DEPLOYMENT.md` for complete deployment guides:
- Vercel
- Heroku
- Docker
- AWS (EC2, Elastic Beanstalk)
- DigitalOcean
- Railway
- CapRover

## Next Steps

1. ✅ Full-stack chatbot with PDFs
2. Add user authentication
3. Implement message history database
4. Deploy to production
5. Scale with load balancing
6. Add voice input/output
7. Implement team collaboration

## Documentation

- **Backend README**: `backend/README.md` - Complete API reference
- **API Documentation**: `backend/API_DOCUMENTATION.md` - Detailed endpoint specs
- **Deployment Guide**: `backend/DEPLOYMENT.md` - Production deployment
- **Setup Guide**: This file - Local development setup

## Success Checklist

You'll know everything works when:

- [ ] Backend starts without errors
- [ ] Frontend loads at http://localhost:3000
- [ ] Can type and receive chat responses
- [ ] Real-time and RAG queries show different sources
- [ ] Can upload PDFs without errors
- [ ] PDFs are searchable in chat
- [ ] Backend logs show activity
- [ ] `/api/analytics` shows query stats
- [ ] Different sessions have isolated PDFs
- [ ] Rate limits show in error messages

Congratulations! Your production-ready full-stack chatbot is running! 🚀
