import { createLogger } from "./logger.js"

const logger = createLogger()

class CacheManager {
  constructor() {
    this.cache = new Map()
  }

  // Set cache with TTL (Time To Live) in seconds
  set(key, value, ttlSeconds = 300) {
    const expiryTime = Date.now() + ttlSeconds * 1000
    this.cache.set(key, {
      value,
      expiryTime,
    })
    logger.info(`Cache set for key: ${key} (TTL: ${ttlSeconds}s)`)
  }

  // Get cache if not expired
  get(key) {
    const cached = this.cache.get(key)
    if (!cached) return null

    if (Date.now() > cached.expiryTime) {
      this.cache.delete(key)
      logger.info(`Cache expired for key: ${key}`)
      return null
    }

    logger.info(`Cache hit for key: ${key}`)
    return cached.value
  }

  // Clear all cache
  clear() {
    this.cache.clear()
    logger.info("Cache cleared")
  }

  // Get cache stats
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

export const cacheManager = new CacheManager()
