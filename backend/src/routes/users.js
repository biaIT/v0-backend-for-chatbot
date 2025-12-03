/**
 * User Management Routes (Admin)
 * GET /admin/users - List all users
 * POST /admin/users/:id/approve - Approve user
 * POST /admin/users/:id/reject - Reject user
 * POST /admin/users/:id/promote - Promote user to admin
 * GET /admin/users/:id/logs - Get user's query logs
 * GET /admin/users/:id - Get user details
 */

import express from "express"
import { authRequired, adminRequired } from "../middleware/authMiddleware.js"
import { PrismaClient } from "@prisma/client"
import { createLogger } from "../utils/logger.js"

const router = express.Router()
const prisma = new PrismaClient()
const logger = createLogger()

// Protect all routes with auth and admin requirement
router.use(authRequired, adminRequired)

/**
 * GET /admin/users
 * List all users with pagination
 */
router.get("/admin/users", async (req, res, next) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const status = req.query.status // pending, approved, rejected

    const where = status ? { status } : {}

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
          approvedAt: true,
          rejectedAt: true,
          totalQueries: true,
          totalPdfUploads: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ])

    res.json({
      success: true,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      users,
    })
  } catch (error) {
    logger.error(`Get users error: ${error.message}`)
    res.status(500).json({ error: "Failed to fetch users" })
  }
})

/**
 * GET /admin/users/:id
 * Get user details and statistics
 */
router.get("/admin/users/:id", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatarUrl: true,
        role: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
        lastActiveAt: true,
        approvedAt: true,
        rejectedAt: true,
        totalQueries: true,
        totalPdfUploads: true,
      },
    })

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    // Get document count
    const documentCount = await prisma.document.count({
      where: { userId: user.id },
    })

    res.json({
      success: true,
      user: {
        ...user,
        documentCount,
      },
    })
  } catch (error) {
    logger.error(`Get user error: ${error.message}`)
    res.status(500).json({ error: "Failed to fetch user" })
  }
})

/**
 * POST /admin/users/:id/approve
 * Approve pending user
 */
router.post("/admin/users/:id/approve", async (req, res, next) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        status: "approved",
        approvedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        status: true,
        approvedAt: true,
      },
    })

    logger.info(`User approved by admin: ${user.email}`)

    res.json({
      success: true,
      message: `User ${user.email} approved`,
      user,
    })
  } catch (error) {
    logger.error(`Approve user error: ${error.message}`)
    res.status(500).json({ error: "Failed to approve user" })
  }
})

/**
 * POST /admin/users/:id/reject
 * Reject pending user
 */
router.post("/admin/users/:id/reject", async (req, res, next) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        status: "rejected",
        rejectedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        status: true,
        rejectedAt: true,
      },
    })

    logger.info(`User rejected by admin: ${user.email}`)

    res.json({
      success: true,
      message: `User ${user.email} rejected`,
      user,
    })
  } catch (error) {
    logger.error(`Reject user error: ${error.message}`)
    res.status(500).json({ error: "Failed to reject user" })
  }
})

/**
 * POST /admin/users/:id/promote
 * Promote user to admin
 */
router.post("/admin/users/:id/promote", async (req, res, next) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        role: "admin",
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    })

    logger.info(`User promoted to admin: ${user.email}`)

    res.json({
      success: true,
      message: `User ${user.email} promoted to admin`,
      user,
    })
  } catch (error) {
    logger.error(`Promote user error: ${error.message}`)
    res.status(500).json({ error: "Failed to promote user" })
  }
})

/**
 * GET /admin/users/:id/logs
 * Get query logs for a specific user
 */
router.get("/admin/users/:id/logs", async (req, res, next) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 20

    const [logs, total] = await Promise.all([
      prisma.queryLog.findMany({
        where: { userId: req.params.id },
        select: {
          id: true,
          question: true,
          answer: true,
          intent: true,
          sourceType: true,
          confidenceScore: true,
          durationMs: true,
          createdAt: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.queryLog.count({
        where: { userId: req.params.id },
      }),
    ])

    res.json({
      success: true,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      logs,
    })
  } catch (error) {
    logger.error(`Get user logs error: ${error.message}`)
    res.status(500).json({ error: "Failed to fetch user logs" })
  }
})

export default router
