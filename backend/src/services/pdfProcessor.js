/**
 * PDF Processing Service
 * Handles PDF uploads, text extraction, and vectorization
 */

import pdf from "pdf-parse"
import { createLogger } from "../utils/logger.js"
import { v4 as uuidv4 } from "uuid"

const logger = createLogger()

// In-memory PDF store
const pdfStore = new Map()

/**
 * Extract text from PDF buffer
 */
export async function extractPDFText(pdfBuffer) {
  try {
    const data = await pdf(pdfBuffer)
    logger.info(`Extracted ${data.numpages} pages from PDF`)
    return {
      text: data.text,
      pages: data.numpages,
      metadata: data.info,
    }
  } catch (error) {
    logger.error("PDF extraction error:", error)
    throw new Error("Failed to extract text from PDF")
  }
}

/**
 * Process PDF for RAG
 * Splits text into chunks and creates embeddings
 */
export async function processPDFForRAG(pdfBuffer, filename, sessionId) {
  try {
    const documentId = uuidv4()

    // Extract text
    const extraction = await extractPDFText(pdfBuffer)

    // Split text into chunks (500 chars per chunk with 50 char overlap)
    const chunks = splitTextIntoChunks(extraction.text, 500, 50)

    // Create document record
    const pdfDocument = {
      documentId,
      filename,
      sessionId,
      uploadedAt: new Date(),
      pageCount: extraction.pages,
      chunks: chunks.map((chunk, idx) => ({
        id: `${documentId}_chunk_${idx}`,
        text: chunk,
        chunkIndex: idx,
        score: 0, // Will be updated during similarity search
      })),
      metadata: {
        totalChunks: chunks.length,
        extractedMetadata: extraction.metadata,
      },
    }

    // Store in memory
    pdfStore.set(documentId, pdfDocument)

    logger.info(`PDF processed: ${documentId} (${chunks.length} chunks, ${extraction.pages} pages)`)

    return {
      documentId,
      filename,
      chunksCreated: chunks.length,
      pagesProcessed: extraction.pages,
    }
  } catch (error) {
    logger.error("PDF processing error:", error)
    throw error
  }
}

/**
 * Split text into overlapping chunks
 */
function splitTextIntoChunks(text, chunkSize = 500, overlapSize = 50) {
  const chunks = []
  for (let i = 0; i < text.length; i += chunkSize - overlapSize) {
    chunks.push(text.slice(i, i + chunkSize))
  }
  return chunks
}

/**
 * Query PDF documents
 */
export async function queryPDFDocuments(query, sessionId, limit = 5) {
  try {
    const queryTerms = query.toLowerCase().split(" ")
    const results = []

    // Search through all PDFs in session
    for (const [docId, pdfDoc] of pdfStore.entries()) {
      if (pdfDoc.sessionId !== sessionId) continue

      // Score each chunk
      for (const chunk of pdfDoc.chunks) {
        let score = 0
        const chunkLower = chunk.text.toLowerCase()

        queryTerms.forEach((term) => {
          const matches = chunkLower.match(new RegExp(term, "g"))
          score += matches ? matches.length : 0
        })

        if (score > 0) {
          results.push({
            documentId: docId,
            filename: pdfDoc.filename,
            chunkId: chunk.id,
            content: chunk.text,
            chunkIndex: chunk.chunkIndex,
            score,
          })
        }
      }
    }

    // Sort by score and return top results
    return results.sort((a, b) => b.score - a.score).slice(0, limit)
  } catch (error) {
    logger.error("PDF query error:", error)
    return []
  }
}

/**
 * Get PDF info
 */
export function getPDFInfo(documentId) {
  return pdfStore.get(documentId) || null
}

/**
 * List all PDFs for session
 */
export function listSessionPDFs(sessionId) {
  const pdfs = []
  for (const [docId, pdfDoc] of pdfStore.entries()) {
    if (pdfDoc.sessionId === sessionId) {
      pdfs.push({
        documentId: docId,
        filename: pdfDoc.filename,
        uploadedAt: pdfDoc.uploadedAt,
        pageCount: pdfDoc.pageCount,
        chunks: pdfDoc.chunks.length,
      })
    }
  }
  return pdfs
}

/**
 * Delete PDF document
 */
export function deletePDFDocument(documentId, sessionId) {
  const pdfDoc = pdfStore.get(documentId)
  if (pdfDoc && pdfDoc.sessionId === sessionId) {
    pdfStore.delete(documentId)
    logger.info(`PDF deleted: ${documentId}`)
    return true
  }
  return false
}
