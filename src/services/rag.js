import fs from "fs"
import { logger } from "../utils/logger.js"

// In-memory document store (in production, use actual FAISS index)
let documentStore = []

/**
 * Initialize RAG system by loading documents
 * In a production environment, this would initialize FAISS
 */
export async function initializeRAG() {
  try {
    const documentsPath = process.env.DOCUMENTS_PATH || "./data/documents.json"

    if (fs.existsSync(documentsPath)) {
      const data = fs.readFileSync(documentsPath, "utf-8")
      documentStore = JSON.parse(data)
      logger.info(`Loaded ${documentStore.length} documents into RAG system`)
    } else {
      logger.warn(`Documents file not found at ${documentsPath}`)
      documentStore = []
    }
  } catch (error) {
    logger.error("Error initializing RAG", { error: error.message })
    documentStore = []
  }
}

/**
 * Query the vector store for relevant documents
 *
 * @param {string} query - User query
 * @param {number} topK - Number of results to return
 * @returns {Promise<object>} - Query results with documents and scores
 */
export async function queryVectorStore(query, topK = 3) {
  try {
    logger.debug(`Querying vector store: ${query.substring(0, 50)}...`)

    if (documentStore.length === 0) {
      logger.warn("Document store is empty")
      return { documents: [], scores: [] }
    }

    // Simple similarity search (in production, use actual FAISS similarity)
    const results = documentStore
      .map((doc) => ({
        ...doc,
        score: calculateSimilarity(query, doc.content),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)

    logger.info(`Retrieved ${results.length} documents from vector store`)

    return {
      documents: results.map((r) => ({
        pageContent: r.content,
        metadata: r.metadata || {},
      })),
      scores: results.map((r) => r.score),
    }
  } catch (error) {
    logger.error("Error querying vector store", { error: error.message })
    return { documents: [], scores: [] }
  }
}

/**
 * Add documents to the vector store
 *
 * @param {array} documents - Documents to add
 * @returns {Promise<void>}
 */
export async function addDocuments(documents) {
  try {
    documentStore = [...documentStore, ...documents]
    logger.info(`Added ${documents.length} documents to vector store`)
  } catch (error) {
    logger.error("Error adding documents", { error: error.message })
    throw error
  }
}

/**
 * Simple similarity calculation using basic string matching
 * In production, use proper embeddings and FAISS
 *
 * @param {string} query - Query string
 * @param {string} content - Document content
 * @returns {number} - Similarity score (0-1)
 */
function calculateSimilarity(query, content) {
  const queryTerms = query.toLowerCase().split(/\s+/)
  const contentTerms = content.toLowerCase().split(/\s+/)

  let matches = 0
  for (const term of queryTerms) {
    if (contentTerms.includes(term)) {
      matches++
    }
  }

  return matches / Math.max(queryTerms.length, contentTerms.length)
}

/**
 * Clear and re-index all documents
 * Called by cron job to refresh index
 *
 * @returns {Promise<void>}
 */
export async function reindexDocuments() {
  try {
    logger.info("Reindexing documents...")
    await initializeRAG()
    logger.info("Documents reindexed successfully")
  } catch (error) {
    logger.error("Error reindexing documents", { error: error.message })
  }
}
