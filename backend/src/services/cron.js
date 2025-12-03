import cron from "node-cron"
import { fetchNews } from "./realtime.js"
import { reindexDocuments } from "./rag.js"
import { createLogger } from "../utils/logger.js"

const logger = createLogger()

// Initialize cron jobs
export async function initializeCronJobs() {
  try {
    // Run every 5 minutes
    cron.schedule("*/5 * * * *", async () => {
      logger.info("Cron job executing: Refreshing data")

      try {
        // Fetch latest news
        const newsData = await fetchNews()
        if (newsData.error) {
          logger.warn(`News fetch in cron failed: ${newsData.error}`)
        } else {
          logger.info(`Fetched ${newsData.headlines.length} news headlines`)
        }

        // Reindex documents
        await reindexDocuments()

        logger.info("Cron job completed successfully")
      } catch (error) {
        logger.error(`Cron job error: ${error.message}`)
      }
    })

    logger.info("Cron jobs scheduled (every 5 minutes)")
  } catch (error) {
    logger.error("Failed to initialize cron jobs:", error)
    throw error
  }
}
