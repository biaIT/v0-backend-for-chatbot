/**
 * Response Merger Service
 * Intelligently combines responses from multiple sources (realtime, RAG, LLM)
 */

import { createLogger } from "../utils/logger.js"

const logger = createLogger()

export class ResponseMerger {
  /**
   * Merge responses from multiple sources
   * Sources: { realtime?: {...}, rag?: {...}, pdf?: {...}, llm: {...} }
   */
  static async mergeResponses(sources, query, intent) {
    const merged = {
      primaryResponse: "",
      sourceDetails: [],
      confidenceScore: 0,
      usedSources: [],
    }

    // Priority order based on intent
    let priorityOrder = []
    if (intent === "realtime") {
      priorityOrder = ["realtime", "rag", "pdf", "llm"]
    } else if (intent === "rag" || intent === "pdf") {
      priorityOrder = ["pdf", "rag", "realtime", "llm"]
    } else {
      priorityOrder = ["llm", "rag", "pdf", "realtime"]
    }

    let highestConfidence = 0
    let primarySource = null

    // Find best source
    for (const source of priorityOrder) {
      if (sources[source] && sources[source].success) {
        primarySource = source
        highestConfidence = sources[source].confidence || 0.8
        break
      }
    }

    // Build merged response
    if (primarySource && sources[primarySource]) {
      merged.primaryResponse = sources[primarySource].content
      merged.usedSources.push(primarySource)
      merged.confidenceScore = highestConfidence

      // Add source details
      merged.sourceDetails.push({
        source: primarySource,
        confidence: highestConfidence,
        metadata: sources[primarySource].metadata || {},
      })
    }

    // Add supplementary information from other sources
    for (const source of priorityOrder) {
      if (source !== primarySource && sources[source] && sources[source].success) {
        merged.sourceDetails.push({
          source,
          confidence: sources[source].confidence || 0.6,
          content: sources[source].content.substring(0, 100) + "...", // Preview
          metadata: sources[source].metadata || {},
        })
        merged.usedSources.push(source)
      }
    }

    logger.info(`Responses merged: primary=${primarySource}, confidence=${merged.confidenceScore}`)

    return merged
  }

  /**
   * Format final response for frontend
   */
  static formatResponse(mergedData) {
    return {
      reply: mergedData.primaryResponse,
      confidenceScore: mergedData.confidenceScore,
      sources: mergedData.sourceDetails.map((detail) => ({
        source: detail.source,
        confidence: detail.confidence,
        metadata: detail.metadata,
      })),
      timestamp: new Date().toISOString(),
    }
  }
}

export default ResponseMerger
