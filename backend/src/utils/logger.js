import winston from "winston"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const logsDir = join(__dirname, "../../logs")

// Create logger instance
export function createLogger() {
  return winston.createLogger({
    level: "info",
    format: winston.format.combine(
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    ),
    defaultMeta: { service: "chatbot-backend" },
    transports: [
      // File transport for all logs
      new winston.transports.File({ filename: join(logsDir, "combined.log") }),

      // File transport for errors
      new winston.transports.File({
        filename: join(logsDir, "error.log"),
        level: "error",
      }),

      // File transport for requests
      new winston.transports.File({
        filename: join(logsDir, "requests.log"),
        format: winston.format.combine(
          winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
          winston.format.printf(({ timestamp, message, level }) => {
            return `${timestamp} [${level}] ${message}`
          }),
        ),
      }),

      // Console transport for development
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level}] ${message}`
          }),
        ),
      }),
    ],
  })
}
