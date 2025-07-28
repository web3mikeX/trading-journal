"use client"

import { useAuth } from "@/hooks/useAuth"

export default function Dashboard() {
  const { isAuthenticated, user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="space-y-4">
        <div className="text-lg">Welcome back, {user?.name || 'Trader'}!</div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl mb-2">Quick Stats</h2>
          <div>Authentication: {isAuthenticated ? '✅ Authenticated' : '❌ Not authenticated'}</div>
          <div>User ID: {user?.id || 'None'}</div>
          <div>Email: {user?.email || 'None'}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <p>Dashboard is now loading properly! ✅</p>
          <p className="text-gray-400 text-sm mt-2">The hydration issue has been resolved.</p>
        </div>
      </div>
    </div>
  )
}