"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { Loader2, AlertCircle, Trash2, RefreshCw, Shield, Users, FileText, TrendingUp, Key, LogOut } from "lucide-react"
import Link from "next/link"

interface Session {
  id: string
  createdAt: string
  lastUsed: string
  queryCount: number
  pdfCount: number
  isActive: boolean
}

interface AdminStats {
  timestamp: string
  sessions: {
    active: number
    total: number
  }
  analytics: Record<string, any>
}

interface PDFInfo {
  documentId: string
  filename: string
  sessionId: string
  uploadedAt: string
  pageCount?: number
  chunks?: number
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [pdfs, setPdfs] = useState<PDFInfo[]>([])
  const [apiUsage, setApiUsage] = useState(null)
  const [activeTab, setActiveTab] = useState("overview")

  const fetchData = async (key: string) => {
    setLoading(true)
    setError(null)

    try {
      const headers = { "X-Admin-Key": key }

      const [statsRes, sessionsRes, pdfsRes, usageRes] = await Promise.all([
        fetch("http://localhost:5000/api/admin/stats", { headers }),
        fetch("http://localhost:5000/api/admin/sessions", { headers }),
        fetch("http://localhost:5000/api/admin/pdfs", { headers }),
        fetch("http://localhost:5000/api/admin/api-usage", { headers }),
      ])

      if (!statsRes.ok || !sessionsRes.ok || !pdfsRes.ok || !usageRes.ok) {
        throw new Error("Unauthorized or failed to fetch")
      }

      const statsData = await statsRes.json()
      const sessionsData = await sessionsRes.json()
      const pdfsData = await pdfsRes.json()
      const usageData = await usageRes.json()

      setStats(statsData)
      setSessions(sessionsData.sessions || [])
      setPdfs(pdfsData.pdfs || [])
      setApiUsage(usageData)
      setIsAuthenticated(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed")
    } finally {
      setLoading(false)
    }
  }

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminKey.trim()) {
      setError("Please enter admin key")
      return
    }
    fetchData(adminKey)
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("Delete this session? This will remove all associated data.")) return

    try {
      const response = await fetch(`http://localhost:5000/api/admin/sessions/${sessionId}`, {
        method: "DELETE",
        headers: { "X-Admin-Key": adminKey },
      })

      if (response.ok) {
        setSessions(sessions.filter((s) => s.id !== sessionId))
      } else {
        setError("Failed to delete session")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting session")
    }
  }

  const handleDeletePDF = async (documentId: string) => {
    if (!confirm("Delete this PDF?")) return

    try {
      const response = await fetch(`http://localhost:5000/api/admin/pdfs/${documentId}`, {
        method: "DELETE",
        headers: { "X-Admin-Key": adminKey },
      })

      if (response.ok) {
        setPdfs(pdfs.filter((p) => p.documentId !== documentId))
      } else {
        setError("Failed to delete PDF")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting PDF")
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="mx-auto max-w-md">
          <Card className="bg-slate-800 border-slate-700 p-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Shield className="w-8 h-8 text-blue-400" />
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Key className="w-4 h-4 inline mr-2" />
                  Admin Key
                </label>
                <Input
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder="Enter admin key"
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-900/20 border border-red-700 rounded text-red-200 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Access Dashboard
              </Button>
            </form>

            <p className="text-xs text-slate-400 mt-4 text-center">Default: admin123 (set ADMIN_KEY in .env)</p>
          </Card>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-slate-400 text-sm">System analytics and management</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => fetchData(adminKey)}
              variant="outline"
              className="text-slate-300 border-slate-600 hover:bg-slate-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Link href="/">
              <Button variant="outline" className="text-slate-300 border-slate-600 hover:bg-slate-700 bg-transparent">
                <LogOut className="w-4 h-4 mr-2" />
                Chat
              </Button>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-700">
          {["overview", "sessions", "pdfs", "usage"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium text-sm capitalize transition ${
                activeTab === tab ? "text-blue-400 border-b-2 border-blue-400" : "text-slate-400 hover:text-slate-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {error && (
          <Card className="mb-4 p-3 bg-red-900/20 border-red-700 text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </Card>
        )}

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-slate-800 border-slate-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Active Sessions</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats.sessions.active}</p>
                </div>
                <Users className="w-8 h-8 text-blue-400 opacity-50" />
              </div>
            </Card>

            <Card className="bg-slate-800 border-slate-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Sessions</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats.sessions.total}</p>
                </div>
                <Users className="w-8 h-8 text-green-400 opacity-50" />
              </div>
            </Card>

            <Card className="bg-slate-800 border-slate-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total PDFs</p>
                  <p className="text-2xl font-bold text-white mt-1">{pdfs.length}</p>
                </div>
                <FileText className="w-8 h-8 text-purple-400 opacity-50" />
              </div>
            </Card>

            <Card className="bg-slate-800 border-slate-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Cache Hit Rate</p>
                  <p className="text-2xl font-bold text-white mt-1">{apiUsage?.cache?.hitRate || "N/A"}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-400 opacity-50" />
              </div>
            </Card>
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === "sessions" && (
          <Card className="bg-slate-800 border-slate-700">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-700 bg-slate-700/50">
                  <tr>
                    <th className="text-left p-4 text-slate-300">Session ID</th>
                    <th className="text-left p-4 text-slate-300">Created</th>
                    <th className="text-left p-4 text-slate-300">Last Used</th>
                    <th className="text-left p-4 text-slate-300">Queries</th>
                    <th className="text-left p-4 text-slate-300">PDFs</th>
                    <th className="text-left p-4 text-slate-300">Status</th>
                    <th className="text-left p-4 text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-slate-700/50">
                      <td className="p-4 text-slate-100 font-mono text-xs">{session.id.slice(0, 8)}...</td>
                      <td className="p-4 text-slate-400">{new Date(session.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 text-slate-400">{new Date(session.lastUsed).toLocaleTimeString()}</td>
                      <td className="p-4 text-slate-100">{session.queryCount}</td>
                      <td className="p-4 text-slate-100">{session.pdfCount}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            session.isActive ? "bg-green-900/20 text-green-300" : "bg-slate-700 text-slate-300"
                          }`}
                        >
                          {session.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleDeleteSession(session.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* PDFs Tab */}
        {activeTab === "pdfs" && (
          <Card className="bg-slate-800 border-slate-700">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-700 bg-slate-700/50">
                  <tr>
                    <th className="text-left p-4 text-slate-300">Filename</th>
                    <th className="text-left p-4 text-slate-300">Session ID</th>
                    <th className="text-left p-4 text-slate-300">Uploaded</th>
                    <th className="text-left p-4 text-slate-300">Pages</th>
                    <th className="text-left p-4 text-slate-300">Chunks</th>
                    <th className="text-left p-4 text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {pdfs.map((pdf) => (
                    <tr key={pdf.documentId} className="hover:bg-slate-700/50">
                      <td className="p-4 text-slate-100">{pdf.filename}</td>
                      <td className="p-4 text-slate-400 font-mono text-xs">{pdf.sessionId.slice(0, 8)}...</td>
                      <td className="p-4 text-slate-400">{new Date(pdf.uploadedAt).toLocaleDateString()}</td>
                      <td className="p-4 text-slate-100">{pdf.pageCount || "N/A"}</td>
                      <td className="p-4 text-slate-100">{pdf.chunks || "N/A"}</td>
                      <td className="p-4">
                        <button
                          onClick={() => handleDeletePDF(pdf.documentId)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* API Usage Tab */}
        {activeTab === "usage" && apiUsage && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800 border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">API Calls by Type</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Weather", value: apiUsage.realtime.weather },
                      { name: "News", value: apiUsage.realtime.news },
                      { name: "Currency", value: apiUsage.realtime.currency },
                      { name: "RAG", value: apiUsage.rag.queries },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#3b82f6" />
                    <Cell fill="#ef4444" />
                    <Cell fill="#8b5cf6" />
                    <Cell fill="#ec4899" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="bg-slate-800 border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Cache Performance</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-slate-300 mb-2">
                    <span>Cache Hits</span>
                    <span className="font-semibold">{apiUsage.cache.hits}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded h-2">
                    <div
                      className="bg-green-500 h-2 rounded"
                      style={{
                        width: `${Math.min(
                          (apiUsage.cache.hits / (apiUsage.cache.hits + apiUsage.cache.misses || 1)) * 100,
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm text-slate-300 mb-2">
                    <span>Cache Misses</span>
                    <span className="font-semibold">{apiUsage.cache.misses}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded h-2">
                    <div
                      className="bg-red-500 h-2 rounded"
                      style={{
                        width: `${Math.min(
                          (apiUsage.cache.misses / (apiUsage.cache.hits + apiUsage.cache.misses || 1)) * 100,
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-700">
                  <p className="text-slate-400 text-sm">Hit Rate: {apiUsage.cache.hitRate}</p>
                  <p className="text-slate-400 text-sm">Blocked Requests: {apiUsage.rateLimiter.blockedRequests}</p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
