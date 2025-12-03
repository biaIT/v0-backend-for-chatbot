/**
 * API Endpoint Tests
 */

import { request } from "./setup.js"

describe("API Endpoints", () => {
  test("GET /health should return ok", async () => {
    const response = await request("GET", "/health")

    expect(response.status).toBe(200)
    expect(response.data).toHaveProperty("status")
  })

  test("GET /api/analytics should return stats", async () => {
    const response = await request("GET", "/api/analytics")

    expect(response.status).toBe(200)
    expect(response.data).toHaveProperty("queryCounts")
  })

  test("should handle 404 for unknown routes", async () => {
    const response = await request("GET", "/api/unknown-route")

    expect(response.status).toBe(404)
  })
})
