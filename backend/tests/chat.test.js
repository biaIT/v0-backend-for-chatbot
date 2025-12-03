/**
 * Chat Routing Tests
 * Tests: realtime, rag, general, and multi-source queries
 */

import { request } from "./setup.js"

describe("Chat Routes", () => {
  test("should handle realtime weather query", async () => {
    const response = await request("POST", "/api/chat", {
      message: "What is the weather today?",
    })

    expect(response.status).toBe(200)
    expect(response.data).toHaveProperty("reply")
    expect(response.data).toHaveProperty("intent")
    expect(response.data.intent).toBe("realtime")
  })

  test("should handle RAG knowledge query", async () => {
    const response = await request("POST", "/api/chat", {
      message: "Tell me about artificial intelligence",
    })

    expect(response.status).toBe(200)
    expect(response.data).toHaveProperty("reply")
    expect(response.data.intent).toMatch(/rag|general/)
  })

  test("should handle general conversation", async () => {
    const response = await request("POST", "/api/chat", {
      message: "Hello, how are you?",
    })

    expect(response.status).toBe(200)
    expect(response.data).toHaveProperty("reply")
  })

  test("should merge multi-source results", async () => {
    const response = await request("POST", "/api/chat", {
      message: "What is the weather and explain machine learning?",
    })

    expect(response.status).toBe(200)
    expect(response.data).toHaveProperty("sources")
    expect(Array.isArray(response.data.sources)).toBe(true)
  })

  test("should reject empty message", async () => {
    const response = await request("POST", "/api/chat", {
      message: "",
    })

    expect(response.status).toBe(400)
  })
})
