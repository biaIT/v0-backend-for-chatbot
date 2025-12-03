"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { AlertCircle, Loader2, Save, LogOut } from "lucide-react"
import Link from "next/link"

interface UserProfile {
  id: string
  email: string
  name?: string
  phone?: string
  avatarUrl?: string
  role: string
  status: string
  totalQueries: number
  totalPdfUploads: number
  lastLoginAt?: string
  createdAt: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("accessToken")
        if (!token) {
          router.push("/login")
          return
        }

        const response = await fetch("http://localhost:5000/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch profile")
        }

        const data = await response.json()
        setUser(data.user)
        setName(data.user.name || "")
        setPhone(data.user.phone || "")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile")
        setTimeout(() => router.push("/login"), 2000)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    setError(null)
    setSuccess(false)

    try {
      const token = localStorage.getItem("accessToken")
      const response = await fetch("http://localhost:5000/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, phone }),
      })

      if (!response.ok) {
        throw new Error("Failed to update profile")
      }

      const data = await response.json()
      setUser(data.user)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed")
    } finally {
      setUpdating(false)
    }
  }

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("accessToken")
      await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    } catch (err) {
      console.error("Logout error:", err)
    } finally {
      localStorage.removeItem("accessToken")
      localStorage.removeItem("user")
      router.push("/login")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Card className="bg-slate-800 border-slate-700 p-6">
          <p className="text-red-400">Failed to load profile</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">My Profile</h1>
          <Link href="/chat">
            <Button className="bg-blue-600 hover:bg-blue-700">Back to Chat</Button>
          </Link>
        </div>

        {error && (
          <Card className="mb-4 bg-red-900/20 border-red-700 p-4">
            <div className="flex items-center gap-2 text-red-200">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          </Card>
        )}

        {success && (
          <Card className="mb-4 bg-green-900/20 border-green-700 p-4">
            <div className="text-green-200">Profile updated successfully!</div>
          </Card>
        )}

        <div className="grid gap-4">
          {/* Account Status */}
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Account Status</h2>
            <div className="space-y-3">
              <div>
                <p className="text-slate-400 text-sm">Status</p>
                <p className="text-white font-medium capitalize">
                  {user.status === "approved" && <span className="text-green-400">Approved</span>}
                  {user.status === "pending" && <span className="text-yellow-400">Pending Approval</span>}
                  {user.status === "rejected" && <span className="text-red-400">Rejected</span>}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Role</p>
                <p className="text-white font-medium capitalize">{user.role}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Member Since</p>
                <p className="text-white font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </Card>

          {/* Usage Statistics */}
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Usage Statistics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-700 rounded p-4">
                <p className="text-slate-400 text-sm">Total Queries</p>
                <p className="text-2xl font-bold text-blue-400">{user.totalQueries}</p>
              </div>
              <div className="bg-slate-700 rounded p-4">
                <p className="text-slate-400 text-sm">PDFs Uploaded</p>
                <p className="text-2xl font-bold text-blue-400">{user.totalPdfUploads}</p>
              </div>
            </div>
          </Card>

          {/* Edit Profile */}
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Edit Profile</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email (Read-only)</label>
                <Input
                  type="email"
                  value={user.email}
                  disabled
                  className="bg-slate-700 border-slate-600 text-slate-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  disabled={updating}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Phone (Optional)</label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  disabled={updating}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                />
              </div>

              <Button type="submit" disabled={updating} className="w-full bg-blue-600 hover:bg-blue-700">
                {updating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </form>
          </Card>

          {/* Logout */}
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-red-700 text-red-400 hover:bg-red-900/20 bg-transparent"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  )
}
