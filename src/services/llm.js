import { ChatOpenAI } from "@langchain/openai"
import { logger } from "../utils/logger.js"
import axios from "axios"

let llmModel = null

/**
 * Initialize LLM based on configured provider
 * Supports: openai, groq
 */
function initializeLLM() {
  const provider = process.env.LLM_PROVIDER || "openai"

  if (provider === "openai") {
    llmModel = new ChatOpenAI({
      modelName: "gpt-3.5-turbo",
      temperature: 0.7,
      apiKey: process.env.OPENAI_API_KEY,
      maxTokens: 1024,
    })
    logger.info("OpenAI LLM initialized")
  } else if (provider === "groq") {
    // For Groq, we'll use REST API directly since LangChain Groq support is limited
    logger.info("Groq provider selected - using REST API")
  }

  return llmModel
}

/**
 * Generate response using LLM with context
 *
 * @param {string} userMessage - The user's question
 * @param {object} context - Context data from RAG or real-time services
 * @returns {Promise<string>} - Generated response
 */
export async function generateChatResponse(userMessage, context) {
  try {
    const provider = process.env.LLM_PROVIDER || "openai"

    if (provider === "groq") {
      return await generateGroqResponse(userMessage, context)
    } else {
      return await generateOpenAIResponse(userMessage, context)
    }
  } catch (error) {
    logger.error("Error generating LLM response", { error: error.message })
    throw error
  }
}

/**
 * Generate response using OpenAI API
 *
 * @param {string} userMessage - The user's question
 * @param {object} context - Context data
 * @returns {Promise<string>} - Generated response
 */
async function generateOpenAIResponse(userMessage, context) {
  try {
    if (!llmModel) {
      initializeLLM()
    }

    // Build system prompt with context
    const systemPrompt = buildSystemPrompt(context)

    // Call LLM
    const response = await llmModel.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ])

    return response.content
  } catch (error) {
    logger.error("OpenAI API error", { error: error.message })
    throw error
  }
}

/**
 * Generate response using Groq API
 *
 * @param {string} userMessage - The user's question
 * @param {object} context - Context data
 * @returns {Promise<string>} - Generated response
 */
async function generateGroqResponse(userMessage, context) {
  try {
    const systemPrompt = buildSystemPrompt(context)

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "mixtral-8x7b-32768",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    )

    return response.data.choices[0].message.content
  } catch (error) {
    logger.error("Groq API error", { error: error.message })
    throw error
  }
}

/**
 * Build a comprehensive system prompt with context
 *
 * @param {object} context - Context from RAG or real-time services
 * @returns {string} - System prompt
 */
function buildSystemPrompt(context) {
  let prompt = `You are an intelligent AI assistant with access to real-time data and knowledge base.

Your role is to:
1. Answer user questions accurately and helpfully
2. Use provided context to inform your responses
3. Cite sources when using context
4. Be honest about limitations and uncertainties
5. Provide structured and clear responses

`

  if (context.type === "realtime") {
    prompt += `\nCURRENT DATA (Real-time):
${JSON.stringify(context.data, null, 2)}

Use this real-time information to answer the user's question.`
  } else if (context.documents && context.documents.length > 0) {
    prompt += `\nRELEVANT KNOWLEDGE BASE DOCUMENTS:
${context.documents
  .slice(0, 3)
  .map((doc, i) => `[Document ${i + 1}]\n${doc.pageContent}`)
  .join("\n\n")}

Use this knowledge base to inform your answer.`
  } else {
    prompt += `\nNo specific context is available. Use your general knowledge to answer.`
  }

  return prompt
}

export { initializeLLM }
