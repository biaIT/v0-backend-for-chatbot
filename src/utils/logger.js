import winston from "winston"
import fs from "fs"
import path from "path"

// Create logs directory if it doesn't exist
const logsDir = process.env.LOG_DIR || "./logs"
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

/**
 * Configure Winston logger with file and console outputs
 * Logs all requests, responses, and errors
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: "rag-chatbot-backend" },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    }),

    // Combined log file (all levels)
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    }),

    // Requests log file
    new winston.transports.File({
      filename: path.join(logsDir, "requests.log"),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, message, ...meta }) => {
          return JSON.stringify({
            timestamp,
            message,
            meta,
          })
        }),
      ),
    }),

    // Console output for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          const metaStr = Object.keys(meta).length > 0 ? `\n${JSON.stringify(meta, null, 2)}` : ""
          return `${timestamp} [${level}]: ${message}${metaStr}`
        }),
      ),
    }),
  ],
})

// Helper methods for structured logging
logger.logRequest = (method, path, data = {}) => {
  logger.info(`[REQUEST] ${method} ${path}`, {
    type: "request",
    ...data,
  })
}

logger.logResponse = (statusCode, message = "", data = {}) => {
  logger.info(`[RESPONSE] ${statusCode}`, {
    type: "response",
    statusCode,
    ...data,
  })
}

logger.logChatMessage = (message, context = {}) => {
  logger.info(`[CHAT] ${message.substring(0, 100)}`, {
    type: "chat",
    messageLength: message.length,
    ...context,
  })
}

export { logger }
