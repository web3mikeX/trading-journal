"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/SimpleAuth"

export default function SignIn() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted!", { email, password })
    setError("")
    setLoading(true)

    try {
      console.log("Calling login function...")
      const success = await login(email, password)
      console.log("Login result:", success)
      if (success) {
        console.log("Login successful, redirecting to dashboard...")
        router.push("/dashboard")
      } else {
        console.log("Login failed, showing error message")
        setError("Invalid credentials")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      {/* TEST: This button should be very visible */}
      <div className="absolute top-4 left-4">
        <button
          onClick={() => {
            setEmail("demo")
            setPassword("password")
            alert("Credentials filled!")
          }}
          className="bg-red-500 text-white px-6 py-3 rounded font-bold text-lg shadow-lg"
        >
          🚀 TEST AUTO-FILL
        </button>
      </div>
      
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Trading Journal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            Sign in to your account
          </p>
          <p className="mt-2 text-center text-xs text-yellow-400 font-bold">
            ✅ FIXED: Updated signin page - you should see red button!
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>

          <div className="text-sm text-gray-300">
            <p>Demo credentials:</p>
            <p>Email: demo@example.com or demo or admin</p>
            <p>Password: password or admin</p>
          </div>
        </form>

        {/* Auto-fill button outside form for better visibility */}
        <div className="mt-6">
          <button
            type="button"
            onClick={() => {
              console.log("Quick login button clicked")
              setEmail("demo")
              setPassword("password")
            }}
            className="w-full flex justify-center py-3 px-4 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors shadow-lg"
          >
            🚀 Fill Demo Credentials & Try Login
          </button>
        </div>
      </div>
    </div>
  )
}