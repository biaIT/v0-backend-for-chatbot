# Advanced Features & Enhancements (v6)

This document covers all advanced features added to the chatbot system.

## 1. Frontend UX Enhancements

### Voice Input/Output
- **Web Speech API Integration**: Real-time speech recognition
- **Text-to-Speech**: Responses can be read aloud
- **Auto-transcript**: Voice transcripts automatically fill message input

\`\`\`tsx
import { useVoice } from '@/hooks/use-voice'

const { isListening, startListening, speak } = useVoice({
  onTranscript: (text) => setInput(text),
  onError: (error) => console.error(error)
})
\`\`\`

### Advanced Message Rendering
- **Markdown-style formatting**: Code blocks, lists, emphasis
- **Link detection and formatting**: Clickable URLs in responses
- **Entity highlighting**: Named entities are visually emphasized

### PDF Viewer
- **Zoom controls**: 50% - 200% zoom levels
- **Page navigation**: Move between pages
- **Embedded modal viewer**: View PDFs without leaving chat

### Responsive Design
- **Mobile-first**: Optimized for all screen sizes
- **Touch-friendly**: Large tap targets on mobile
- **Adaptive layouts**: Sidebars collapse on small screens

## 2. Admin Dashboard Improvements

### Data Export
- **CSV Export**: Analytics, sessions, and PDFs
- **JSON Export**: Complete system data backup
- **Scheduled Exports**: Automate exports via cron

\`\`\`bash
GET /api/admin/export/analytics-csv
GET /api/admin/export/sessions-csv
GET /api/admin/export/pdfs-csv
GET /api/admin/export/full-json
\`\`\`

### Alert System
- **API Failure Alerts**: Track failed API calls
- **Cache TTL Monitoring**: Alert on cache expiry
- **Queue Error Tracking**: Monitor PDF processing issues
- **Severity Levels**: Critical, Warning, Info

\`\`\`javascript
// Record API failure
alertManager.recordAPIFailure('weatherAPI', error)

// Record queue error
alertManager.recordQueueError(jobId, error)
\`\`\`

### Real-time Dashboard Updates
- **WebSocket support** (future): Real-time metrics
- **Auto-refresh**: Dashboard data refreshes every 30s
- **Session Management**: Deactivate/delete sessions
- **PDF Browser**: Manage all uploaded PDFs

## 3. ML Classifier Enhancements

### Entity Recognition
- **Location Extraction**: Cities, countries, regions
- **Date/Time Recognition**: Parse temporal references
- **Currency Detection**: Identify monetary amounts
- **Entity-Based Confidence**: Boost confidence with entity matches

\`\`\`javascript
import { extractEntities, scoreConfidenceByEntities } from '../ml/entityRecognition.js'

const entities = extractEntities("Weather in Paris on Dec 25")
const score = scoreConfidenceByEntities(entities)
\`\`\`

### Response Ranking
- **Multi-factor Scoring**: Confidence, entity matches, content length
- **Intent Alignment**: Score based on query intent
- **Quality Thresholding**: Filter low-quality responses

\`\`\`javascript
const ranked = rankResponses(responses, query, intent)
const topResponse = getTopRankedResponse(responses)
\`\`\`

### ML Fallback Logic
- **Confidence Thresholding**: Fallback to rule-based if < 60% confidence
- **Graceful Degradation**: Always provide an answer
- **Error Recovery**: Log and retry on ML failures

## 4. Backend Infrastructure

### Distributed Caching
- **Redis Integration**: Optional distributed cache
- **Local Fallback**: In-memory cache if Redis unavailable
- **Automatic TTL**: Configurable expiration times
- **Cache Statistics**: Monitor cache performance

\`\`\`javascript
import distributedCache from '../utils/distributedCache.js'

await distributedCache.set('key', value, 3600) // 1 hour TTL
const data = await distributedCache.get('key')
\`\`\`

### Advanced Rate Limiting
- **Per-User Limits**: 100 requests/hour per user
- **Per-Session Limits**: 50 requests/hour per session
- **Per-IP Limits**: 500 requests/hour per IP
- **Dynamic Adjustment**: Reduce limits under high load
- **Blocklist**: Temporary block for violators (5 min)

\`\`\`javascript
import advancedRateLimiter from '../utils/advancedRateLimiter.js'

const check = advancedRateLimiter.checkLimit(sessionId, 'session')
if (!check.allowed) {
  return res.status(429).json({ error: 'Rate limit exceeded' })
}
\`\`\`

### Multi-Instance Deployment
- **Session Sharing**: Sessions persisted across instances
- **Cache Consistency**: Redis keeps cache in sync
- **Load Balancing**: Ready for nginx/HAProxy
- **Health Checks**: Comprehensive health endpoints

\`\`\`bash
# Liveness probe (is the app running?)
GET /health/live

# Readiness probe (is the app ready to serve traffic?)
GET /health/ready

# Detailed health check
GET /health/detailed
\`\`\`

## 5. Testing & Quality Assurance

### Integration Tests
\`\`\`bash
npm test -- integration.test.js
\`\`\`

Features tested:
- Concurrent PDF uploads (3 users)
- Multi-source query merging
- RAG consistency across sessions

### Load Tests
\`\`\`bash
npm test -- load.test.js
\`\`\`

Metrics:
- 10 concurrent users, 5 requests each
- Cache stress test with 100 iterations
- Throughput, success rate, response times

### Self-Test Endpoint
\`\`\`bash
curl http://localhost:5000/api/selftest
\`\`\`

Tests:
- Session initialization
- Analytics tracking
- API key validation
- Cache functionality

## 6. Demo Scenarios

### Scenario 1: Real-Time Weather Query
\`\`\`
User: "What's the weather in Tokyo?"
Expected: Realtime API → Weather data → LLM formatted response
Sources: realtime (weather)
\`\`\`

### Scenario 2: Knowledge Base Query with PDF
\`\`\`
1. Upload: "machine-learning-guide.pdf"
2. Query: "What are the key ML algorithms?"
Expected: PDF → RAG query → LLM synthesis
Sources: pdf, rag
Confidence: 0.9+
\`\`\`

### Scenario 3: Multi-Source Merge
\`\`\`
Query: "What's the latest AI news and teach me about transformers?"
Expected: 
  - News API (realtime)
  - Knowledge base (RAG)
  - LLM synthesis
Sources: realtime (news), rag
\`\`\`

### Scenario 4: Cache Hit Validation
\`\`\`
1. Query 1: "USD to EUR rate" (cache miss)
2. Query 2: "USD to EUR rate" (within 30 min)
Expected: Second query is served from cache
Metrics: Cache hit rate increases
\`\`\`

### Scenario 5: Rate Limiting
\`\`\`
User: Sends 55 requests in 1 hour
Expected: Request 51+ returns 429 Too Many Requests
Recovery: Blocklist expires after 5 minutes
\`\`\`

## 7. Environment Variables

\`\`\`env
# API Keys
OPENAI_API_KEY=sk-...
GROQ_API_KEY=...
WEATHERAPI_KEY=...
NEWSAPI_KEY=...

# Advanced Features
REDIS_URL=redis://localhost:6379  # Optional
ADMIN_KEY=your-secure-admin-key
ENABLE_ML_CLASSIFIER=true
ENABLE_ENTITY_RECOGNITION=true

# Rate Limiting
RATE_LIMIT_PER_SESSION=50
RATE_LIMIT_PER_USER=100
RATE_LIMIT_PER_IP=500

# Cache
CACHE_TTL_WEATHER=1800     # 30 min
CACHE_TTL_NEWS=3600        # 1 hour
CACHE_TTL_CURRENCY=21600   # 6 hours
\`\`\`

## 8. Performance Benchmarks

### Typical Response Times
- Realtime API: 200-500ms
- RAG Query: 150-300ms
- LLM Generation: 1-3 seconds
- Total (with merge): 1.5-4 seconds

### Cache Impact
- Cache hit: 50-100ms
- Cache miss: 500ms+
- Expected hit rate: 60-80% for repeated queries

### Throughput
- Single instance: 50-100 req/sec
- Multi-instance (load balanced): 200+ req/sec

## 9. Monitoring & Observability

### Logging
- Winston logger with 3 output files
- Different levels: error, warn, info, debug
- Structured JSON logging for aggregation

### Metrics
- Request/response times (per source)
- Cache hit/miss rates
- Error rates by source
- Session statistics

### Alerts
- API failure threshold: 5 failures → critical
- Cache issues tracked in real-time
- Queue errors with deadletter queue support

## 10. Deployment Checklist

- [ ] Set all environment variables
- [ ] Configure Redis if using distributed cache
- [ ] Set secure ADMIN_KEY
- [ ] Test health endpoints
- [ ] Run integration tests
- [ ] Run load tests
- [ ] Configure log rotation
- [ ] Setup monitoring/alerts
- [ ] Configure backup strategy
- [ ] Document API endpoints

---

**Version**: 6.0
**Last Updated**: December 2024
\`\`\`

Now create deployment guides:
