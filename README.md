# Advanced RAG Chatbot Backend

A production-ready Node.js + Express backend for an intelligent chatbot system with real-time data fetching, RAG (Retrieval-Augmented Generation) integration, cron jobs, and comprehensive logging.

## Features

✅ **Real-time Data Integration**
- Fetches live weather data
- Retrieves latest news
- Gets current exchange rates
- Provides current time information

✅ **RAG (Retrieval-Augmented Generation)**
- FAISS vector database integration
- Document similarity search
- Context-aware responses
- In-memory document store (extendable to FAISS)

✅ **LLM Support**
- OpenAI GPT-3.5 Turbo
- Groq API support
- Configurable model parameters
- Structured prompting

✅ **Intelligent Routing**
- Automatic real-time question detection
- Fallback to RAG when needed
- Smart data source selection

✅ **Cron Jobs**
- Automatic data refresh every 5 minutes
- News updates
- Document reindexing
- Configurable schedules

✅ **Comprehensive Logging**
- Winston logger with multiple transports
- File-based logging (errors, requests, combined)
- Console output for development
- Structured logging format

## Project Structure

\`\`\`
backend/
├── src/
│   ├── index.js                 # Main server file
│   ├── routes/
│   │   └── chat.js             # Chat API routes
│   ├── services/
│   │   ├── llm.js              # LLM integration (OpenAI, Groq)
│   │   ├── rag.js              # RAG & vector store logic
│   │   ├── realtime.js         # Real-time data fetching
│   │   └── cron.js             # Scheduled jobs
│   └── utils/
│       └── logger.js           # Winston logger configuration
├── data/
│   └── documents.json          # Document store for RAG
├── logs/
│   ├── error.log              # Error logs
│   ├── combined.log           # All logs
│   └── requests.log           # Request/response logs
├── .env                        # Environment variables (git ignored)
├── .env.example               # Environment template
├── package.json               # Dependencies
└── README.md                  # This file
\`\`\`

## Installation

### Prerequisites

- Node.js 18+ (https://nodejs.org/)
- npm or yarn package manager

### Step 1: Clone and Setup

\`\`\`bash
# Clone or download the project
cd backend

# Install dependencies
npm install
\`\`\`

### Step 2: Configure Environment Variables

\`\`\`bash
# Copy the example env file
cp .env.example .env

# Edit .env with your actual API keys and settings
nano .env
\`\`\`

### Step 3: Environment Variables Guide

Create a `.env` file in the root directory with the following variables:

\`\`\`env
# Server Configuration
PORT=5000
NODE_ENV=development

# LLM Configuration - Choose ONE provider
# For OpenAI:
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx

# For Groq (alternative):
# LLM_PROVIDER=groq
# GROQ_API_KEY=gsk-xxxxxxxxxxxxxxxxxxxxxxxx

# Real-time Data APIs
NEWS_API_KEY=your_newsapi_key_from_newsapi.org
WEATHER_API_KEY=your_weather_api_key_optional
CURRENCY_API_KEY=optional_currency_api_key

# RAG Configuration
FAISS_INDEX_PATH=./vectorstore/faiss.index
DOCUMENTS_PATH=./data/documents.json

# Logging
LOG_LEVEL=info
LOG_DIR=./logs

# Cron Configuration (5-minute interval)
CRON_REFRESH_INTERVAL=*/5 * * * *
\`\`\`

## Getting API Keys

### 1. **OpenAI API Key**
   - Visit: https://platform.openai.com/api-keys
   - Create a new API key
   - Copy and paste into `.env` as `OPENAI_API_KEY`

### 2. **Groq API Key** (Alternative to OpenAI)
   - Visit: https://console.groq.com/
   - Create a new API key
   - Copy and paste into `.env` as `GROQ_API_KEY`

### 3. **News API Key**
   - Visit: https://newsapi.org/
   - Sign up for free tier
   - Copy and paste into `.env` as `NEWS_API_KEY`

### 4. **Weather Data** (Optional)
   - Using Open-Meteo (free, no API key needed)
   - Or use your own weather API

### 5. **Exchange Rates** (Optional)
   - Using exchangerate-api.com (free tier available)
   - No key required for basic usage

## Running the Server

### Development Mode (with auto-reload)

\`\`\`bash
npm install -g nodemon  # Install nodemon globally (or use npx)
npm run dev
\`\`\`

The server will start on `http://localhost:5000` and restart automatically when you make changes.

### Production Mode

