import cron from "node-cron"
import { logger } from "../utils/logger.js"
import { reindexDocuments } from "./rag.js"
import { fetchNewsData } from "./realtime.js"
import fs from "fs"
import path from "path"

/**
 * Initialize all cron jobs
 * Runs scheduled tasks at specified intervals
 */
export function initializeCronJobs() {
  try {
    // Cron job to refresh data every 5 minutes (configurable)
    const cronSchedule = process.env.CRON_REFRESH_INTERVAL || "*/5 * * * *"

    const job = cron.schedule(cronSchedule, async () => {
      await runDataRefreshJob()
    })

    logger.info(`Cron job initialized with schedule: ${cronSchedule}`)

    // Also run once on startup
    runDataRefreshJob()

    return job
  } catch (error) {
    logger.error("Error initializing cron jobs", { error: error.message })
  }
}

/**
 * Execute the data refresh job
 * Fetches latest news and reindexes documents
 */
async function runDataRefreshJob() {
  try {
    logger.info("Starting data refresh job...")

    const startTime = Date.now()

    // Fetch latest news
    logger.info("Fetching latest news...")
    const newsData = await fetchNewsData("latest news")

    // Reindex RAG documents
    logger.info("Reindexing RAG documents...")
    await reindexDocuments()

    // Save fresh data to file for reference
    await saveFreshData(newsData)

    const duration = Date.now() - startTime
    logger.info(`Data refresh job completed in ${duration}ms`)
  } catch (error) {
    logger.error("Error running data refresh job", { error: error.message })
  }
}

/**
 * Save fresh data to file for reference and persistence
 *
 * @param {object} data - Data to save
 */
async function saveFreshData(data) {
  try {
    const dataDir = "./data"

    // Create data directory if it doesn't exist
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    const filename = path.join(dataDir, `fresh-data-${Date.now()}.json`)
    fs.writeFileSync(filename, JSON.stringify(data, null, 2))

    logger.debug(`Fresh data saved to ${filename}`)

    // Keep only last 10 files
    cleanupOldFiles(dataDir, 10)
  } catch (error) {
    logger.error("Error saving fresh data", { error: error.message })
  }
}

/**
 * Clean up old data files, keeping only the most recent ones
 *
 * @param {string} directory - Directory to clean
 * @param {number} keepCount - Number of files to keep
 */
function cleanupOldFiles(directory, keepCount) {
  try {
    if (!fs.existsSync(directory)) return

    const files = fs
      .readdirSync(directory)
      .filter((f) => f.startsWith("fresh-data-"))
      .map((f) => ({
        name: f,
        path: path.join(directory, f),
        time: fs.statSync(path.join(directory, f)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time)

    // Remove old files
    for (let i = keepCount; i < files.length; i++) {
      fs.unlinkSync(files[i].path)
      logger.debug(`Deleted old file: ${files[i].name}`)
    }
  } catch (error) {
    logger.error("Error cleaning up old files", { error: error.message })
  }
}
