/**
 * Rate Limiting Utility
 * Provides per-user and per-IP rate limiting to prevent API abuse
 */

import rateLimit from "express-rate-limit"
import redis from "redis"
import { createLogger } from "./logger.js"

const logger = createLogger()

// Initialize Redis client (optional, falls back to memory store)
let redisClient = null
try {
  redisClient = redis.createClient({
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
  })
  redisClient.connect()
} catch (err) {
  logger.warn("Redis not available, using memory store for rate limiting")
}

// Global rate limiter: 100 requests per 15 minutes
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
})

// Chat endpoint limiter: 30 requests per minute per user
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => {
    // Use session ID if available, otherwise use IP
    return req.session?.userId || req.ip
  },
  skip: (req) => {
    // Don't rate limit health checks
    return req.path === "/health"
  },
  message: "Too many chat requests, please wait before sending another message.",
})

// PDF upload limiter: 5 uploads per hour per user
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.session?.userId || req.ip,
  message: "Too many PDF uploads, please try again later.",
})

// API key validation
export function validateApiKeys() {
  const requiredKeys = ["OPENAI_API_KEY", "GROQ_API_KEY"]
  const missingKeys = requiredKeys.filter((key) => !process.env[key])

  if (missingKeys.length > 0) {
    logger.warn(`Missing API keys: ${missingKeys.join(", ")}`)
    return {
      valid: false,
      warning: `Some API keys are missing: ${missingKeys.join(", ")}`,
    }
  }

  return { valid: true }
}

// Validate uploaded PDF
export function validatePDF(file) {
  const maxSizeMB = Number.parseInt(process.env.MAX_PDF_SIZE_MB || "10")
  const maxSizeBytes = maxSizeMB * 1024 * 1024

  // Check file size
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `PDF size exceeds ${maxSizeMB}MB limit`,
    }
  }

  // Check file type
  if (file.mimetype !== "application/pdf") {
    return {
      valid: false,
      error: "Only PDF files are allowed",
    }
  }

  return { valid: true }
}
