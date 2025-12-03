/**
 * Authentication Middleware
 * Verifies JWT tokens and protects routes
 */

import { verifyToken } from "../services/authService.js"
import { createLogger } from "../utils/logger.js"

const logger = createLogger()

/**
 * Middleware to require authentication
 */
export function authRequired(req, res, next) {
  try {
    // Extract token from Authorization header or cookies
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : req.cookies?.accessToken

    if (!token) {
      return res.status(401).json({
        error: "Authentication required",
        code: "NO_TOKEN",
      })
    }

    // Verify token
    const decoded = verifyToken(token)
    if (!decoded) {
      return res.status(401).json({
        error: "Invalid or expired token",
        code: "INVALID_TOKEN",
      })
    }

    // Attach user info to request
    req.user = decoded
    req.userId = decoded.userId

    next()
  } catch (error) {
    logger.error(`Auth middleware error: ${error.message}`)
    res.status(401).json({ error: "Authentication failed" })
  }
}

/**
 * Middleware to require admin role
 */
export function adminRequired(req, res, next) {
  try {
    if (!req.user || req.user.role !== "admin") {
      logger.warn(`Unauthorized admin access attempt: ${req.userId}`)
      return res.status(403).json({
        error: "Admin access required",
        code: "NOT_ADMIN",
      })
    }

    next()
  } catch (error) {
    logger.error(`Admin middleware error: ${error.message}`)
    res.status(403).json({ error: "Authorization failed" })
  }
}

/**
 * Middleware to require approved account status
 */
export function approvalRequired(req, res, next) {
  try {
    if (!req.user || req.user.status !== "approved") {
      return res.status(403).json({
        error: "Account not approved",
        code: "NOT_APPROVED",
      })
    }

    next()
  } catch (error) {
    logger.error(`Approval middleware error: ${error.message}`)
    res.status(403).json({ error: "Approval check failed" })
  }
}
