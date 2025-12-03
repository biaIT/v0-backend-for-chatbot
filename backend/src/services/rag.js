import { createLogger } from "../utils/logger.js"
import { readFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const logger = createLogger()
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// In-memory document store (can be upgraded to FAISS)
let documentStore = []

// Initialize document store
export function initializeDocumentStore() {
  try {
    const documentsPath = join(__dirname, "../../data/documents.json")
    const documentsData = readFileSync(documentsPath, "utf-8")
    documentStore = JSON.parse(documentsData)
    logger.info(`Loaded ${documentStore.length} documents into vector store`)
  } catch (error) {
    logger.error("Error loading documents:", error)
    // Initialize with default documents if file not found
    documentStore = getDefaultDocuments()
  }
}

// Query vector store using similarity search
export async function queryVectorStore(query) {
  try {
    if (documentStore.length === 0) {
      initializeDocumentStore()
    }

    // Simple similarity matching based on keywords
    const queryTerms = query.toLowerCase().split(" ")
    const scored = documentStore.map((doc) => {
      let score = 0
      const docText = (doc.content + " " + doc.title).toLowerCase()

      queryTerms.forEach((term) => {
        const matches = docText.match(new RegExp(term, "g"))
        score += matches ? matches.length : 0
      })

      return { ...doc, score }
    })

    // Return top 3 results sorted by score
    const results = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .filter((doc) => doc.score > 0)

    logger.info(`RAG query returned ${results.length} results`)
    return results
  } catch (error) {
    logger.error("RAG query error:", error)
    return []
  }
}

// Reindex documents (called by cron job)
export async function reindexDocuments() {
  try {
    initializeDocumentStore()
    logger.info("Documents reindexed successfully")
  } catch (error) {
    logger.error("Error reindexing documents:", error)
  }
}

// Get default documents if file not found
function getDefaultDocuments() {
  return [
    {
      id: "1",
      title: "What is Artificial Intelligence?",
      content:
        "Artificial Intelligence (AI) is the simulation of human intelligence processes by machines, especially computer systems. These processes include learning, reasoning, and self-correction.",
      category: "AI Basics",
    },
    {
      id: "2",
      title: "Machine Learning Fundamentals",
      content:
        "Machine Learning is a subset of AI that enables systems to learn and improve from experience without being explicitly programmed. It uses algorithms to analyze data and make predictions.",
      category: "Machine Learning",
    },
    {
      id: "3",
      title: "Natural Language Processing",
      content:
        "Natural Language Processing (NLP) is a branch of AI that focuses on the interaction between computers and human language. It enables machines to understand, interpret, and generate human language.",
      category: "NLP",
    },
    {
      id: "4",
      title: "Deep Learning",
      content:
        "Deep Learning is a subset of machine learning that uses artificial neural networks with multiple layers to learn representations of data. It powers modern AI applications like image recognition and language models.",
      category: "Deep Learning",
    },
    {
      id: "5",
      title: "Data Science Overview",
      content:
        "Data Science combines statistics, programming, and domain expertise to extract meaningful insights from data. It involves data collection, processing, analysis, and visualization.",
      category: "Data Science",
    },
  ]
}
