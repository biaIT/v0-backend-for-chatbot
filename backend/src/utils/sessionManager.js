/**
 * Session Manager
 * Handles multi-user sessions with isolation
 */

import { v4 as uuidv4 } from "uuid"
import { createLogger } from "./logger.js"

const logger = createLogger()

// In-memory session store (can be replaced with Redis)
const sessions = new Map()
const userDocuments = new Map() // userId -> Set of document IDs

export class SessionManager {
  /**
   * Create a new session for a user
   */
  static createSession(userId = null) {
    const sessionId = uuidv4()
    const userId_ = userId || `user_${Date.now()}`

    const session = {
      sessionId,
      userId: userId_,
      createdAt: new Date(),
      lastActivity: new Date(),
      documents: [],
      metadata: {},
    }

    sessions.set(sessionId, session)
    logger.info(`Session created: ${sessionId} for user: ${userId_}`)

    return sessionId
  }

  /**
   * Get session data
   */
  static getSession(sessionId) {
    const session = sessions.get(sessionId)
    if (session) {
      session.lastActivity = new Date()
    }
    return session
  }

  /**
   * Add document to user's session
   */
  static addDocument(sessionId, documentId, metadata = {}) {
    const session = this.getSession(sessionId)
    if (!session) return null

    session.documents.push({
      documentId,
      addedAt: new Date(),
      metadata,
    })

    logger.info(`Document ${documentId} added to session ${sessionId}`)
    return session
  }

  /**
   * Get user's documents (isolated per session)
   */
  static getUserDocuments(sessionId) {
    const session = this.getSession(sessionId)
    return session ? session.documents : []
  }

  /**
   * Verify document belongs to session
   */
  static verifyDocumentAccess(sessionId, documentId) {
    const session = this.getSession(sessionId)
    if (!session) return false

    return session.documents.some((doc) => doc.documentId === documentId)
  }

  /**
   * Delete session
   */
  static deleteSession(sessionId) {
    const session = sessions.get(sessionId)
    if (session) {
      sessions.delete(sessionId)
      logger.info(`Session deleted: ${sessionId}`)
    }
  }

  /**
   * Get all sessions (for monitoring)
   */
  static getAllSessions() {
    return Array.from(sessions.values())
  }

  /**
   * Cleanup expired sessions (older than 24 hours)
   */
  static cleanupExpiredSessions() {
    const now = new Date()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours

    let cleaned = 0
    for (const [sessionId, session] of sessions.entries()) {
      if (now - session.lastActivity > maxAge) {
        sessions.delete(sessionId)
        cleaned++
      }
    }

    if (cleaned > 0) {
      logger.info(`Cleaned up ${cleaned} expired sessions`)
    }
    return cleaned
  }
}

export default SessionManager
