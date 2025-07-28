"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"

export default function DashboardTest() {
  const [mounted, setMounted] = useState(false)
  const { isAuthenticated, user, isLoading } = useAuth()

  useEffect(() => {
    console.log('Dashboard test: Setting mounted to true')
    setMounted(true)
  }, [])

  console.log('Dashboard test render:', { mounted, isLoading, isAuthenticated, user })

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div>Not mounted yet...</div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div>Auth loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl mb-4">Dashboard Test</h1>
      <div className="space-y-2">
        <div>Mounted: {mounted ? 'Yes' : 'No'}</div>
        <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
        <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
        <div>User: {user?.name || 'None'}</div>
      </div>
    </div>
  )
}