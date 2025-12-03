/**
 * Export utilities for analytics and reports
 * Supports CSV and JSON formats
 */

import { createLogger } from "./logger.js"

const logger = createLogger()

export function generateCSV(data, filename) {
  try {
    const headers = Object.keys(data[0] || {})
    const csvHeader = headers.map((h) => `"${h}"`).join(",")

    const csvRows = data.map((row) =>
      headers
        .map((header) => {
          const value = row[header]
          if (typeof value === "object") {
            return `"${JSON.stringify(value)}"`
          }
          return `"${value}"`
        })
        .join(","),
    )

    const csv = [csvHeader, ...csvRows].join("\n")
    logger.info(`Generated CSV export: ${filename}`)
    return csv
  } catch (err) {
    logger.error("CSV generation error:", err)
    throw new Error("Failed to generate CSV")
  }
}

export function generateJSON(data) {
  try {
    const json = JSON.stringify(data, null, 2)
    logger.info("Generated JSON export")
    return json
  } catch (err) {
    logger.error("JSON generation error:", err)
    throw new Error("Failed to generate JSON")
  }
}

export function formatSessionsForExport(sessions) {
  return sessions.map((s) => ({
    sessionId: s.id,
    createdAt: new Date(s.createdAt).toISOString(),
    lastUsed: new Date(s.lastUsed).toISOString(),
    queryCount: s.queryCount || 0,
    pdfCount: s.pdfs?.length || 0,
    status: s.isActive ? "active" : "inactive",
  }))
}

export function formatPDFsForExport(pdfs) {
  return pdfs.map((p) => ({
    documentId: p.documentId,
    filename: p.filename,
    sessionId: p.sessionId,
    uploadedAt: p.uploadedAt,
    pageCount: p.pageCount || 0,
    chunks: p.chunks || 0,
    sizeKB: p.sizeKB || 0,
  }))
}

export function formatAnalyticsForExport(analytics) {
  return {
    timestamp: new Date().toISOString(),
    totalQueries: analytics.totalQueries || 0,
    queriesBySource: analytics.queriesBySource || {},
    cacheHitRate: analytics.cacheStats?.hitRate || "N/A",
    averageResponseTime: analytics.performance?.averageResponseTimeMs || 0,
    errorCount: analytics.performance?.errorCount || 0,
    uptime: analytics.uptime || "N/A",
  }
}
