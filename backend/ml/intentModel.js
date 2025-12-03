/**
 * ML-based Intent Classification
 * Uses Naive Bayes classifier with training data
 * Automatically falls back to rule-based detection if confidence < 0.6
 */

import { createLogger } from "../src/utils/logger.js"

const logger = createLogger()

// Training data for the ML model
const TRAINING_DATA = [
  // Realtime - Weather
  { text: "what is the weather", intent: "realtime", type: "weather" },
  { text: "weather forecast", intent: "realtime", type: "weather" },
  { text: "is it raining", intent: "realtime", type: "weather" },
  { text: "temperature today", intent: "realtime", type: "weather" },
  { text: "will it snow", intent: "realtime", type: "weather" },
  { text: "how hot is it", intent: "realtime", type: "weather" },

  // Realtime - News
  { text: "latest news", intent: "realtime", type: "news" },
  { text: "breaking news today", intent: "realtime", type: "news" },
  { text: "what is trending", intent: "realtime", type: "news" },
  { text: "current events", intent: "realtime", type: "news" },
  { text: "headlines", intent: "realtime", type: "news" },

  // Realtime - Currency
  { text: "exchange rate", intent: "realtime", type: "currency" },
  { text: "usd to eur", intent: "realtime", type: "currency" },
  { text: "bitcoin price", intent: "realtime", type: "currency" },
  { text: "convert currency", intent: "realtime", type: "currency" },

  // RAG - Knowledge base
  { text: "explain artificial intelligence", intent: "rag", type: null },
  { text: "tell me about machine learning", intent: "rag", type: null },
  { text: "what is data science", intent: "rag", type: null },
  { text: "define blockchain", intent: "rag", type: null },
  { text: "how does deep learning work", intent: "rag", type: null },

  // General - Conversation
  { text: "hello", intent: "general", type: null },
  { text: "hi there", intent: "general", type: null },
  { text: "thanks for your help", intent: "general", type: null },
  { text: "can you help me", intent: "general", type: null },
]

/**
 * Naive Bayes Classifier for Intent Detection
 */
class NaiveBayesIntentClassifier {
  constructor() {
    this.vocabulary = new Set()
    this.wordFreq = {}
    this.classPrior = {}
    this.classWordProb = {}
    this.isTrained = false
  }

  /**
   * Extract words (unigrams and bigrams) from text
   */
  extractFeatures(text) {
    const cleaned = text.toLowerCase().replace(/[^\w\s]/g, "")
    const words = cleaned.split(/\s+/).filter((w) => w.length > 0)

    // Unigrams
    const features = [...words]

    // Bigrams (2-word sequences)
    for (let i = 0; i < words.length - 1; i++) {
      features.push(`${words[i]}_${words[i + 1]}`)
    }

    return features
  }

  /**
   * Train the classifier on training data
   */
  train(trainingData) {
    const classExamples = {}

    // Organize examples by class
    trainingData.forEach((example) => {
      if (!classExamples[example.intent]) {
        classExamples[example.intent] = []
      }
      classExamples[example.intent].push(example.text)
    })

    // Calculate class priors
    const totalExamples = trainingData.length
    Object.keys(classExamples).forEach((className) => {
      this.classPrior[className] = classExamples[className].length / totalExamples
    })

    // Calculate word frequencies per class
    Object.keys(classExamples).forEach((className) => {
      this.classWordProb[className] = {}
      const allText = classExamples[className].join(" ")
      const features = this.extractFeatures(allText)

      const featureFreq = {}
      features.forEach((feature) => {
        featureFreq[feature] = (featureFreq[feature] || 0) + 1
        this.vocabulary.add(feature)
      })

      // Convert frequencies to probabilities (Laplace smoothing)
      const totalFeatures = features.length
      Object.keys(featureFreq).forEach((feature) => {
        this.classWordProb[className][feature] = (featureFreq[feature] + 1) / (totalFeatures + this.vocabulary.size)
      })
    })

    this.isTrained = true
    logger.info("ML Intent Classifier trained successfully")
  }

  /**
   * Predict intent for new text
   */
  predict(text) {
    if (!this.isTrained) {
      throw new Error("Model not trained")
    }

    const features = this.extractFeatures(text)
    const scores = {}

    // Calculate log probabilities for each class
    Object.keys(this.classPrior).forEach((className) => {
      scores[className] = Math.log(this.classPrior[className])

      features.forEach((feature) => {
        const prob = this.classWordProb[className][feature] || 1 / (1 + this.vocabulary.size)
        scores[className] += Math.log(prob)
      })
    })

    // Find class with highest score
    let bestClass = null
    let bestScore = Number.NEGATIVE_INFINITY

    Object.entries(scores).forEach(([className, score]) => {
      if (score > bestScore) {
        bestScore = score
        bestClass = className
      }
    })

    // Normalize score to confidence (0-1)
    const allScores = Object.values(scores)
    const maxScore = Math.max(...allScores)
    const minScore = Math.min(...allScores)
    const confidence = minScore === maxScore ? 0.5 : (bestScore - minScore) / (maxScore - minScore)

    return {
      intent: bestClass,
      confidence,
      scores,
    }
  }
}

// Initialize and train classifier
const mlClassifier = new NaiveBayesIntentClassifier()
mlClassifier.train(TRAINING_DATA)

/**
 * Predict intent using ML model
 * Falls back to rule-based if confidence < 0.6
 */
export function predictIntentML(message, ruleBased) {
  try {
    const mlResult = mlClassifier.predict(message)

    // If ML confidence is low, use rule-based fallback
    if (mlResult.confidence < 0.6) {
      logger.info(`ML confidence low (${mlResult.confidence.toFixed(2)}), using rule-based detection`)
      return {
        ...ruleBased,
        method: "rule-based",
        mlConfidence: mlResult.confidence,
      }
    }

    logger.info(`ML prediction: ${mlResult.intent} (confidence: ${mlResult.confidence.toFixed(2)})`)

    return {
      intent: mlResult.intent,
      confidence: mlResult.confidence,
      method: "ml",
      scores: mlResult.scores,
    }
  } catch (err) {
    logger.warn("ML prediction failed, using rule-based:", err.message)
    return {
      ...ruleBased,
      method: "rule-based",
      error: "ML prediction failed",
    }
  }
}

/**
 * Get model statistics
 */
export function getModelStats() {
  return {
    isTrained: mlClassifier.isTrained,
    vocabularySize: mlClassifier.vocabulary.size,
    classPriors: mlClassifier.classPrior,
    trainingExamples: TRAINING_DATA.length,
  }
}

export default mlClassifier
