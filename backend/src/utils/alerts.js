/**
 * Alert System for monitoring critical events
 * Tracks API failures, cache issues, and queue errors
 */

import { createLogger } from "./logger.js"

const logger = createLogger()

export class AlertManager {
  constructor() {
    this.alerts = []
    this.alertConfig = {
      apiFailureThreshold: 5,
      cacheFailureThreshold: 10,
      queueErrorThreshold: 3,
      alertRetentionMs: 24 * 60 * 60 * 1000, // 24 hours
    }
    this.counters = {
      apiFailures: 0,
      cacheFailures: 0,
      queueErrors: 0,
    }
  }

  recordAPIFailure(apiName, error) {
    this.counters.apiFailures++

    const alert = {
      id: `alert_${Date.now()}`,
      type: "api_failure",
      severity: "warning",
      apiName,
      error: error?.message || error,
      timestamp: new Date().toISOString(),
      count: this.counters.apiFailures,
    }

    if (this.counters.apiFailures >= this.alertConfig.apiFailureThreshold) {
      alert.severity = "critical"
      logger.error(`CRITICAL: API ${apiName} has failed ${this.counters.apiFailures} times`, error)
    }

    this.alerts.push(alert)
    this.cleanupOldAlerts()
    return alert
  }

  recordCacheTTLExpiry(key, ttl) {
    const alert = {
      id: `alert_${Date.now()}`,
      type: "cache_ttl_expiry",
      severity: "info",
      key,
      ttlSeconds: ttl,
      timestamp: new Date().toISOString(),
    }

    this.alerts.push(alert)
    this.cleanupOldAlerts()
    return alert
  }

  recordQueueError(jobId, error) {
    this.counters.queueErrors++

    const alert = {
      id: `alert_${Date.now()}`,
      type: "queue_error",
      severity: this.counters.queueErrors >= this.alertConfig.queueErrorThreshold ? "critical" : "warning",
      jobId,
      error: error?.message || error,
      timestamp: new Date().toISOString(),
      count: this.counters.queueErrors,
    }

    this.alerts.push(alert)
    this.cleanupOldAlerts()
    return alert
  }

  // Get recent alerts
  getRecentAlerts(limit = 50) {
    return this.alerts.slice(-limit).reverse()
  }

  // Get critical alerts only
  getCriticalAlerts() {
    return this.alerts.filter((a) => a.severity === "critical").slice(-20)
  }

  // Clear alerts
  clearAlerts() {
    this.alerts = []
    this.counters = { apiFailures: 0, cacheFailures: 0, queueErrors: 0 }
  }

  // Cleanup alerts older than retention period
  cleanupOldAlerts() {
    const cutoff = Date.now() - this.alertConfig.alertRetentionMs
    this.alerts = this.alerts.filter((a) => new Date(a.timestamp).getTime() > cutoff)
  }

  // Get alert summary
  getSummary() {
    return {
      totalAlerts: this.alerts.length,
      criticalAlerts: this.alerts.filter((a) => a.severity === "critical").length,
      warningAlerts: this.alerts.filter((a) => a.severity === "warning").length,
      infoAlerts: this.alerts.filter((a) => a.severity === "info").length,
      counters: this.counters,
    }
  }
}

export default new AlertManager()
