import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import helmet from "helmet"
import cookieParser from "cookie-parser"
import { fileURLToPath } from "url"
import { dirname } from "path"
import { createLogger } from "./utils/logger.js"
import { initializeCronJobs } from "./services/cron.js"
import { initializePDFQueue } from "./services/queueProcessor.js"
import { SessionManager } from "./utils/sessionManager.js"
import { validateApiKeys } from "./utils/rateLimiter.js"
import chatRoutes from "./routes/chat.js"
import analyticsRoutes from "./routes/analytics.js"
import pdfRoutes from "./routes/pdf.js"
import adminRoutes from "./routes/admin.js"
import examplesRoutes from "./routes/examples.js"
import selftestRoutes from "./routes/selftest.js"
import healthRoutes from "./routes/health.js"
import authRoutes from "./routes/auth.js" // Added auth routes
import usersRoutes from "./routes/users.js" // Added user management routes

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Initialize express app
const app = express()
const PORT = process.env.PORT || 5000
const logger = createLogger()

// Security middleware
app.use(helmet())
app.use(cors())
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ limit: "50mb", extended: true }))
app.use(cookieParser()) // Added cookie parser for JWT cookies

// Session middleware for multi-user support
app.use((req, res, next) => {
  let sessionId = req.headers["x-session-id"]
  if (!sessionId) {
    sessionId = SessionManager.createSession()
  }
  req.session = SessionManager.getSession(sessionId)
  req.sessionId = sessionId
  res.setHeader("X-Session-ID", sessionId)
  next()
})

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now()
  res.on("finish", () => {
    const duration = Date.now() - start
    logger.info(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - Session: ${req.sessionId}`)
  })
  next()
})

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

app.use("/", healthRoutes)

app.use("/api/auth", authRoutes)

// API Routes
app.use("/api", chatRoutes)
app.use("/api", pdfRoutes)
app.use("/api", analyticsRoutes)
app.use("/api", adminRoutes)
app.use("/api", usersRoutes) // Added user management routes
app.use("/api", examplesRoutes)
app.use("/api", selftestRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`, err)
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    timestamp: new Date().toISOString(),
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" })
})

// Initialize services
async function startServer() {
  try {
    // Validate API keys
    const keyValidation = validateApiKeys()
    if (!keyValidation.valid) {
      logger.warn(keyValidation.warning)
    }

    await initializePDFQueue()

    // Initialize cron jobs
    await initializeCronJobs()
    logger.info("Cron jobs initialized")

    // Cleanup expired sessions every hour
    setInterval(
      () => {
        SessionManager.cleanupExpiredSessions()
      },
      60 * 60 * 1000,
    )

    // Start server
    app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`)
      logger.info(`Health check: http://localhost:${PORT}/health`)
      logger.info(`Auth routes: http://localhost:${PORT}/api/auth`)
      logger.info(`Chat endpoint: POST http://localhost:${PORT}/api/chat`)
      logger.info(`PDF upload: POST http://localhost:${PORT}/api/pdf/upload`)
      logger.info(`Analytics: GET http://localhost:${PORT}/api/analytics`)
      logger.info(`Admin routes: http://localhost:${PORT}/api/admin`)
      logger.info(`User management: http://localhost:${PORT}/api/admin/users`)
      logger.info(`Examples routes: http://localhost:${PORT}/api/examples`)
      logger.info(`Selftest routes: http://localhost:${PORT}/api/selftest`)
      logger.info(`Health detailed: http://localhost:${PORT}/health/detailed`)
    })
  } catch (error) {
    logger.error("Failed to start server:", error)
    process.exit(1)
  }
}

startServer()

// Graceful shutdown
process.on("SIGINT", () => {
  logger.info("Shutting down gracefully...")
  process.exit(0)
})
