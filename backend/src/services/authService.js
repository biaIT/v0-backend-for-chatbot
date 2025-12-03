/**
 * Authentication Service
 * Handles user registration, login, token management, and password hashing
 */

import bcryptjs from "bcryptjs"
import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"
import { createLogger } from "../utils/logger.js"

const prisma = new PrismaClient()
const logger = createLogger()

// JWT Configuration
const ACCESS_TOKEN_EXPIRY = "15m"
const REFRESH_TOKEN_EXPIRY = "7d"
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password) {
  return await bcryptjs.hash(password, 10)
}

/**
 * Compare password with hash
 */
export async function comparePassword(password, hash) {
  return await bcryptjs.compare(password, hash)
}

/**
 * Generate JWT access token
 */
export function generateAccessToken(userId, role) {
  return jwt.sign({ userId, role }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  })
}

/**
 * Generate JWT refresh token
 */
export function generateRefreshToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  })
}

/**
 * Verify JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

/**
 * Register a new user
 */
export async function registerUser(email, password, name) {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw new Error("User already exists")
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user with status "pending"
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        status: "pending", // Requires admin approval
      },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        createdAt: true,
      },
    })

    logger.info(`User registered: ${email}`)
    return user
  } catch (error) {
    logger.error(`Registration error: ${error.message}`)
    throw error
  }
}

/**
 * Login user
 */
export async function loginUser(email, password) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      throw new Error("Invalid credentials")
    }

    // Check if user is approved
    if (user.status !== "approved") {
      throw new Error(`Account is ${user.status}`)
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash)
    if (!isPasswordValid) {
      throw new Error("Invalid credentials")
    }

    // Update lastLoginAt and lastActiveAt
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastActiveAt: new Date(),
      },
    })

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.role)
    const refreshToken = generateRefreshToken(user.id)

    // Store refresh token in DB
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    })

    logger.info(`User logged in: ${email}`)

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
      },
      accessToken,
      refreshToken,
    }
  } catch (error) {
    logger.error(`Login error: ${error.message}`)
    throw error
  }
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken) {
  try {
    // Verify refresh token
    const decoded = verifyToken(refreshToken)
    if (!decoded) {
      throw new Error("Invalid refresh token")
    }

    // Check if token exists in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    })

    if (!storedToken || new Date() > storedToken.expiresAt) {
      throw new Error("Refresh token expired")
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    })

    if (!user || user.status !== "approved") {
      throw new Error("User not found or not approved")
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user.id, user.role)

    logger.info(`Token refreshed for user: ${user.email}`)

    return {
      accessToken: newAccessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
      },
    }
  } catch (error) {
    logger.error(`Token refresh error: ${error.message}`)
    throw error
  }
}

/**
 * Logout user (delete refresh token)
 */
export async function logoutUser(refreshToken) {
  try {
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      })
    }
    logger.info("User logged out")
    return true
  } catch (error) {
    logger.error(`Logout error: ${error.message}`)
    return false
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        phone: true,
        role: true,
        status: true,
        totalQueries: true,
        totalPdfUploads: true,
        lastLoginAt: true,
        createdAt: true,
      },
    })

    if (!user) {
      throw new Error("User not found")
    }

    return user
  } catch (error) {
    logger.error(`Get user error: ${error.message}`)
    throw error
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId, updates) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: updates,
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        phone: true,
        role: true,
        status: true,
      },
    })

    logger.info(`User profile updated: ${user.email}`)
    return user
  } catch (error) {
    logger.error(`Update profile error: ${error.message}`)
    throw error
  }
}
