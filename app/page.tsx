"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Loader2,
  Send,
  Globe,
  Database,
  FileUp,
  X,
  ChevronDown,
  ChevronUp,
  File,
  Trash2,
  AlertCircle,
  Sparkles,
  Zap,
  Mic,
  MicOff,
  Volume2,
} from "lucide-react"
import { useVoice } from "@/hooks/use-voice"
import { MessageRenderer } from "@/components/message-renderer"
import { PDFViewer } from "@/components/pdf-viewer"

interface SourceDetail {
  source: "realtime" | "rag" | "pdf"
  confidence: number
  metadata?: Record<string, any>
  content?: string
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  intent?: string
  sources?: SourceDetail[]
  confidenceScore?: number
  timestamp: Date
}

interface PDFFile {
  documentId: string
  filename: string
  pageCount: number
  chunks: number
  uploadedAt: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string>("")
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([])
  const [uploadingPDF, setUploadingPDF] = useState(false)
  const [showPDFPanel, setShowPDFPanel] = useState(false)
  const [expandedSourceId, setExpandedSourceId] = useState<string | null>(null)
  const [demoQueries, setDemoQueries] = useState<any[]>([])
  const [showDemoPanel, setShowDemoPanel] = useState(false)
  const [showSelfTest, setShowSelfTest] = useState(false)
  const [selfTestResults, setSelfTestResults] = useState<any>(null)
  const [runningTest, setRunningTest] = useState(false)
  const [showPDFViewer, setShowPDFViewer] = useState<string | null>(null)
  const [selectedPDFFile, setSelectedPDFFile] = useState<PDFFile | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const initSession = async () => {
      try {
        const response = await fetch("http://localhost:5000/health")
        if (response.ok) {
          const headers = new Headers()
          const sessionHeader = response.headers.get("X-Session-ID")
          if (sessionHeader) {
            setSessionId(sessionHeader)
          } else {
            setSessionId(`session_${Date.now()}`)
          }
        }
      } catch (err) {
        console.error("Session init error:", err)
        setSessionId(`session_${Date.now()}`)
      }
      await loadPDFs()
    }

