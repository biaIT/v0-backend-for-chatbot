/**
 * Entity Recognition Module
 * Extracts named entities like locations, organizations, dates, etc.
 */

export function extractEntities(text) {
  const entities = {
    locations: [],
    organizations: [],
    dates: [],
    currencies: [],
    numbers: [],
    topics: [],
  }

  // Locations (city, country patterns)
  const locationRegex = /\b([A-Z][a-z]+ (?:City|Country|State|Region|Island)?)\b/g
  let match
  while ((match = locationRegex.exec(text)) !== null) {
    if (!entities.locations.includes(match[1])) {
      entities.locations.push(match[1])
    }
  }

  // Currencies ($, €, £, ¥)
  const currencyRegex = /[$€£¥]\s*[\d,]+\.?\d*/g
  while ((match = currencyRegex.exec(text)) !== null) {
    if (!entities.currencies.includes(match[0])) {
      entities.currencies.push(match[0])
    }
  }

  // Numbers
  const numberRegex = /\b\d+(?:\.\d+)?\b/g
  while ((match = numberRegex.exec(text)) !== null) {
    if (!entities.numbers.includes(match[0])) {
      entities.numbers.push(match[0])
    }
  }

  // Dates (basic patterns)
  const dateRegex =
    /\b(?:January|February|March|April|May|June|July|August|September|October|November|December|\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\b/gi
  while ((match = dateRegex.exec(text)) !== null) {
    if (!entities.dates.includes(match[0])) {
      entities.dates.push(match[0])
    }
  }

  return entities
}

export function scoreConfidenceByEntities(entities) {
  let score = 0.5 // Base score

  // More entities = higher confidence
  const entityCount = Object.values(entities).reduce((sum, arr) => sum + arr.length, 0)
  score += Math.min(entityCount * 0.05, 0.3) // Max +0.3

  // Specific entity types boost confidence
  if (entities.locations.length > 0) score += 0.05
  if (entities.dates.length > 0) score += 0.05
  if (entities.currencies.length > 0) score += 0.05

  return Math.min(score, 1.0)
}
