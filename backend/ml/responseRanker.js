/**
 * Response Ranking Module
 * Ranks and scores responses from different sources using ML
 */

import { extractEntities } from "./entityRecognition.js"

export function rankResponses(responses, query, intent) {
  const queryEntities = extractEntities(query)

  return responses
    .map((response) => {
      let score = 0

      // Base score from source confidence
      score += (response.confidence || 0.5) * 0.4

      // Match entities with response
      const responseEntities = extractEntities(response.content)
      const entityMatches = Object.keys(queryEntities).reduce((matches, entityType) => {
        const queryEntitiesForType = queryEntities[entityType]
        const responseEntitiesForType = responseEntities[entityType]

        const matchCount = queryEntitiesForType.filter((e) =>
          responseEntitiesForType?.some((re) => re.toLowerCase().includes(e.toLowerCase())),
        ).length

        return matches + matchCount
      }, 0)

      score += Math.min(entityMatches * 0.15, 0.3)

      // Content length factor (reasonable length is better)
      const contentLength = response.content?.length || 0
      if (contentLength > 100 && contentLength < 2000) {
        score += 0.2
      }

      // Intent alignment
      if (response.source === "realtime" && intent === "realtime") score += 0.1
      if (response.source === "pdf" && intent === "rag") score += 0.1
      if (response.source === "rag" && intent === "rag") score += 0.05

      return {
        ...response,
        rankScore: Math.min(score, 1.0),
      }
    })
    .sort((a, b) => b.rankScore - a.rankScore)
}

export function getTopRankedResponse(responses) {
  if (responses.length === 0) return null

  const ranked = rankResponses(responses, "", "general")

  // Return top response, but ensure minimum quality threshold
  const topResponse = ranked[0]
  if (topResponse.rankScore < 0.3) {
    return null // Below quality threshold
  }

  return topResponse
}
