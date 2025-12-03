/**
 * Load Tests
 * Tests system performance under concurrent load
 */

import fetch from "node-fetch"

const BASE_URL = "http://localhost:5000"

async function loadTestChat(concurrentUsers = 10, requestsPerUser = 5) {
  console.log(`\n[Load Test] ${concurrentUsers} concurrent users, ${requestsPerUser} requests each`)

  const startTime = Date.now()
  const results = []
  let successCount = 0
  let errorCount = 0
  let totalTime = 0

  const queries = [
    "What is the weather?",
    "Tell me about AI",
    "Latest news",
    "USD to EUR rate",
    "How does machine learning work?",
  ]

  const userPromises = []

  for (let user = 0; user < concurrentUsers; user++) {
    const userPromise = (async () => {
      for (let req = 0; req < requestsPerUser; req++) {
        try {
          const query = queries[req % queries.length]
          const reqStart = Date.now()

          const response = await fetch(`${BASE_URL}/api/chat`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Session-ID": `load_test_user_${user}`,
            },
            body: JSON.stringify({ message: query }),
            timeout: 30000,
          })

          const responseTime = Date.now() - reqStart

          if (response.status === 200) {
            successCount++
            totalTime += responseTime
            results.push({ success: true, time: responseTime })
          } else {
            errorCount++
            results.push({ success: false })
          }
        } catch (err) {
          errorCount++
          results.push({ success: false, error: err.message })
        }
      }
    })()

    userPromises.push(userPromise)
  }

  await Promise.all(userPromises)
  const totalDuration = Date.now() - startTime

  const avgTime = successCount > 0 ? Math.round(totalTime / successCount) : 0
  const totalRequests = successCount + errorCount
  const successRate = successCount > 0 ? ((successCount / totalRequests) * 100).toFixed(1) : 0
  const throughput = ((totalRequests / totalDuration) * 1000).toFixed(2)

  console.log(`  Total Requests: ${totalRequests}`)
  console.log(`  Successful: ${successCount}`)
  console.log(`  Failed: ${errorCount}`)
  console.log(`  Success Rate: ${successRate}%`)
  console.log(`  Average Response Time: ${avgTime}ms`)
  console.log(`  Throughput: ${throughput} req/sec`)
  console.log(`  Total Duration: ${totalDuration}ms`)

  return {
    totalRequests,
    successCount,
    errorCount,
    avgTime,
    successRate: Number.parseFloat(successRate),
    throughput: Number.parseFloat(throughput),
    totalDuration,
  }
}

async function loadTestCache(iterations = 100) {
  console.log(`\n[Load Test] Cache stress test (${iterations} iterations)`)

  const startTime = Date.now()
  const cacheKey = "load_test_cache_key"
  let hitCount = 0
  let missCount = 0

  for (let i = 0; i < iterations; i++) {
    try {
      const response = await fetch(`${BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Session-ID": "cache_stress_test",
        },
        body: JSON.stringify({ message: "What is the weather?" }), // Same query = cache hit
        timeout: 30000,
      })

      if (response.status === 200) {
        const data = await response.json()
        // Check if cached based on response metadata
        if (data.sources?.[0]?.metadata?.cached) {
          hitCount++
        } else {
          missCount++
        }
      }
    } catch (err) {
      console.error(`Cache test iteration ${i} failed:`, err.message)
    }
  }

  const duration = Date.now() - startTime
  const hitRate = ((hitCount / (hitCount + missCount)) * 100).toFixed(1)

  console.log(`  Cache Hits: ${hitCount}`)
  console.log(`  Cache Misses: ${missCount}`)
  console.log(`  Hit Rate: ${hitRate}%`)
  console.log(`  Duration: ${duration}ms`)

  return {
    hitCount,
    missCount,
    hitRate: Number.parseFloat(hitRate),
    duration,
  }
}

export async function runLoadTests() {
  console.log("\n========== Load Tests ==========")

  try {
    const chatResults = await loadTestChat(10, 5)
    const cacheResults = await loadTestCache(20)

    return {
      chat: chatResults,
      cache: cacheResults,
      success: true,
    }
  } catch (err) {
    console.error("\n✗ Load tests failed:", err.message)
    return { success: false, error: err.message }
  }
}
