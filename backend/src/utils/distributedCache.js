/**
 * Distributed Cache for Multi-Instance Deployment
 * Uses simple in-memory store with optional Redis support
 */

import { createLogger } from "./logger.js"

const logger = createLogger()

export class DistributedCache {
  constructor(useRedis = false) {
    this.useRedis = useRedis && process.env.REDIS_URL
    this.localCache = new Map()
    this.redis = null

    if (this.useRedis) {
      this.initRedis()
    }
  }

  async initRedis() {
    try {
      const { createClient } = await import("redis")
      this.redis = createClient({ url: process.env.REDIS_URL })
      await this.redis.connect()
      logger.info("Redis connected for distributed caching")
    } catch (err) {
      logger.warn("Redis initialization failed, using local cache only:", err.message)
      this.redis = null
    }
  }

  async get(key) {
    try {
      if (this.redis) {
        const value = await this.redis.get(key)
        if (value) {
          logger.debug(`Cache HIT (Redis): ${key}`)
          return JSON.parse(value)
        }
      }

      const localValue = this.localCache.get(key)
      if (localValue && localValue.expiresAt > Date.now()) {
        logger.debug(`Cache HIT (Local): ${key}`)
        return localValue.value
      }

      logger.debug(`Cache MISS: ${key}`)
      return null
    } catch (err) {
      logger.error("Cache get error:", err)
      return null
    }
  }

  async set(key, value, ttlSeconds = 3600) {
    try {
      if (this.redis) {
        await this.redis.setEx(key, ttlSeconds, JSON.stringify(value))
      }

      this.localCache.set(key, {
        value,
        expiresAt: Date.now() + ttlSeconds * 1000,
      })

      logger.debug(`Cache SET: ${key} (TTL: ${ttlSeconds}s)`)
    } catch (err) {
      logger.error("Cache set error:", err)
    }
  }

  async delete(key) {
    try {
      if (this.redis) {
        await this.redis.del(key)
      }
      this.localCache.delete(key)
      logger.debug(`Cache DELETE: ${key}`)
    } catch (err) {
      logger.error("Cache delete error:", err)
    }
  }

  async clear() {
    try {
      if (this.redis) {
        await this.redis.flushDb()
      }
      this.localCache.clear()
      logger.info("Cache cleared")
    } catch (err) {
      logger.error("Cache clear error:", err)
    }
  }

  async getStats() {
    let redisSize = 0
    try {
      if (this.redis) {
        const info = await this.redis.info("memory")
        redisSize = Number.parseInt(info.used_memory) || 0
      }
    } catch (err) {
      logger.error("Error getting Redis stats:", err)
    }

    return {
      localSize: this.localCache.size,
      redisConnected: !!this.redis,
      redisMemoryBytes: redisSize,
    }
  }
}

export default new DistributedCache(true)
