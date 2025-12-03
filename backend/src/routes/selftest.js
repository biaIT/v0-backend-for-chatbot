/**
 * Self-Test Route
 * Runs core tests and returns summary
 * GET /api/selftest
 */

import express from "express"
import { createLogger } from "../utils/logger.js"
import { SessionManager } from "../utils/sessionManager.js"
import { getAnalytics } from "../utils/analytics.js"

const router = express.Router()
const logger = createLogger()

/**
 * Run self-tests
 */
router.get("/selftest", async (req, res) => {
  const results = {
    timestamp: new Date().toISOString(),
    passed: 0,
    failed: 0,
    tests: [],
  }

  try {
    // Test 1: Session Management
    try {
      const sessionId = SessionManager.createSession()
      const session = SessionManager.getSession(sessionId)

      if (session && session.id === sessionId) {
        results.tests.push({ name: "Session Management", status: "passed" })
        results.passed++
      } else {
        throw new Error("Session not found")
      }
    } catch (err) {
      results.tests.push({ name: "Session Management", status: "failed", error: err.message })
      results.failed++
    }

    // Test 2: Analytics
    try {
      const analytics = getAnalytics()

      if (analytics && typeof analytics === "object") {
        results.tests.push({ name: "Analytics Service", status: "passed" })
        results.passed++
      } else {
        throw new Error("Analytics returned invalid data")
      }
    } catch (err) {
      results.tests.push({ name: "Analytics Service", status: "failed", error: err.message })
      results.failed++
    }

    // Test 3: Environment Variables
    try {
      const requiredVars = ["OPENAI_API_KEY", "GROQ_API_KEY"]
      const availableVars = requiredVars.filter((v) => process.env[v])

      if (availableVars.length > 0) {
        results.tests.push({
          name: "API Keys Configuration",
          status: "passed",
          note: `${availableVars.length} key(s) configured`,
        })
        results.passed++
      } else {
        throw new Error("No API keys configured")
      }
    } catch (err) {
      results.tests.push({ name: "API Keys Configuration", status: "failed", error: err.message })
      results.failed++
    }

    // Test 4: Memory Usage
    try {
      const memUsage = process.memoryUsage()

      if (memUsage.heapUsed < 500 * 1024 * 1024) {
        // Less than 500MB
        results.tests.push({
          name: "Memory Health",
          status: "passed",
          note: `Heap: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        })
        results.passed++
      } else {
        results.tests.push({
          name: "Memory Health",
          status: "warning",
          note: `High heap usage: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        })
      }
    } catch (err) {
      results.tests.push({ name: "Memory Health", status: "failed", error: err.message })
      results.failed++
    }

    results.summary = `${results.passed} passed, ${results.failed} failed out of ${results.tests.length} tests`

    res.json(results)
  } catch (err) {
    logger.error("Self-test error:", err)
    res.status(500).json({
      error: "Self-test failed",
      timestamp: new Date().toISOString(),
    })
  }
})

export default router
