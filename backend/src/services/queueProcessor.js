/**
 * Async Queue Processor
 * Handles background processing of PDFs using Bull.js
 * Falls back to immediate processing if Redis is unavailable
 */

import Queue from "bull"
import { processPDFForRAG } from "./pdfProcessor.js"
import { createLogger } from "../utils/logger.js"

const logger = createLogger()

let pdfQueue = null

/**
 * Initialize PDF processing queue
 */
export async function initializePDFQueue() {
  try {
    pdfQueue = new Queue("pdf-processing", {
      redis: {
        host: process.env.REDIS_HOST || "localhost",
        port: process.env.REDIS_PORT || 6379,
      },
    })

    // Process PDF jobs
    pdfQueue.process(async (job) => {
      try {
        logger.info(`Processing PDF job: ${job.id}`)

        const { pdfBuffer, filename, sessionId } = job.data

        // Extract and vectorize PDF
        const result = await processPDFForRAG(pdfBuffer, filename, sessionId)

        // Update job progress
        job.progress(100)

        logger.info(`PDF job completed: ${job.id}`)
        return result
      } catch (error) {
        logger.error(`PDF job failed: ${job.id}`, error)
        throw error
      }
    })

    // Job events
    pdfQueue.on("completed", (job) => {
      logger.info(`Job completed: ${job.id}`)
    })

    pdfQueue.on("failed", (job, err) => {
      logger.error(`Job failed: ${job.id}`, err)
    })

    logger.info("PDF processing queue initialized")
  } catch (error) {
    logger.warn("Redis queue not available, using immediate processing:", error.message)
    // Queue will fallback to immediate processing
  }
}

/**
 * Add PDF to processing queue
 */
export async function queuePDFForProcessing(pdfBuffer, filename, sessionId) {
  try {
    if (pdfQueue) {
      // Use Bull.js queue
      const job = await pdfQueue.add(
        {
          pdfBuffer,
          filename,
          sessionId,
        },
        {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000,
          },
          removeOnComplete: true,
        },
      )

      logger.info(`PDF queued for processing: job ${job.id}`)
      return {
        jobId: job.id,
        queued: true,
      }
    } else {
      // Fallback to immediate processing
      logger.info("Processing PDF immediately (no queue)")
      const result = await processPDFForRAG(pdfBuffer, filename, sessionId)
      return {
        result,
        queued: false,
      }
    }
  } catch (error) {
    logger.error("Error queuing PDF:", error)
    throw error
  }
}

/**
 * Get job status
 */
export async function getJobStatus(jobId) {
  if (!pdfQueue) return null

  try {
    const job = await pdfQueue.getJob(jobId)
    if (!job) return null

    const state = await job.getState()
    const progress = job._progress

    return {
      jobId,
      state,
      progress,
      data: job.data,
    }
  } catch (error) {
    logger.error("Error getting job status:", error)
    return null
  }
}
