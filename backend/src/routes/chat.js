import express from "express"
import { detectIntent, getIntentSystemPrompt } from "../services/intentDetector.js"
import { fetchLiveData } from "../services/realtime.js"
import { queryVectorStore } from "../services/rag.js"
import { queryPDFDocuments } from "../services/pdfProcessor.js"
import { generateResponse } from "../services/llm.js"
import { ResponseMerger } from "../services/responseMerger.js"
import { createLogger } from "../utils/logger.js"
import { authRequired, approvalRequired } from "../middleware/authMiddleware.js"
import { PrismaClient } from "@prisma/client"
import analytics from "../utils/analytics.js"

const router = express.Router()
const prisma = new PrismaClient()
const logger = createLogger()

router.post("/chat", authRequired, approvalRequired, async (req, res, next) => {
  const startTime = Date.now()

  try {
    const { message } = req.body
    const sessionId = req.sessionId
    const userId = req.userId // Get userId from auth middleware

    // Validate input
    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Message is required and must be a string",
      })
    }

    logger.info(`Chat request from user ${userId}: ${message.substring(0, 50)}...`)

    const intentResult = detectIntent(message)
    const intent = intentResult.intent
    const intentType = intentResult.type

    const context = ""
    const sources = {}
    const sourceDetails = {}

    // Fetch data from multiple sources based on intent
    try {
      // 1. Check for real-time data
      if (intent === "realtime") {
        logger.info(`Real-time query detected (${intentType})`)
        const liveData = await fetchLiveData(message, intentType)
        sources.realtime = {
          success: true,
          content: JSON.stringify(liveData),
          confidence: intentResult.confidence,
          metadata: {
            type: intentType,
            cached: liveData.cached || false,
            apiUsed: liveData.apiUsed,
          },
        }
      }
    } catch (error) {
      logger.warn(`Real-time API error: ${error.message}`)
      sources.realtime = { success: false }
    }

    try {
      // 2. Query user's uploaded PDFs (higher priority)
      const userDocs = await queryPDFDocuments(message, userId, 5) // Use userId instead of sessionId
      if (userDocs.length > 0) {
        logger.info(`Found ${userDocs.length} PDF results`)
        sources.pdf = {
          success: true,
          content: userDocs.map((doc) => doc.content).join("\n"),
          confidence: 0.9,
          metadata: {
            documentsFound: userDocs.length,
            documents: userDocs.map((d) => ({ filename: d.filename, chunkId: d.chunkId })),
          },
        }
      }
    } catch (error) {
      logger.warn(`PDF query error: ${error.message}`)
    }

    try {
      // 3. Query general RAG knowledge base
      const ragResults = await queryVectorStore(message)
      if (ragResults.length > 0) {
        logger.info(`Found ${ragResults.length} RAG results`)
        sources.rag = {
          success: true,
          content: ragResults.map((doc) => doc.content).join("\n"),
          confidence: 0.8,
          metadata: {
            documentsFound: ragResults.length,
          },
        }
      }
    } catch (error) {
      logger.warn(`RAG query error: ${error.message}`)
    }

    // 4. Get merged context and merge responses
    const merged = await ResponseMerger.mergeResponses(sources, message, intent)

    // If we have context, use it for LLM generation
    const systemPrompt = getIntentSystemPrompt(intent)
    const contextForLLM =
      merged.primaryResponse ||
      Object.values(sources)
        .filter((s) => s.success)
        .map((s) => s.content)
        .join("\n")

    // 5. Generate final response using LLM
    const reply = await generateResponse(contextForLLM, message, systemPrompt)

    const responseTime = Date.now() - startTime
    const sourceType = merged.usedSources.length > 1 ? "hybrid" : merged.usedSources[0]

    await prisma.queryLog.create({
      data: {
        userId,
        question: message,
        answer: reply,
        intent: intentResult.type,
        sourceType,
        apiUsed: sources.realtime?.metadata?.apiUsed || null,
        confidenceScore: merged.confidenceScore,
        durationMs: responseTime,
        documentsUsed: sources.pdf?.metadata?.documents?.map((d) => d.filename) || [],
      },
    })

    await prisma.user.update({
      where: { id: userId },
      data: {
        totalQueries: { increment: 1 },
        lastActiveAt: new Date(),
      },
    })

    // Record analytics
    analytics.recordQuery(intent, responseTime)
    if (merged.sourceDetails.length > 0) {
      analytics.recordCacheEvent(sources.realtime?.metadata?.cached)
    }

    logger.info(`Chat response generated (${responseTime}ms, sources: ${merged.usedSources.join(", ")})`)

    res.json({
      reply,
      intent,
      sources: merged.sourceDetails,
      confidenceScore: merged.confidenceScore,
      sessionId,
      userId, // Include userId in response
      timestamp: new Date().toISOString(),
      responseTime,
    })
  } catch (error) {
    logger.error(`Chat error: ${error.message}`, error)
    analytics.recordError()
    next(error)
  }
})

export default router
