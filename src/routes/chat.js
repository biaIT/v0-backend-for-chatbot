import express from "express"
import { generateChatResponse } from "../services/llm.js"
import { queryVectorStore } from "../services/rag.js"
import { isRealtimeQuestion, fetchLiveData } from "../services/realtime.js"
import { logger } from "../utils/logger.js"

const router = express.Router()

/**
 * POST /api/chat
 * Main chat endpoint that processes user messages with RAG + real-time data
 *
 * Request body:
 * {
 *   "message": "What's the weather in New York?"
 * }
 *
 * Response:
 * {
 *   "reply": "...",
 *   "source": "realtime" | "rag",
 *   "context": {...},
 *   "timestamp": "..."
 * }
 */
router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body

    // Validate input
    if (!message || message.trim().length === 0) {
      logger.warn("Empty message received")
      return res.status(400).json({ error: "Message cannot be empty" })
    }

    logger.info(`Processing chat request: ${message.substring(0, 50)}...`)

    // Check if this is a real-time question
    const isRealtime = await isRealtimeQuestion(message)
    logger.debug(`Message classified as: ${isRealtime ? "real-time" : "RAG"}`)

    let context = {}
    let source = "rag"

    // Fetch data based on classification
    if (isRealtime) {
      logger.info("Fetching real-time data...")
      context = await fetchLiveData(message)
      source = "realtime"
    } else {
      logger.info("Querying RAG vector store...")
      context = await queryVectorStore(message)
      source = "rag"
    }

    // Generate response using LLM
    logger.info("Generating LLM response...")
    const reply = await generateChatResponse(message, context)

    // Prepare response
    const response = {
      reply,
      source,
      context: source === "realtime" ? context : { documents: context.documents?.length || 0 },
      timestamp: new Date().toISOString(),
    }

    logger.info(`Chat response generated successfully`, { source, messageLength: message.length })

    res.status(200).json(response)
  } catch (error) {
    logger.error("Error processing chat request", { error: error.message, stack: error.stack })
    res.status(500).json({
      error: "Failed to process chat request",
      message: process.env.NODE_ENV === "development" ? error.message : "An error occurred",
    })
  }
})

/**
 * GET /api/chat/history
 * Placeholder for chat history endpoint
 */
router.get("/chat/history", (req, res) => {
  try {
    logger.info("Chat history requested")
    // TODO: Implement chat history retrieval
    res.status(200).json({
      history: [],
      message: "Chat history feature coming soon",
    })
  } catch (error) {
    logger.error("Error fetching chat history", { error: error.message })
    res.status(500).json({ error: "Failed to fetch chat history" })
  }
})

export default router
