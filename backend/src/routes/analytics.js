/**
 * Analytics Routes
 * Provides analytics and monitoring endpoints
 */

import express from "express"
import { createLogger } from "../utils/logger.js"
import { SessionManager } from "../utils/sessionManager.js"
import analytics from "../utils/analytics.js"

const router = express.Router()
const logger = createLogger()

// GET /api/analytics - Get analytics summary
router.get("/analytics", (req, res) => {
  try {
    const summary = analytics.getSummary()
    const sessions = SessionManager.getAllSessions()

    res.json({
      success: true,
      analytics: summary,
      activeSessions: sessions.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error(`Analytics error: ${error.message}`, error)
    res.status(500).json({ error: "Failed to get analytics" })
  }
})

// GET /api/analytics/sessions - Get session list
router.get("/analytics/sessions", (req, res) => {
  try {
    const sessions = SessionManager.getAllSessions()

    res.json({
      success: true,
      sessions: sessions.map((s) => ({
        sessionId: s.sessionId,
        userId: s.userId,
        createdAt: s.createdAt,
        lastActivity: s.lastActivity,
        documentsCount: s.documents.length,
      })),
    })
  } catch (error) {
    logger.error(`Sessions error: ${error.message}`, error)
    res.status(500).json({ error: "Failed to get sessions" })
  }
})

export default router
