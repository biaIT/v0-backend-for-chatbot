/**
 * Intent Detection Service
 * Classifies queries into: realtime, rag, or general LLM conversation
 */

import { createLogger } from "../utils/logger.js"
import { predictIntentML } from "../../ml/intentModel.js"
import { extractEntities, scoreConfidenceByEntities } from "../../ml/entityRecognition.js"

const logger = createLogger()

// Keywords for different intent types
const INTENT_PATTERNS = {
  weather: {
    keywords: ["weather", "temperature", "rain", "snow", "sunny", "cloudy", "forecast", "celsius", "fahrenheit"],
    type: "weather",
  },
  news: {
    keywords: ["news", "headlines", "latest", "breaking", "today", "current events", "happening"],
    type: "news",
  },
  currency: {
    keywords: ["exchange", "rate", "currency", "convert", "dollar", "euro", "pound", "price", "forex"],
    type: "currency",
  },
  time: {
    keywords: ["time", "what time", "current time", "now", "o'clock"],
    type: "time",
  },
}

/**
 * Detect query intent (now with ML support and entity recognition)
 * Returns: { intent: 'realtime' | 'rag' | 'general', type?: string, confidence: 0-1, method: 'ml' | 'rule-based', entities: {...} }
 */
export function detectIntent(message) {
  const entities = extractEntities(message)
  const entityScore = scoreConfidenceByEntities(entities)

  const ruleBased = detectIntentRuleBased(message)

  const result = predictIntentML(message, ruleBased)

  result.entities = entities
  result.confidence = result.confidence * 0.7 + entityScore * 0.3

  return result
}

function detectIntentRuleBased(message) {
  const messageLower = message.toLowerCase()
  const scores = {
    realtime: 0,
    rag: 0,
    general: 0,
  }

  // Check for realtime API keywords
  for (const [key, pattern] of Object.entries(INTENT_PATTERNS)) {
    const matchCount = pattern.keywords.filter((keyword) => messageLower.includes(keyword)).length

    if (matchCount > 0) {
      scores.realtime += matchCount
      if (!message._detectedType) {
        message._detectedType = pattern.type
      }
    }
  }

  const ragKeywords = [
    "explain",
    "tell me",
    "what is",
    "how does",
    "describe",
    "definition",
    "concept",
    "learn",
    "understand",
    "about",
  ]
  const ragMatches = ragKeywords.filter((keyword) => messageLower.includes(keyword)).length
  scores.rag += ragMatches

  const generalKeywords = ["hi", "hello", "thanks", "help", "please", "can you", "would you", "could you"]
  const generalMatches = generalKeywords.filter((keyword) => messageLower.includes(keyword)).length
  scores.general += generalMatches

  const maxScore = Math.max(...Object.values(scores))
  let dominantIntent = "general"

  if (scores.realtime === maxScore && scores.realtime > 0) {
    dominantIntent = "realtime"
  } else if (scores.rag === maxScore && scores.rag > 0) {
    dominantIntent = "rag"
  }

  const confidence = maxScore > 0 ? Math.min(maxScore / 3, 1) : 0

  const result = {
    intent: dominantIntent,
    confidence,
    scores,
  }

  if (dominantIntent === "realtime") {
    for (const pattern of Object.values(INTENT_PATTERNS)) {
      if (pattern.keywords.some((kw) => messageLower.includes(kw))) {
        result.type = pattern.type
        break
      }
    }
  }

  return result
}

/**
 * Get intent-specific system prompt
 */
export function getIntentSystemPrompt(intent, type = null) {
  const prompts = {
    realtime: `You are an assistant with access to real-time data APIs. You have current information about weather, news, and exchange rates. 
Always use the provided real-time context to answer questions accurately. Be specific and cite the data source when relevant.`,
    rag: `You are a knowledge-based assistant. You have access to a document database and knowledge base. 
Use the provided documents to answer questions thoroughly and accurately. If information is not in the knowledge base, say so.`,
    general: `You are a friendly and helpful AI assistant. Answer questions conversationally and provide useful information. 
Be concise but informative. If you need more context, ask clarifying questions.`,
  }

  return prompts[intent] || prompts.general
}

/**
 * Determine if PDF query should be prioritized
 */
export function shouldPrioritizePDF(intent, hasUserDocuments) {
  // If user has uploaded PDFs and asks knowledge-based question, prioritize RAG
  return intent === "rag" && hasUserDocuments
}
