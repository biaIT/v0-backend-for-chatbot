import express from "express"
import cors from "cors"
import bodyParser from "body-parser"
import dotenv from "dotenv"
import chatRoutes from "./routes/chat.js"
import { initializeCronJobs } from "./services/cron.js"
import { logger } from "./utils/logger.js"

// Load environment variables
dotenv.config()

// Initialize Express app
const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(bodyParser.json({ limit: "50mb" }))
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }))

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`[${req.method}] ${req.path}`, {
    timestamp: new Date().toISOString(),
    ip: req.ip,
  })
  next()
})

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// Chat routes
app.use("/api", chatRoutes)

// 404 handler
app.use((req, res) => {
  logger.warn(`404 Not Found: ${req.method} ${req.path}`)
  res.status(404).json({ error: "Route not found" })
})

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error("Unhandled error", { error: err.message, stack: err.stack })
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : "An error occurred",
  })
})

// Initialize cron jobs
initializeCronJobs()

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Backend server is running on http://localhost:${PORT}`)
  logger.info(`Environment: ${process.env.NODE_ENV}`)
  logger.info(`LLM Provider: ${process.env.LLM_PROVIDER}`)
})

export default app