    initSession()
  }, [])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Session-ID": sessionId,
        },
        body: JSON.stringify({ message: input }),
      })

      if (!response.ok) {
        throw new Error(`Backend error: ${response.statusText}`)
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply,
        intent: data.intent,
        sources: data.sources,
        confidenceScore: data.confidenceScore,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to get response"
      setError(errorMessage)
      console.error("Chat error:", err)
    } finally {
      setLoading(false)
    }
  }

  const loadPDFs = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/pdf/list", {
        headers: {
          "X-Session-ID": sessionId,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setPdfFiles(data.pdfs || [])
      }
    } catch (err) {
      console.error("Error loading PDFs:", err)
    }
  }

  const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingPDF(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("http://localhost:5000/api/pdf/upload", {
        method: "POST",
        headers: {
          "X-Session-ID": sessionId,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Upload failed")
      }

      const data = await response.json()
      setError(null)

      await loadPDFs()

      const systemMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `PDF "${data.filename}" uploaded successfully! Created ${data.chunksCreated} text chunks for semantic search.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, systemMessage])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to upload PDF"
      setError(errorMessage)
      console.error("PDF upload error:", err)
    } finally {
      setUploadingPDF(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const deletePDF = async (documentId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/pdf/${documentId}`, {
        method: "DELETE",
        headers: {
          "X-Session-ID": sessionId,
        },
      })

      if (response.ok) {
        await loadPDFs()
      }
    } catch (err) {
      console.error("Error deleting PDF:", err)
    }
  }

  const runSelfTest = async () => {
    setRunningTest(true)
    try {
      const response = await fetch("http://localhost:5000/api/selftest")
      const data = await response.json()
      setSelfTestResults(data)
      setShowSelfTest(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Self-test failed")
    } finally {
      setRunningTest(false)
    }
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "realtime":
        return <Globe className="w-4 h-4" />
      case "rag":
        return <Database className="w-4 h-4" />
      case "pdf":
        return <File className="w-4 h-4" />
      default:
        return null
    }
  }

  const getSourceColor = (source: string) => {
    switch (source) {
      case "realtime":
        return "text-blue-400"
      case "pdf":
        return "text-green-400"
      case "rag":
        return "text-purple-400"
      default:
        return "text-gray-400"
    }
  }

  const renderSourceBadge = (msg: Message) => {
    if (!msg.sources || msg.sources.length === 0) return null

    return (
      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <span>Sources ({msg.sources.length})</span>
          <div className="h-px flex-1 bg-slate-600" />
        </div>

        {msg.sources.map((source, idx) => (
          <div key={idx} className="bg-slate-700/50 rounded-lg p-2 border border-slate-600 text-xs">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setExpandedSourceId(expandedSourceId === `${msg.id}-${idx}` ? null : `${msg.id}-${idx}`)}
            >
              <div className="flex items-center gap-2">
                <span className={getSourceColor(source.source)}>{getSourceIcon(source.source)}</span>
                <span className="capitalize font-medium">{source.source}</span>
                <span className="text-slate-400">({Math.round(source.confidence * 100)}%)</span>
              </div>
              {expandedSourceId === `${msg.id}-${idx}` ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>

            {expandedSourceId === `${msg.id}-${idx}` && source.metadata && (
              <div className="mt-2 ml-6 text-slate-400 text-xs space-y-1">
                {source.metadata.type && <div>Type: {source.metadata.type}</div>}
                {source.metadata.documentsFound && <div>Documents: {source.metadata.documentsFound}</div>}
                {source.metadata.apiUsed && <div>API: {source.metadata.apiUsed}</div>}
                {source.metadata.cached !== undefined && <div>Cached: {source.metadata.cached ? "Yes" : "No"}</div>}
              </div>
            )}
          </div>
        ))}

        {msg.confidenceScore !== undefined && (
          <div className="text-xs text-slate-400">Overall Confidence: {Math.round(msg.confidenceScore * 100)}%</div>
        )}
      </div>
    )
  }

  const sendDemoQuery = (query: string) => {
    setInput(query)
    setTimeout(() => {
      const form = document.querySelector("form") as HTMLFormElement
      if (form) form.dispatchEvent(new Event("submit", { bubbles: true }))
    }, 0)
  }

  useEffect(() => {
    const loadDemoQueries = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/examples/queries")
        if (response.ok) {
          const data = await response.json()
          setDemoQueries(data.queries || [])
        }
      } catch (err) {
        console.error("Error loading demo queries:", err)
      }
    }

    loadDemoQueries()
  }, [])

  const { isListening, startListening, speak, isSpeaking } = useVoice({
    onTranscript: (transcript) => {
      setInput(transcript)
    },
    onError: (error) => {
      setError(`Voice error: ${error}`)
    },
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="mx-auto max-w-4xl flex flex-col h-screen gap-4">
        {/* Header */}
        <div className="flex items-center justify-between pt-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Intelligent Chatbot</h1>
            <p className="text-slate-400 text-sm">Real-time data + RAG-powered responses + Custom PDFs</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={runSelfTest}
              disabled={runningTest}
              className="px-4 py-2 rounded-lg flex items-center gap-2 bg-slate-700 text-slate-300 hover:bg-slate-600 transition disabled:opacity-50"
              title="Run system self-test"
            >
              {runningTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              <span className="text-sm font-medium">Test</span>
            </button>
            <button
              onClick={() => setShowDemoPanel(!showDemoPanel)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
                showDemoPanel
                  ? "bg-yellow-600/20 text-yellow-400 border border-yellow-500"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Demo</span>
            </button>
            <button
              onClick={() => setShowPDFPanel(!showPDFPanel)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
                showPDFPanel
                  ? "bg-green-600/20 text-green-400 border border-green-500"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              <FileUp className="w-4 h-4" />
              <span className="text-sm font-medium">PDFs ({pdfFiles.length})</span>
            </button>
          </div>
        </div>

        {showSelfTest && selfTestResults && (
          <Card className="bg-slate-800 border-slate-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                System Self-Test Results
              </h3>
              <button onClick={() => setShowSelfTest(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-sm text-slate-300">
                <p>
                  Passed: <span className="text-green-400 font-semibold">{selfTestResults.passed}</span>
                </p>
                <p>
                  Failed:{" "}
                  <span
                    className={
                      selfTestResults.failed > 0 ? "text-red-400 font-semibold" : "text-green-400 font-semibold"
                    }
                  >
                    {selfTestResults.failed}
                  </span>
                </p>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selfTestResults.tests.map((test: any, idx: number) => (
                  <div key={idx} className="p-2 bg-slate-700/50 rounded text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-100">{test.name}</span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          test.status === "passed"
                            ? "bg-green-900/20 text-green-300"
                            : test.status === "failed"
                              ? "bg-red-900/20 text-red-300"
                              : "bg-yellow-900/20 text-yellow-300"
                        }`}
                      >
                        {test.status}
                      </span>
                    </div>
                    {test.note && <p className="text-slate-400 mt-1">{test.note}</p>}
                    {test.error && <p className="text-red-400 mt-1">{test.error}</p>}
                  </div>
                ))}
              </div>

              <p className="text-xs text-slate-400 border-t border-slate-700 pt-3">{selfTestResults.summary}</p>
            </div>
          </Card>
        )}

        <div className="flex gap-4 flex-1 min-h-0">
          {showDemoPanel && (
            <div className="w-72 flex flex-col bg-slate-800 border border-slate-700 rounded-lg p-4 overflow-hidden">
              <h2 className="text-lg font-semibold text-white mb-4">Try Demo Queries</h2>

              <div className="flex-1 overflow-y-auto space-y-2">
                {demoQueries.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">Loading demo queries...</p>
                ) : (
                  demoQueries.map((category, idx) => (
                    <div key={idx} className="space-y-2">
                      <p className="text-xs font-semibold text-yellow-300 uppercase tracking-wide">
                        {category.category.replace("-", " ")}
                      </p>
                      {category.queries.map((query: string, qIdx: number) => (
                        <button
                          key={qIdx}
                          onClick={() => sendDemoQuery(query)}
                          disabled={loading}
                          className="w-full text-left p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded border border-slate-600 text-xs text-slate-300 transition disabled:opacity-50"
                        >
                          {query}
                        </button>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* PDF Panel */}
          {showPDFPanel && (
            <div className="w-72 flex flex-col bg-slate-800 border border-slate-700 rounded-lg p-4 overflow-hidden">
              <h2 className="text-lg font-semibold text-white mb-4">Your Documents</h2>

              {/* Upload Area */}
              <div className="mb-4">
                <label className="block w-full p-4 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-slate-500 hover:bg-slate-700/50 transition">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handlePDFUpload}
                    disabled={uploadingPDF}
                    className="hidden"
                  />
                  <div className="text-center">
                    {uploadingPDF ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-400" />
                        <p className="text-xs text-slate-400">Uploading...</p>
                      </>
                    ) : (
                      <>
                        <FileUp className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                        <p className="text-xs text-slate-400 font-medium">Click to upload PDF</p>
                      </>
                    )}
                  </div>
                </label>
              </div>

              {/* PDF List */}
              <div className="flex-1 overflow-y-auto space-y-2">
                {pdfFiles.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No PDFs uploaded yet</p>
                ) : (
                  pdfFiles.map((pdf) => (
                    <div
                      key={pdf.documentId}
                      className="p-2 bg-slate-700/50 rounded border border-slate-600 text-xs space-y-1"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-100 truncate">{pdf.filename}</p>
                          <p className="text-slate-400">
                            {pdf.pageCount} pages • {pdf.chunks} chunks
                          </p>
                        </div>
                        <button
                          onClick={() => deletePDF(pdf.documentId)}
                          className="text-slate-400 hover:text-red-400 flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Chat Container */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Messages */}
            <Card className="flex-1 overflow-y-auto mb-4 bg-slate-800 border-slate-700 p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <div className="text-center">
                    <p className="text-lg mb-2 font-medium">Start a conversation</p>
                    <p className="text-sm">Ask about weather, news, exchange rates, general knowledge, or documents</p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-2xl ${
                          msg.role === "user"
                            ? "bg-blue-600 text-white rounded-2xl rounded-tr-sm"
                            : "bg-slate-700 text-slate-100 rounded-2xl rounded-tl-sm"
                        } px-4 py-3`}
                      >
                        <MessageRenderer content={msg.content} />

                        {msg.role === "assistant" && msg.sources && renderSourceBadge(msg)}

                        {msg.role === "assistant" && (
                          <button
                            onClick={() => speak(msg.content)}
                            disabled={isSpeaking}
                            className="mt-2 text-xs px-2 py-1 bg-slate-600/50 hover:bg-slate-600 rounded transition disabled:opacity-50 flex items-center gap-1"
                            title="Read message aloud"
                          >
                            {isSpeaking ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Volume2 className="w-3 h-3" />
                            )}
                            Speak
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </Card>

            {/* Input Area */}
            <form onSubmit={sendMessage} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message or use voice input..."
                disabled={loading}
                className="flex-1 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              />

              {/* Voice Input Button */}
              <Button
                type="button"
                onClick={startListening}
                disabled={loading || isListening}
                className={`px-4 ${isListening ? "bg-red-600 hover:bg-red-700" : "bg-slate-700 hover:bg-slate-600"}`}
                title="Click to record voice input"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>

              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 px-4">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>

            {error && (
              <div className="p-3 bg-red-900/20 border border-red-700 rounded text-red-200 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>
        </div>
      </div>

      {showPDFViewer && selectedPDFFile && (
        <PDFViewer
          documentId={selectedPDFFile.documentId}
          filename={selectedPDFFile.filename}
          onClose={() => {
            setShowPDFViewer(null)
            setSelectedPDFFile(null)
          }}
        />
      )}
    </div>
  )
}
