/**
 * Admin Dashboard Routes
 * Protected admin endpoints for system management
 * GET /api/admin/stats - System analytics
 * GET /api/admin/sessions - List all sessions
 * DELETE /api/admin/sessions/:sessionId - Delete session
 * GET /api/admin/pdfs - List all PDFs
 * DELETE /api/admin/pdfs/:documentId - Delete any PDF
 * GET /api/admin/api-usage - API call statistics
 * GET /api/admin/alerts - List recent alerts
 * DELETE /api/admin/alerts - Clear all alerts
 * GET /api/admin/export/analytics-csv - Export analytics as CSV
 * GET /api/admin/export/sessions-csv - Export sessions as CSV
 * GET /api/admin/export/pdfs-csv - Export PDFs as CSV
 * GET /api/admin/export/full-json - Export all data as JSON
 */

import express from "express"
import { SessionManager } from "../utils/sessionManager.js"
import { getAnalytics } from "../utils/analytics.js"
import { createLogger } from "../utils/logger.js"
import {
  generateCSV,
  generateJSON,
  formatSessionsForExport,
  formatPDFsForExport,
  formatAnalyticsForExport,
} from "../utils/exports.js"
import alertManager from "../utils/alerts.js"

const router = express.Router()
const logger = createLogger()

// Admin authentication middleware (basic check)
const adminAuth = (req, res, next) => {
  const adminKey = process.env.ADMIN_KEY || "admin123"
  const key = req.headers["x-admin-key"]

  if (key !== adminKey) {
    logger.warn(`Unauthorized admin access attempt from ${req.ip}`)
    return res.status(401).json({ error: "Unauthorized" })
  }
  next()
}

// Get system analytics
router.get("/admin/stats", adminAuth, (req, res) => {
  try {
    const stats = getAnalytics()
    const sessions = SessionManager.getAllSessions()

    res.json({
      timestamp: new Date().toISOString(),
      sessions: {
        active: sessions.filter((s) => Date.now() - s.createdAt < 24 * 60 * 60 * 1000).length,
        total: sessions.length,
      },
      analytics: stats,
    })
  } catch (err) {
    logger.error("Error fetching stats:", err)
    res.status(500).json({ error: "Failed to fetch statistics" })
  }
})

// List all active sessions
router.get("/admin/sessions", adminAuth, (req, res) => {
  try {
    const sessions = SessionManager.getAllSessions()
    const sessionList = sessions.map((session) => ({
      id: session.id,
      createdAt: new Date(session.createdAt).toISOString(),
      lastUsed: new Date(session.lastUsed).toISOString(),
      queryCount: session.queryCount || 0,
      pdfCount: session.pdfs?.length || 0,
      isActive: Date.now() - session.lastUsed < 30 * 60 * 1000, // 30 min threshold
    }))

    res.json({
      total: sessionList.length,
      sessions: sessionList,
    })
  } catch (err) {
    logger.error("Error fetching sessions:", err)
    res.status(500).json({ error: "Failed to fetch sessions" })
  }
})

// Delete a session
router.delete("/admin/sessions/:sessionId", adminAuth, (req, res) => {
  try {
    const { sessionId } = req.params
    SessionManager.deleteSession(sessionId)

    logger.info(`Admin deleted session: ${sessionId}`)
    res.json({ message: "Session deleted", sessionId })
  } catch (err) {
    logger.error("Error deleting session:", err)
    res.status(500).json({ error: "Failed to delete session" })
  }
})

// List all PDFs across all sessions
router.get("/admin/pdfs", adminAuth, (req, res) => {
  try {
    const sessions = SessionManager.getAllSessions()
    const allPdfs = []

    sessions.forEach((session) => {
      if (session.pdfs && Array.isArray(session.pdfs)) {
        session.pdfs.forEach((pdf) => {
          allPdfs.push({
            ...pdf,
            sessionId: session.id,
            uploadedAt: pdf.uploadedAt || "unknown",
          })
        })
      }
    })

    res.json({
      totalPdfs: allPdfs.length,
      bySession: sessions.map((s) => ({
        sessionId: s.id,
        pdfCount: s.pdfs?.length || 0,
      })),
      pdfs: allPdfs,
    })
  } catch (err) {
    logger.error("Error fetching PDFs:", err)
    res.status(500).json({ error: "Failed to fetch PDFs" })
  }
})

// Delete any PDF by documentId (admin only)
router.delete("/admin/pdfs/:documentId", adminAuth, (req, res) => {
  try {
    const { documentId } = req.params
    const sessions = SessionManager.getAllSessions()

    let deleted = false
    sessions.forEach((session) => {
      if (session.pdfs) {
        const index = session.pdfs.findIndex((p) => p.documentId === documentId)
        if (index !== -1) {
          session.pdfs.splice(index, 1)
          deleted = true
        }
      }
    })

    if (deleted) {
      logger.info(`Admin deleted PDF: ${documentId}`)
      res.json({ message: "PDF deleted", documentId })
    } else {
      res.status(404).json({ error: "PDF not found" })
    }
  } catch (err) {
    logger.error("Error deleting PDF:", err)
    res.status(500).json({ error: "Failed to delete PDF" })
  }
})

