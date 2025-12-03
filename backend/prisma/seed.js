/**
 * Database Seed Script
 * Creates sample data for development and testing
 */

import { PrismaClient } from "@prisma/client"
import { hashPassword } from "../src/services/authService.js"

const prisma = new PrismaClient()

async function main() {
  console.log("Starting database seed...")

  try {
    // Clear existing data
    await prisma.queryLog.deleteMany()
    await prisma.document.deleteMany()
    await prisma.refreshToken.deleteMany()
    await prisma.user.deleteMany()

    // Create admin user
    const adminPassword = await hashPassword("admin123")
    const admin = await prisma.user.create({
      data: {
        email: "admin@chatbot.local",
        passwordHash: adminPassword,
        name: "Admin User",
        role: "admin",
        status: "approved",
        approvedAt: new Date(),
      },
    })

    console.log("Created admin user:", admin.email)

    // Create test user (pending approval)
    const userPassword = await hashPassword("password123")
    const testUser1 = await prisma.user.create({
      data: {
        email: "user@chatbot.local",
        passwordHash: userPassword,
        name: "Test User",
        role: "user",
        status: "pending",
      },
    })

    console.log("Created test user (pending):", testUser1.email)

    // Create approved test user
    const approvedUser = await prisma.user.create({
      data: {
        email: "approved@chatbot.local",
        passwordHash: userPassword,
        name: "Approved User",
        role: "user",
        status: "approved",
        approvedAt: new Date(),
        lastLoginAt: new Date(),
        totalQueries: 5,
        totalPdfUploads: 2,
      },
    })

    console.log("Created approved test user:", approvedUser.email)

    // Create sample query logs
    const sampleQueries = [
      {
        userId: approvedUser.id,
        question: "What is the weather like?",
        answer: "The current weather is partly cloudy with a temperature of 22°C.",
        intent: "realtime",
        sourceType: "realtime",
        apiUsed: "open-meteo",
        confidenceScore: 0.95,
        durationMs: 342,
      },
      {
        userId: approvedUser.id,
        question: "Tell me about machine learning",
        answer:
          "Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience.",
        intent: "knowledge",
        sourceType: "rag",
        confidenceScore: 0.87,
        durationMs: 256,
      },
    ]

    for (const query of sampleQueries) {
      await prisma.queryLog.create({ data: query })
    }

    console.log("Created sample query logs")

    // Create sample documents
    const doc1 = await prisma.document.create({
      data: {
        userId: approvedUser.id,
        documentName: "sample-document.pdf",
        size: 2048576,
        pageCount: 12,
        vectorCount: 48,
      },
    })

    console.log("Created sample document:", doc1.documentName)

    console.log("Database seed completed successfully!")
  } catch (error) {
    console.error("Seed error:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
