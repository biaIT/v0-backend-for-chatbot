/**
 * PDF Routes
 * Handles PDF upload, retrieval, and management
 */

import express from "express"
import multer from "multer"
import { queuePDFForProcessing } from "../services/queueProcessor.js"
import { listSessionPDFs, deletePDFDocument, getPDFInfo } from "../services/pdfProcessor.js"
import { validatePDF, uploadLimiter } from "../utils/rateLimiter.js"
import { createLogger } from "../utils/logger.js"
import analytics from "../utils/analytics.js"

const router = express.Router()
const logger = createLogger()

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
})

// POST /api/pdf/upload - Upload and process PDF
router.post("/pdf/upload", uploadLimiter, upload.single("file"), async (req, res, next) => {
  try {
    const sessionId = req.sessionId

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" })
    }

    // Validate PDF
    const validation = validatePDF(req.file)
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error })
    }

    logger.info(`PDF upload initiated: ${req.file.originalname} (Session: ${sessionId})`)

    // Queue PDF for processing
    const result = await queuePDFForProcessing(req.file.buffer, req.file.originalname, sessionId)

    analytics.recordPDFUpload()
    if (!result.queued) {
      analytics.recordPDFProcessed()
    }

    res.json({
      success: true,
      message: result.queued ? "PDF queued for processing" : "PDF processed immediately",
      jobId: result.jobId,
      documentId: result.result?.documentId,
      filename: req.file.originalname,
      chunksCreated: result.result?.chunksCreated,
    })
  } catch (error) {
    logger.error(`PDF upload error: ${error.message}`, error)
    next(error)
  }
})

// GET /api/pdf/list - List user's PDFs
router.get("/pdf/list", (req, res) => {
  try {
    const sessionId = req.sessionId
    const pdfs = listSessionPDFs(sessionId)

    res.json({
      success: true,
      count: pdfs.length,
      pdfs,
    })
  } catch (error) {
    logger.error(`PDF list error: ${error.message}`, error)
    res.status(500).json({ error: "Failed to list PDFs" })
  }
})

// DELETE /api/pdf/:documentId - Delete a PDF
router.delete("/pdf/:documentId", (req, res) => {
  try {
    const { documentId } = req.params
    const sessionId = req.sessionId

    const deleted = deletePDFDocument(documentId, sessionId)

    if (!deleted) {
      return res.status(404).json({ error: "PDF not found" })
    }

    res.json({
      success: true,
      message: "PDF deleted successfully",
      documentId,
    })
  } catch (error) {
    logger.error(`PDF delete error: ${error.message}`, error)
    res.status(500).json({ error: "Failed to delete PDF" })
  }
})

// GET /api/pdf/:documentId - Get PDF info
router.get("/pdf/:documentId", (req, res) => {
  try {
    const { documentId } = req.params
    const pdfInfo = getPDFInfo(documentId)

    if (!pdfInfo) {
      return res.status(404).json({ error: "PDF not found" })
    }

    res.json({
      success: true,
      document: {
        documentId: pdfInfo.documentId,
        filename: pdfInfo.filename,
        uploadedAt: pdfInfo.uploadedAt,
        pageCount: pdfInfo.pageCount,
        chunks: pdfInfo.chunks.length,
      },
    })
  } catch (error) {
    logger.error(`PDF info error: ${error.message}`, error)
    res.status(500).json({ error: "Failed to get PDF info" })
  }
})

export default router
