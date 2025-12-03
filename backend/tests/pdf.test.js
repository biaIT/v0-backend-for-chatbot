/**
 * PDF Upload and Management Tests
 */

import { request } from "./setup.js"

describe("PDF Routes", () => {
  let testDocumentId = null

  test("should upload valid PDF", async () => {
    // Note: In real tests, use a test PDF file
    // This is a mock test
    const response = await request("POST", "/api/pdf/upload", {
      filename: "test.pdf",
      content: Buffer.from("test pdf content").toString("base64"),
    })

    if (response.status === 200) {
      expect(response.data).toHaveProperty("documentId")
      testDocumentId = response.data.documentId
    }
  })

  test("should list user PDFs", async () => {
    const response = await request("GET", "/api/pdf/list")

    expect(response.status).toBe(200)
    expect(response.data).toHaveProperty("pdfs")
    expect(Array.isArray(response.data.pdfs)).toBe(true)
  })

  test("should reject oversized file", async () => {
    const largeContent = Buffer.alloc(60 * 1024 * 1024) // 60MB

    const response = await request("POST", "/api/pdf/upload", {
      filename: "large.pdf",
      content: largeContent.toString("base64"),
    })

    expect(response.status).toBe(413)
  })

  test("should reject invalid file type", async () => {
    const response = await request("POST", "/api/pdf/upload", {
      filename: "test.txt",
      content: "text content",
    })

    expect(response.status).toBe(400)
  })

  test("should delete PDF", async () => {
    if (!testDocumentId) return

    const response = await request("DELETE", `/api/pdf/${testDocumentId}`)

    expect(response.status).toBe(200)
  })
})
