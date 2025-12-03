/**
 * Examples and Test Queries Route
 * GET /api/examples/queries - Returns sample queries for testing
 * GET /api/examples/stats - Statistics about test data
 */

import express from "express"
import { createLogger } from "../utils/logger.js"

const router = express.Router()
const logger = createLogger()

// Sample test queries categorized by type
const SAMPLE_QUERIES = [
  // Real-time Weather Queries
  {
    category: "realtime-weather",
    queries: [
      "What's the weather like right now?",
      "Is it raining in New York?",
      "What's the temperature in London?",
      "Will it snow tomorrow?",
      "How hot is it in Tokyo?",
      "Weather forecast for Paris",
    ],
  },

  // Real-time News Queries
  {
    category: "realtime-news",
    queries: [
      "What are the latest news headlines?",
      "Tell me about breaking news today",
      "What's trending right now?",
      "Current events happening",
      "What are today's top stories?",
    ],
  },

  // Real-time Currency Queries
  {
    category: "realtime-currency",
    queries: [
      "What's the USD to EUR exchange rate?",
      "How much is Bitcoin worth today?",
      "Convert 100 dollars to euros",
      "What's the current gold price?",
      "EUR to GBP conversion rate",
    ],
  },

  // RAG/Knowledge Base Queries
  {
    category: "rag-knowledge",
    queries: [
      "Explain artificial intelligence",
      "Tell me about machine learning",
      "What is blockchain technology?",
      "How does deep learning work?",
      "Define data science",
      "What is cloud computing?",
    ],
  },

  // Multi-source Queries (combine realtime + RAG)
  {
    category: "multi-source",
    queries: [
      "What's the weather in Paris and tell me about the Eiffel Tower",
      "Current Bitcoin price and explain cryptocurrency",
      "Latest news about artificial intelligence",
      "Tell me about machine learning and how weather AI works",
    ],
  },

  // General Conversation
  {
    category: "general",
    queries: ["Hello, how are you?", "Hi there!", "Thanks for your help", "Can you help me?", "What can you do?"],
  },

  // Stress Test Queries
  {
    category: "stress-test",
    queries: [
      "Weather in NYC and news and exchange rate and machine learning explanation",
      "Tell me everything: weather, news, currency, and AI concepts",
      "Multiple questions at once: weather + blockchain + latest headlines",
    ],
  },
]

/**
 * Get sample queries for testing
 */
router.get("/examples/queries", (req, res) => {
  try {
    const { category } = req.query

    if (category) {
      const found = SAMPLE_QUERIES.find((q) => q.category === category)
      if (found) {
        return res.json({
          category: found.category,
          queries: found.queries,
          count: found.queries.length,
        })
      }
      return res.status(404).json({ error: "Category not found" })
    }

    res.json({
      total: SAMPLE_QUERIES.length,
      categories: SAMPLE_QUERIES.map((q) => ({
        category: q.category,
        count: q.queries.length,
      })),
      queries: SAMPLE_QUERIES,
    })
  } catch (err) {
    logger.error("Error fetching examples:", err)
    res.status(500).json({ error: "Failed to fetch examples" })
  }
})

/**
 * Get statistics about sample data
 */
router.get("/examples/stats", (req, res) => {
  try {
    const stats = {
      totalCategories: SAMPLE_QUERIES.length,
      totalQueries: SAMPLE_QUERIES.reduce((sum, q) => sum + q.queries.length, 0),
      categories: SAMPLE_QUERIES.map((q) => ({
        name: q.category,
        count: q.queries.length,
        examples: q.queries.slice(0, 2),
      })),
    }

    res.json(stats)
  } catch (err) {
    logger.error("Error fetching example stats:", err)
    res.status(500).json({ error: "Failed to fetch statistics" })
  }
})

export default router