// Get API usage statistics
router.get("/admin/api-usage", adminAuth, (req, res) => {
  try {
    const stats = getAnalytics()

    res.json({
      timestamp: new Date().toISOString(),
      realtime: {
        weather: stats.realtimeQueries?.weather || 0,
        news: stats.realtimeQueries?.news || 0,
        currency: stats.realtimeQueries?.currency || 0,
        total: stats.realtimeQueries?.total || 0,
      },
      cache: {
        hits: stats.cacheHits || 0,
        misses: stats.cacheMisses || 0,
        hitRate:
          stats.cacheHits && stats.cacheMisses
            ? `${((stats.cacheHits / (stats.cacheHits + stats.cacheMisses)) * 100).toFixed(1)}%`
            : "N/A",
      },
      rag: {
        queries: stats.ragQueries || 0,
      },
      rateLimiter: {
        blockedRequests: stats.blockedRequests || 0,
      },
    })
  } catch (err) {
    logger.error("Error fetching API usage:", err)
    res.status(500).json({ error: "Failed to fetch API usage" })
  }
})

router.get("/admin/alerts", adminAuth, (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit) || 50
    const severity = req.query.severity || null

    let alerts = alertManager.getRecentAlerts(limit)

    if (severity) {
      alerts = alerts.filter((a) => a.severity === severity)
    }

    res.json({
      timestamp: new Date().toISOString(),
      summary: alertManager.getSummary(),
      alerts,
    })
  } catch (err) {
    logger.error("Error fetching alerts:", err)
    res.status(500).json({ error: "Failed to fetch alerts" })
  }
})

router.delete("/admin/alerts", adminAuth, (req, res) => {
  try {
    alertManager.clearAlerts()
    logger.info("Admin cleared all alerts")
    res.json({ message: "All alerts cleared" })
  } catch (err) {
    logger.error("Error clearing alerts:", err)
    res.status(500).json({ error: "Failed to clear alerts" })
  }
})

router.get("/admin/export/analytics-csv", adminAuth, (req, res) => {
  try {
    const stats = getAnalytics()
    const data = [formatAnalyticsForExport(stats)]
    const csv = generateCSV(data, "analytics")

    res.setHeader("Content-Type", "text/csv")
    res.setHeader("Content-Disposition", "attachment; filename=analytics.csv")
    res.send(csv)
  } catch (err) {
    logger.error("Error exporting analytics CSV:", err)
    res.status(500).json({ error: "Failed to export analytics" })
  }
})

router.get("/admin/export/sessions-csv", adminAuth, (req, res) => {
  try {
    const sessions = SessionManager.getAllSessions()
    const formattedSessions = formatSessionsForExport(sessions)
    const csv = generateCSV(formattedSessions, "sessions")

    res.setHeader("Content-Type", "text/csv")
    res.setHeader("Content-Disposition", "attachment; filename=sessions.csv")
    res.send(csv)
  } catch (err) {
    logger.error("Error exporting sessions CSV:", err)
    res.status(500).json({ error: "Failed to export sessions" })
  }
})

router.get("/admin/export/pdfs-csv", adminAuth, (req, res) => {
  try {
    const sessions = SessionManager.getAllSessions()
    const allPdfs = []
    sessions.forEach((s) => {
      if (s.pdfs) {
        s.pdfs.forEach((p) => allPdfs.push({ ...p, sessionId: s.id }))
      }
    })

    const formattedPdfs = formatPDFsForExport(allPdfs)
    const csv = generateCSV(formattedPdfs, "pdfs")

    res.setHeader("Content-Type", "text/csv")
    res.setHeader("Content-Disposition", "attachment; filename=pdfs.csv")
    res.send(csv)
  } catch (err) {
    logger.error("Error exporting PDFs CSV:", err)
    res.status(500).json({ error: "Failed to export PDFs" })
  }
})

router.get("/admin/export/full-json", adminAuth, (req, res) => {
  try {
    const stats = getAnalytics()
    const sessions = SessionManager.getAllSessions()
    const alerts = alertManager.getRecentAlerts(100)

    const allPdfs = []
    sessions.forEach((s) => {
      if (s.pdfs) {
        s.pdfs.forEach((p) => allPdfs.push({ ...p, sessionId: s.id }))
      }
    })

    const exportData = {
      timestamp: new Date().toISOString(),
      summary: alertManager.getSummary(),
      analytics: formatAnalyticsForExport(stats),
      sessions: formatSessionsForExport(sessions),
      pdfs: formatPDFsForExport(allPdfs),
      recentAlerts: alerts.slice(0, 50),
    }

    const json = generateJSON(exportData)

    res.setHeader("Content-Type", "application/json")
    res.setHeader("Content-Disposition", "attachment; filename=export.json")
    res.send(json)
  } catch (err) {
    logger.error("Error exporting full data:", err)
    res.status(500).json({ error: "Failed to export data" })
  }
})

export default router