\`\`\`bash
npm start
\`\`\`

### Expected Output

\`\`\`
[INFO] 🚀 Backend server is running on http://localhost:5000
[INFO] Environment: development
[INFO] LLM Provider: openai
[INFO] Cron job initialized with schedule: */5 * * * *
\`\`\`

## Testing the API

### Using Postman

1. **Open Postman** (https://www.postman.com/)
2. **Create a new POST request**
3. **Set URL:** `http://localhost:5000/api/chat`
4. **Set Headers:**
   \`\`\`
   Content-Type: application/json
   \`\`\`
5. **Set Body (JSON):**
   \`\`\`json
   {
     "message": "What's the weather in London?"
   }
   \`\`\`
6. **Click Send**

### Using cURL

\`\`\`bash
# Real-time question (weather)
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the weather like today?"}'

# General question (uses RAG)
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What are quantum computers?"}'

# News query
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me the latest news"}'

# Exchange rates
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What are the current USD to EUR exchange rates?"}'
\`\`\`

### Using Node.js/JavaScript

\`\`\`javascript
async function testChatAPI() {
  const response = await fetch('http://localhost:5000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'What is the weather?' })
  });
  const data = await response.json();
  console.log(data);
}

testChatAPI();
\`\`\`

## API Endpoints

### 1. Health Check

\`\`\`
GET /health
\`\`\`

**Response:**
\`\`\`json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 125.456
}
\`\`\`

### 2. Chat Endpoint

\`\`\`
POST /api/chat
\`\`\`

**Request:**
\`\`\`json
{
  "message": "What's the weather in New York?"
}
\`\`\`

**Response:**
\`\`\`json
{
  "reply": "The weather in New York is currently... [LLM generated response]",
  "source": "realtime",
  "context": {
    "city": "New York",
    "current": {
      "temperature_2m": 15.5,
      "humidity": 65,
      "weather_code": 3,
      "wind_speed_10m": 12.5
    },
    "timestamp": "2024-01-15T10:30:00.000Z"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
\`\`\`

**Response (using RAG):**
\`\`\`json
{
  "reply": "Based on the knowledge base... [LLM generated response]",
  "source": "rag",
  "context": {
    "documents": 3
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
\`\`\`

## Error Handling

The API returns appropriate HTTP status codes:

- **200**: Success
- **400**: Bad Request (empty message)
- **404**: Endpoint not found
- **500**: Server error

**Error Response:**
\`\`\`json
{
  "error": "Failed to process chat request",
  "message": "Error details in development mode"
}
\`\`\`

## Logging

All events are logged to files in the `/logs` directory:

- **error.log**: Only error-level messages
- **combined.log**: All log levels
- **requests.log**: Request and response logs

View logs:
\`\`\`bash
# View real-time logs
tail -f logs/combined.log

# View errors only
tail -f logs/error.log

# View requests
tail -f logs/requests.log
\`\`\`

## Cron Jobs

The system runs automated tasks every 5 minutes:

1. **Data Refresh**: Fetches latest news
2. **Document Reindexing**: Updates RAG index
3. **Data Persistence**: Saves fresh data for audit trail

Configure the interval in `.env`:
\`\`\`env
CRON_REFRESH_INTERVAL=*/5 * * * *
\`\`\`

Cron Expression Format:
- `*/5 * * * *` = Every 5 minutes
- `0 * * * *` = Every hour
- `0 0 * * *` = Every day
- `0 0 * * 0` = Every Sunday

## Adding RAG Documents

Create or update `data/documents.json`:

\`\`\`json
[
  {
    "id": "doc1",
    "content": "Your document content here...",
    "metadata": {
      "source": "website",
      "category": "technology"
    }
  },
  {
    "id": "doc2",
    "content": "Another document...",
    "metadata": {
      "source": "article",
      "category": "science"
    }
  }
]
\`\`\`

The cron job automatically reindexes these documents every 5 minutes.

## Real-time Question Detection

The system automatically detects these question types:

- **Weather**: "What's the weather?", "How's the forecast?"
- **News**: "Latest news", "What's trending?"
- **Exchange Rates**: "EUR to USD", "Current exchange rates"
- **Time**: "What time is it?", "Current time"

## Troubleshooting

### Issue: "OPENAI_API_KEY is not configured"
**Solution**: Add your API key to `.env` and restart the server

### Issue: "News API rate limit exceeded"
**Solution**: Wait a few minutes or upgrade your NewsAPI plan

### Issue: Server won't start
**Solution**: 
1. Check if port 5000 is already in use: `lsof -i :5000`
2. Kill the process: `kill -9 <PID>`
3. Restart the server

### Issue: Logs directory not created
**Solution**: Manually create it:
\`\`\`bash
mkdir -p logs
mkdir -p data
\`\`\`

## Performance Optimization

For production deployment:

1. **Use proper FAISS indexing** instead of in-memory store
2. **Implement caching** for frequently asked questions
3. **Add rate limiting** to prevent abuse
4. **Use clustering** for load distribution
5. **Monitor with APM tools** (New Relic, DataDog)

## Security Considerations

1. ✅ **Environment Variables**: Never commit `.env` files
2. ✅ **API Keys**: Use appropriate scopes and rotate regularly
3. ✅ **HTTPS**: Use HTTPS in production
4. ✅ **Rate Limiting**: Implement request throttling
5. ✅ **Input Validation**: Sanitize user inputs
6. ✅ **CORS**: Configure CORS appropriately for your domain

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Submit a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the logs in `/logs/error.log`
2. Review the Troubleshooting section
3. Check API documentation for external services
4. Open an issue on GitHub

---

**Last Updated**: January 2024
**Version**: 1.0.0
**Maintained By**: Development Team
