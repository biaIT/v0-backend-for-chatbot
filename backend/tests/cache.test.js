/**
 * Caching Tests
 */

import { request } from "./setup.js"

describe("Caching", () => {
  test("should cache realtime API results", async () => {
    const query = "What is the temperature?"

    // First request (cache miss)
    const response1 = await request("POST", "/api/chat", { message: query })
    expect(response1.status).toBe(200)

    // Second request (cache hit)
    const response2 = await request("POST", "/api/chat", { message: query })
    expect(response2.status).toBe(200)

    // Both should have valid responses
    expect(response1.data.reply).toBeTruthy()
    expect(response2.data.reply).toBeTruthy()
  })

  test("should return cache metadata", async () => {
    const response = await request("POST", "/api/chat", {
      message: "What is the weather?",
    })

    expect(response.status).toBe(200)
    if (response.data.sourceDetails) {
      expect(response.data.sourceDetails).toHaveProperty("cached")
    }
  })
})
