/**
 * Test setup and utilities
 */

import fetch from "node-fetch"

const BASE_URL = "http://localhost:5000"
const TEST_SESSION_ID = `test_${Date.now()}`

export const headers = (customHeaders = {}) => ({
  "Content-Type": "application/json",
  "X-Session-ID": TEST_SESSION_ID,
  ...customHeaders,
})

export const request = async (method, path, body = null, customHeaders = {}) => {
  const options = {
    method,
    headers: headers(customHeaders),
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  const response = await fetch(`${BASE_URL}${path}`, options)
  const data = await response.json()

  return {
    status: response.status,
    data,
  }
}

export { TEST_SESSION_ID }
