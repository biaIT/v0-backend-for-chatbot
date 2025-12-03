/**
 * Integration Tests
 * Tests the full flow of multiple users uploading PDFs and querying
 */

import fetch from "node-fetch"
import { strict as assert } from "assert"

const BASE_URL = "http://localhost:5000"
const TIMEOUT = 30000

async function createUser(userId) {
  return {
    userId,
    sessionId: `session_${userId}_${Date.now()}`,
    uploadedPDFs: [],
  }
}

async function testConcurrentPDFUpload() {
  console.log("\n[Integration Test] Concurrent PDF Upload")

  try {
    const users = await Promise.all([1, 2, 3].map(createUser))

    // Simulate PDF uploads for each user
    const uploads = users.map((user) =>
      fetch(`${BASE_URL}/api/pdf/upload`, {
        method: "POST",
        headers: { "X-Session-ID": user.sessionId },
        body: createMockPDFFormData("test.pdf"),
      }),
    )

    const results = await Promise.all(uploads)
    const success = results.filter((r) => r.status === 200).length

    assert.equal(success, 3, "All 3 PDFs should upload successfully")
    console.log("✓ All 3 users uploaded PDFs concurrently")
  } catch (err) {
    console.error("✗ Concurrent PDF upload failed:", err.message)
    throw err
  }
}

async function testMultiSourceMerging() {
  console.log("\n[Integration Test] Multi-Source Query Merging")

  try {
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Session-ID": "test_merge_session",
      },
      body: JSON.stringify({ message: "What is the weather and tell me about AI?" }),
      timeout: TIMEOUT,
    })

    const data = await response.json()

    assert.ok(data.sources, "Response should have sources")
    assert.ok(data.sources.length > 0, "Should merge multiple sources")
    console.log(`✓ Query merged ${data.sources.length} sources`)
  } catch (err) {
    console.error("✗ Multi-source merge failed:", err.message)
    throw err
  }
}

async function testRAGConsistency() {
  console.log("\n[Integration Test] RAG Consistency")

  try {
    const query = { message: "What is machine learning?" }

    const response1 = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Session-ID": "consistency_test_1",
      },
      body: JSON.stringify(query),
      timeout: TIMEOUT,
    })

    const response2 = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Session-ID": "consistency_test_2",
      },
      body: JSON.stringify(query),
      timeout: TIMEOUT,
    })

    const data1 = await response1.json()
    const data2 = await response2.json()

    // Both should use RAG source
    const useRAG1 = data1.sources?.some((s) => s.source === "rag")
    const useRAG2 = data2.sources?.some((s) => s.source === "rag")

    assert.ok(useRAG1 && useRAG2, "Both should use RAG for knowledge query")
    console.log("✓ RAG consistency verified")
  } catch (err) {
    console.error("✗ RAG consistency failed:", err.message)
    throw err
  }
}

function createMockPDFFormData(filename) {
  // Mock implementation
  return Buffer.from("mock pdf data")
}

export async function runIntegrationTests() {
  console.log("\n========== Integration Tests ==========")

  try {
    await testConcurrentPDFUpload()
    await testMultiSourceMerging()
    await testRAGConsistency()

    console.log("\n✓ All integration tests passed")
    return { passed: 3, failed: 0 }
  } catch (err) {
    console.error("\n✗ Integration tests failed")
    return { passed: 0, failed: 3, error: err.message }
  }
}
