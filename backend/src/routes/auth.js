/**
 * Authentication Routes
 * POST /auth/register - Register new user
 * POST /auth/login - Login user
 * POST /auth/logout - Logout user
 * POST /auth/refresh - Refresh access token
 * GET /auth/me - Get current user profile
 * PUT /auth/profile - Update user profile
 */

import express from "express"
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getUserById,
  updateUserProfile,
} from "../services/authService.js"
import { authRequired, approvalRequired } from "../middleware/authMiddleware.js"
import { createLogger } from "../utils/logger.js"

const router = express.Router()
const logger = createLogger()

/**
 * POST /auth/register
 * Register a new user (status = pending, needs admin approval)
 */
router.post("/register", async (req, res, next) => {
  try {
    const { email, password, name } = req.body

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        error: "Email, password, and name are required",
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters",
      })
    }

    const user = await registerUser(email, password, name)

    res.status(201).json({
      success: true,
      message: "User registered successfully. Waiting for admin approval.",
      user,
    })
  } catch (error) {
    logger.error(`Register error: ${error.message}`)
    res.status(400).json({
      error: error.message || "Registration failed",
    })
  }
})

/**
 * POST /auth/login
 * Login user and return access + refresh tokens
 */
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      })
    }

    const result = await loginUser(email, password)

    // Set HTTP-only cookies
    res.cookie("accessToken", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    })

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })

    res.json({
      success: true,
      user: result.user,
      accessToken: result.accessToken,
    })
  } catch (error) {
    logger.error(`Login error: ${error.message}`)
    res.status(401).json({
      error: error.message || "Login failed",
    })
  }
})

/**
 * POST /auth/logout
 * Logout user and invalidate refresh token
 */
router.post("/logout", authRequired, async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken

    await logoutUser(refreshToken)

    // Clear cookies
    res.clearCookie("accessToken")
    res.clearCookie("refreshToken")

    res.json({
      success: true,
      message: "Logged out successfully",
    })
  } catch (error) {
    logger.error(`Logout error: ${error.message}`)
    res.status(500).json({
      error: "Logout failed",
    })
  }
})

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
router.post("/refresh", async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken

    if (!refreshToken) {
      return res.status(401).json({
        error: "Refresh token required",
      })
    }

    const result = await refreshAccessToken(refreshToken)

    // Update access token cookie
    res.cookie("accessToken", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    })

    res.json({
      success: true,
      accessToken: result.accessToken,
      user: result.user,
    })
  } catch (error) {
    logger.error(`Refresh error: ${error.message}`)
    res.status(401).json({
      error: error.message || "Token refresh failed",
    })
  }
})

/**
 * GET /auth/me
 * Get current authenticated user profile
 */
router.get("/me", authRequired, approvalRequired, async (req, res, next) => {
  try {
    const user = await getUserById(req.userId)
    res.json({
      success: true,
      user,
    })
  } catch (error) {
    logger.error(`Get profile error: ${error.message}`)
    res.status(404).json({
      error: error.message || "User not found",
    })
  }
})

/**
 * PUT /auth/profile
 * Update user profile
 */
router.put("/profile", authRequired, approvalRequired, async (req, res, next) => {
  try {
    const { name, phone, avatarUrl } = req.body

    const user = await updateUserProfile(req.userId, {
      name: name || undefined,
      phone: phone || undefined,
      avatarUrl: avatarUrl || undefined,
    })

    res.json({
      success: true,
      message: "Profile updated successfully",
      user,
    })
  } catch (error) {
    logger.error(`Update profile error: ${error.message}`)
    res.status(400).json({
      error: error.message || "Profile update failed",
    })
  }
})

export default router
