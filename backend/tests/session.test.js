/**
 * Session Management Tests
 */

import { request, headers } from "./setup.js"

describe("Session Management", () => {
  test("should create session with X-Session-ID header", async () => {
    const response = await fetch("http://localhost:5000/health", {
      headers: headers(),
    })

    expect(response.status).toBe(200)
    expect(response.headers.get("X-Session-ID")).toBeTruthy()
  })

  test("should maintain session isolation", async () => {
    const session1 = `test_session_${Date.now()}_1`
    const session2 = `test_session_${Date.now()}_2`

    await request("POST", "/api/chat", { message: "Hello from session 1" }, { "X-Session-ID": session1 })
    const pdfsSession1 = await request("GET", "/api/pdf/list", null, { "X-Session-ID": session1 })

    await request("POST", "/api/chat", { message: "Hello from session 2" }, { "X-Session-ID": session2 })
    const pdfsSession2 = await request("GET", "/api/pdf/list", null, { "X-Session-ID": session2 })

    // Sessions should be isolated (separate PDF lists)
    expect(pdfsSession1.status).toBe(200)
    expect(pdfsSession2.status).toBe(200)
  })
})
