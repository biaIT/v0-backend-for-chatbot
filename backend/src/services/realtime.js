import axios from "axios"
import { createLogger } from "../utils/logger.js"
import { cacheManager } from "../utils/cache.js"

const logger = createLogger()

// Keywords for classifying real-time questions
const realtimeKeywords = {
  weather: ["weather", "temperature", "rain", "sunny", "forecast", "wind"],
  news: ["news", "headline", "latest", "breaking", "today", "current"],
  time: ["time", "what time", "current time", "what is the time", "clock"],
  currency: ["exchange rate", "currency", "convert", "dollar", "euro", "rate"],
}

// Classify if message is a real-time question
export function classifyMessage(message) {
  const lowerMessage = message.toLowerCase()

  for (const [type, keywords] of Object.entries(realtimeKeywords)) {
    if (keywords.some((kw) => lowerMessage.includes(kw))) {
      return { isRealtime: true, type }
    }
  }

  return { isRealtime: false, type: null }
}

// Extract city from message
function extractCity(message) {
  const cityMatch = message.match(/in\s+(\w+)/i) || message.match(/(\w+)\s*weather/i)
  return cityMatch ? cityMatch[1] : "New York"
}

// Fetch weather data with caching
export async function fetchWeather(city = "New York") {
  try {
    const cacheKey = `weather_${city.toLowerCase()}`

    // Check cache first
    const cachedWeather = cacheManager.get(cacheKey)
    if (cachedWeather) {
      logger.info(`Using cached weather data for ${city}`)
      return cachedWeather
    }

    // Using Open-Meteo API (free, no key required)
    const response = await axios.get("https://geocoding-api.open-meteo.com/v1/search", {
      params: { name: city, count: 1, language: "en", format: "json" },
    })

    if (!response.data.results || response.data.results.length === 0) {
      return { error: `City '${city}' not found` }
    }

    const location = response.data.results[0]
    const weatherResponse = await axios.get("https://api.open-meteo.com/v1/forecast", {
      params: {
        latitude: location.latitude,
        longitude: location.longitude,
        current: "temperature_2m,relative_humidity_2m,weather_code",
        temperature_unit: "celsius",
      },
    })

    const weather = weatherResponse.data.current
    const weatherData = {
      city: `${location.name}, ${location.country}`,
      temperature: weather.temperature_2m,
      humidity: weather.relative_humidity_2m,
      weather_code: weather.weather_code,
      timestamp: new Date().toISOString(),
      cached: false,
    }

    // Cache for 30 minutes (1800 seconds)
    cacheManager.set(cacheKey, weatherData, 1800)
    return weatherData
  } catch (error) {
    logger.error(`Weather fetch error: ${error.message}`)
    return { error: "Failed to fetch weather data" }
  }
}

// Fetch news with caching
export async function fetchNews() {
  try {
    const cacheKey = "news_latest"

    // Check cache first
    const cachedNews = cacheManager.get(cacheKey)
    if (cachedNews) {
      logger.info("Using cached news data")
      return cachedNews
    }

    const apiKey = process.env.NEWS_API_KEY
    if (!apiKey) {
      return { error: "NEWS_API_KEY not set" }
    }

    const response = await axios.get("https://newsapi.org/v2/top-headlines", {
      params: {
        country: "us",
        apiKey: apiKey,
        pageSize: 5,
      },
    })

    const newsData = {
      headlines: response.data.articles.map((article) => ({
        title: article.title,
        description: article.description,
        url: article.url,
        source: article.source.name,
      })),
      timestamp: new Date().toISOString(),
      cached: false,
    }

    // Cache for 1 hour (3600 seconds)
    cacheManager.set(cacheKey, newsData, 3600)
    return newsData
  } catch (error) {
    logger.error(`News fetch error: ${error.message}`)
    return { error: "Failed to fetch news" }
  }
}

// Fetch exchange rates with caching
export async function fetchExchangeRates(baseCurrency = "USD") {
  try {
    const cacheKey = `currency_${baseCurrency}`

    // Check cache first
    const cachedRates = cacheManager.get(cacheKey)
    if (cachedRates) {
      logger.info(`Using cached exchange rates for ${baseCurrency}`)
      return cachedRates
    }

    const response = await axios.get("https://api.exchangerate-api.com/v4/latest/" + baseCurrency)
    const ratesData = {
      base: response.data.base,
      rates: response.data.rates,
      timestamp: new Date().toISOString(),
      cached: false,
    }

    // Cache for 6 hours (21600 seconds)
    cacheManager.set(cacheKey, ratesData, 21600)
    return ratesData
  } catch (error) {
    logger.error(`Exchange rate fetch error: ${error.message}`)
    return { error: "Failed to fetch exchange rates" }
  }
}

// Get current time
export function getCurrentTime() {
  return {
    time: new Date().toLocaleTimeString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timestamp: new Date().toISOString(),
  }
}

// Fetch live data based on message type
export async function fetchLiveData(message, type) {
  logger.info(`Fetching live data for type: ${type}`)

  switch (type) {
    case "weather": {
      const city = extractCity(message)
      return await fetchWeather(city)
    }
    case "news":
      return await fetchNews()
    case "currency":
      return await fetchExchangeRates()
    case "time":
      return getCurrentTime()
    default:
      return { error: "Unknown query type" }
  }
}

export function getCacheStats() {
  return cacheManager.getStats()
}
