/**
 * Advanced Rate Limiter with Dynamic Thresholds
 * Per-user, per-session, and per-IP rate limiting with adaptive adjustments
 */

import { createLogger } from "./logger.js"

const logger = createLogger()

export class AdvancedRateLimiter {
  constructor() {
    this.limits = {
      perUser: {
        requests: 100,
        window: 60 * 60 * 1000, // 1 hour
      },
      perSession: {
        requests: 50,
        window: 60 * 60 * 1000, // 1 hour
      },
      perIP: {
        requests: 500,
        window: 60 * 60 * 1000, // 1 hour
      },
    }

    this.trackers = {
      byUser: new Map(),
      bySession: new Map(),
      byIP: new Map(),
    }

    this.blocklist = new Map()
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000)
  }

  checkLimit(identifier, type = "session") {
    const tracker = this.trackers[`by${type.charAt(0).toUpperCase() + type.slice(1)}`]
    const limit = this.limits[`per${type.charAt(0).toUpperCase() + type.slice(1)}`]

    if (!tracker || !limit) {
      return { allowed: true, remaining: Number.POSITIVE_INFINITY }
    }

    const now = Date.now()
    let record = tracker.get(identifier)

    if (!record || now - record.firstRequest > limit.window) {
      record = {
        requests: 0,
        firstRequest: now,
        dynamic: limit.requests,
      }
    }

    record.requests++
    tracker.set(identifier, record)

    const allowed = record.requests <= record.dynamic

    if (!allowed) {
      logger.warn(`Rate limit exceeded for ${type}: ${identifier}`)
      this.addToBlocklist(identifier, 5 * 60 * 1000) // 5 min block
    }

    return {
      allowed,
      remaining: Math.max(0, record.dynamic - record.requests),
      retryAfter: !allowed ? 300 : null,
    }
  }

  addToBlocklist(identifier, durationMs = 60 * 60 * 1000) {
    this.blocklist.set(identifier, Date.now() + durationMs)
    logger.info(`Added to blocklist: ${identifier} for ${durationMs}ms`)
  }

  isBlocked(identifier) {
    const blockTime = this.blocklist.get(identifier)
    if (!blockTime) return false

    if (blockTime < Date.now()) {
      this.blocklist.delete(identifier)
      return false
    }

    return true
  }

  adjustLimitsBasedOnLoad(cpuUsage, memoryUsage) {
    const highLoad = cpuUsage > 80 || memoryUsage > 85

    if (highLoad) {
      // Reduce limits under high load
      this.limits.perSession.requests = 25
      this.limits.perUser.requests = 50
      logger.warn("Rate limits reduced due to high system load")
    } else {
      // Restore normal limits
      this.limits.perSession.requests = 50
      this.limits.perUser.requests = 100
    }
  }

  cleanup() {
    const now = Date.now()

    for (const [key, record] of this.trackers.bySession.entries()) {
      if (now - record.firstRequest > this.limits.perSession.window) {
        this.trackers.bySession.delete(key)
      }
    }

    for (const [key, blockTime] of this.blocklist.entries()) {
      if (blockTime < now) {
        this.blocklist.delete(key)
      }
    }
  }

  getStats() {
    return {
      activeSessionLimits: this.trackers.bySession.size,
      activeUserLimits: this.trackers.byUser.size,
      activeIPLimits: this.trackers.byIP.size,
      blockedIdentifiers: this.blocklist.size,
      limits: this.limits,
    }
  }

  destroy() {
    clearInterval(this.cleanupInterval)
  }
}

export default new AdvancedRateLimiter()
