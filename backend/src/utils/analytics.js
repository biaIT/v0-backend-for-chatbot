/**
 * Analytics Tracker
 * Tracks queries, cache hits, PDF uploads, and performance metrics
 */

import { createLogger } from "./logger.js"

const logger = createLogger()

export class Analytics {
  constructor() {
    this.metrics = {
      totalQueries: 0,
      queriesBySource: {
        realtime: 0,
        rag: 0,
        llm: 0,
      },
      cacheHits: 0,
      cacheMisses: 0,
      totalPDFsUploaded: 0,
      totalPDFsProcessed: 0,
      averageResponseTime: 0,
      errorCount: 0,
      responseTimes: [],
      startTime: new Date(),
    }
  }

  /**
   * Record a query
   */
  recordQuery(source, responseTime) {
    this.metrics.totalQueries++
    if (this.metrics.queriesBySource[source]) {
      this.metrics.queriesBySource[source]++
    }
    this.metrics.responseTimes.push(responseTime)

    // Keep only last 100 response times for average calculation
    if (this.metrics.responseTimes.length > 100) {
      this.metrics.responseTimes.shift()
    }

    this.updateAverageResponseTime()
  }

  /**
   * Record cache event
   */
  recordCacheEvent(isHit) {
    if (isHit) {
      this.metrics.cacheHits++
    } else {
      this.metrics.cacheMisses++
    }
  }

  /**
   * Record PDF upload
   */
  recordPDFUpload() {
    this.metrics.totalPDFsUploaded++
  }

  /**
   * Record PDF processed
   */
  recordPDFProcessed() {
    this.metrics.totalPDFsProcessed++
  }

  /**
   * Record error
   */
  recordError() {
    this.metrics.errorCount++
  }

  /**
   * Update average response time
   */
  updateAverageResponseTime() {
    if (this.metrics.responseTimes.length === 0) return
    const sum = this.metrics.responseTimes.reduce((a, b) => a + b, 0)
    this.metrics.averageResponseTime = Math.round(sum / this.metrics.responseTimes.length)
  }

  /**
   * Get analytics summary
   */
  getSummary() {
    const uptime = new Date() - this.metrics.startTime
    const cacheHitRate =
      this.metrics.cacheHits + this.metrics.cacheMisses === 0
        ? 0
        : Math.round((this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100)

    return {
      totalQueries: this.metrics.totalQueries,
      queriesBySource: this.metrics.queriesBySource,
      cacheStats: {
        hits: this.metrics.cacheHits,
        misses: this.metrics.cacheMisses,
        hitRate: `${cacheHitRate}%`,
      },
      pdfStats: {
        uploaded: this.metrics.totalPDFsUploaded,
        processed: this.metrics.totalPDFsProcessed,
      },
      performance: {
        averageResponseTimeMs: this.metrics.averageResponseTime,
        errorCount: this.metrics.errorCount,
      },
      uptime: `${Math.round(uptime / 1000 / 60)} minutes`,
    }
  }

  /**
   * Reset analytics
   */
  reset() {
    this.metrics = {
      totalQueries: 0,
      queriesBySource: { realtime: 0, rag: 0, llm: 0 },
      cacheHits: 0,
      cacheMisses: 0,
      totalPDFsUploaded: 0,
      totalPDFsProcessed: 0,
      averageResponseTime: 0,
      errorCount: 0,
      responseTimes: [],
      startTime: new Date(),
    }
  }
}

export default new Analytics()
