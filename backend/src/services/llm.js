import { ChatOpenAI } from "@langchain/openai"
import { createLogger } from "../utils/logger.js"

const logger = createLogger()

// Initialize LLM
let llm = null

function initializeLLM() {
  const provider = process.env.LLM_PROVIDER || "openai"
  const apiKey = provider === "openai" ? process.env.OPENAI_API_KEY : process.env.GROQ_API_KEY

  if (!apiKey) {
    throw new Error(`${provider.toUpperCase()}_API_KEY is not set in environment variables`)
  }

  if (provider === "openai") {
    llm = new ChatOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      modelName: "gpt-3.5-turbo",
      temperature: 0.7,
    })
  } else if (provider === "groq") {
    // For Groq, we'll use the OpenAI SDK with Groq endpoint
    llm = new ChatOpenAI({
      apiKey: process.env.GROQ_API_KEY,
      modelName: "mixtral-8x7b-32768",
      baseURL: "https://api.groq.com/openai/v1",
      temperature: 0.7,
    })
  }

  logger.info(`LLM initialized with provider: ${provider}`)
  return llm
}

export async function generateResponse(context, userMessage, customSystemPrompt = null) {
  try {
    if (!llm) {
      initializeLLM()
    }

    // Use custom system prompt or default
    const systemPrompt =
      customSystemPrompt ||
      `You are an intelligent assistant that helps users with real-time information and knowledge-based queries. 
You have access to current data including weather, news, exchange rates, and a knowledge base.
When answering questions, be concise, accurate, and helpful. Use the provided context to give informed responses.
If you don't have enough information, say so honestly.`

    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `Context: ${context}\n\nUser Question: ${userMessage}`,
      },
    ]

    const response = await llm.invoke(messages)
    return response.content
  } catch (error) {
    logger.error("LLM generation error:", error)
    throw new Error(`Failed to generate response: ${error.message}`)
  }
}
