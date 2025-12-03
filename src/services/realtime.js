import axios from "axios"
import { logger } from "../utils/logger.js"

/**
 * Determine if a question is asking for real-time information
 *
 * @param {string} message - User message
 * @returns {Promise<boolean>} - True if real-time data is needed
 */
export async function isRealtimeQuestion(message) {
  const realtimeKeywords = [
    "weather",
    "current",
    "now",
    "today",
    "live",
    "latest",
    "recent",
    "news",
    "trending",
    "exchange rate",
    "currency",
    "stock",
    "price",
    "time",
    "what time",
    "current time",
    "what's the time",
    "news today",
    "breaking news",
    "forecast",
    "temperature",
  ]

  const lowerMessage = message.toLowerCase()
  const isRealtime = realtimeKeywords.some((keyword) => lowerMessage.includes(keyword))

  logger.debug(`Real-time classification: ${isRealtime} for message: ${message.substring(0, 50)}`)

  return isRealtime
}

/**
 * Fetch live data based on the user's question
 * Routes to appropriate API based on keywords
 *
 * @param {string} message - User message
 * @returns {Promise<object>} - Live data
 */
export async function fetchLiveData(message) {
  try {
    const lowerMessage = message.toLowerCase()

    // Route to appropriate data source
    if (lowerMessage.includes("weather") || lowerMessage.includes("forecast")) {
      return await fetchWeatherData(message)
    } else if (lowerMessage.includes("news") || lowerMessage.includes("trending")) {
      return await fetchNewsData(message)
    } else if (lowerMessage.includes("exchange rate") || lowerMessage.includes("currency")) {
      return await fetchExchangeRates(message)
    } else if (lowerMessage.includes("time") || lowerMessage.includes("clock")) {
      return fetchCurrentTime()
    }

    logger.warn("No matching real-time data source for message")
    return { type: "realtime", data: { message: "No matching data source" } }
  } catch (error) {
    logger.error("Error fetching live data", { error: error.message })
    return { type: "realtime", data: { error: "Failed to fetch real-time data" } }
  }
}

/**
 * Fetch weather data for a city
 *
 * @param {string} message - User message containing city name
 * @returns {Promise<object>} - Weather data
 */
async function fetchWeatherData(message) {
  try {
    logger.info("Fetching weather data...")

    // Extract city name from message (simple approach)
    const cityMatch = message.match(/in\s+(\w+)/i) || message.match(/(\w+)\s+weather/i)
    const city = cityMatch ? cityMatch[1] : "London"

    // Using Open-Meteo (free, no key required)
    const response = await axios.get("https://api.open-meteo.com/v1/forecast", {
      params: {
        latitude: 51.5074,
        longitude: -0.1278,
        current: "temperature_2m,humidity,weather_code,wind_speed_10m",
        timezone: "auto",
      },
      timeout: 5000,
    })

    const weatherData = {
      type: "realtime",
      data: {
        city: city,
        current: response.data.current,
        timestamp: new Date().toISOString(),
      },
    }

    logger.info(`Weather data fetched for ${city}`)
    return weatherData
  } catch (error) {
    logger.error("Error fetching weather data", { error: error.message })
    return {
      type: "realtime",
      data: { error: "Failed to fetch weather data" },
    }
  }
}

/**
 * Fetch news data
 *
 * @param {string} message - User message
 * @returns {Promise<object>} - News data
 */
async function fetchNewsData(message) {
  try {
    logger.info("Fetching news data...")

    // Using newsapi.org (requires API key)
    const apiKey = process.env.NEWS_API_KEY

    if (!apiKey) {
      logger.warn("NEWS_API_KEY not configured")
      return {
        type: "realtime",
        data: {
          news: [
            {
              title: "Sample News 1",
              description: "This is a sample news article",
              source: "Sample Source",
            },
          ],
          note: "Using sample data - configure NEWS_API_KEY for real data",
        },
      }
    }

    const response = await axios.get("https://newsapi.org/v2/top-headlines", {
      params: {
        country: "us",
        apiKey: apiKey,
      },
      timeout: 5000,
    })

    const newsData = {
      type: "realtime",
      data: {
        articles: response.data.articles.slice(0, 5).map((article) => ({
          title: article.title,
          description: article.description,
          source: article.source.name,
          url: article.url,
        })),
        timestamp: new Date().toISOString(),
      },
    }

    logger.info(`Fetched ${response.data.articles.length} news articles`)
    return newsData
  } catch (error) {
    logger.error("Error fetching news data", { error: error.message })
    return {
      type: "realtime",
      data: { error: "Failed to fetch news data" },
    }
  }
}

/**
 * Fetch currency exchange rates
 *
 * @param {string} message - User message
 * @returns {Promise<object>} - Exchange rate data
 */
async function fetchExchangeRates(message) {
  try {
    logger.info("Fetching exchange rate data...")

    // Using exchangerate-api.com (free tier available)
    const response = await axios.get("https://api.exchangerate-api.com/v4/latest/USD", {
      timeout: 5000,
    })

    const rates = {
      type: "realtime",
      data: {
        base: "USD",
        rates: {
          EUR: response.data.rates.EUR,
          GBP: response.data.rates.GBP,
          JPY: response.data.rates.JPY,
          INR: response.data.rates.INR,
          CAD: response.data.rates.CAD,
        },
        timestamp: new Date().toISOString(),
      },
    }

    logger.info("Exchange rates fetched successfully")
    return rates
  } catch (error) {
    logger.error("Error fetching exchange rates", { error: error.message })
    return {
      type: "realtime",
      data: { error: "Failed to fetch exchange rates" },
    }
  }
}

/**
 * Get current time in various formats
 *
 * @returns {object} - Current time data
 */
function fetchCurrentTime() {
  try {
    const now = new Date()

    return {
      type: "realtime",
      data: {
        time: now.toLocaleTimeString(),
        date: now.toLocaleDateString(),
        timestamp: now.toISOString(),
        unix: Math.floor(now.getTime() / 1000),
      },
    }
  } catch (error) {
    logger.error("Error fetching current time", { error: error.message })
    return {
      type: "realtime",
      data: { error: "Failed to fetch time" },
    }
  }
}

export { fetchWeatherData, fetchNewsData, fetchExchangeRates, fetchCurrentTime }
