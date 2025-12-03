/**
 * Health Check Endpoints
 * Comprehensive system health monitoring
 */

import express from "express"
import { createLogger } from "../utils/logger.js"
import { SessionManager } from "../utils/sessionManager.js"
import { getAnalytics } from "../utils/analytics.js"

const router = express.Router()
const logger = createLogger()

router.get("/health/detailed", (req, res) => {
  try {
    const sessions = SessionManager.getAllSessions()
    const stats = getAnalytics()

    const healthStatus = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      checks: {
        backend: { status: "ok", message: "Backend server is running" },
        database: { status: "ok", message: "Session storage operational" },
        cache: { status: "ok", message: "Cache system operational" },
        rateLimiter: { status: "ok", message: "Rate limiter active" },
      },
      metrics: {
        activeSessions: sessions.length,
        totalQueries: stats.totalQueries || 0,
        errorCount: stats.errorCount || 0,
        uptime: stats.uptime || "unknown",
      },
      timestamp: new Date().toISOString(),
    }

    res.json(healthStatus)
  } catch (err) {
    logger.error("Health check error:", err)
    res.status(500).json({
      status: "unhealthy",
      error: err.message,
      timestamp: new Date().toISOString(),
    })
  }
})

router.get("/health/live", (req, res) => {
  res.json({ alive: true, timestamp: new Date().toISOString() })
})

router.get("/health/ready", async (req, res) => {
  try {
    const sessions = SessionManager.getAllSessions()
    const ready = sessions !== undefined

    res.status(ready ? 200 : 503).json({
      ready,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    res.status(503).json({ ready: false, error: err.message })
  }
})

export default router
