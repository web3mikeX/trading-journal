"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { 
  MailIcon, 
  Github,
  Chrome,
  ArrowRightIcon
} from "lucide-react"
import ThemeToggle from "@/components/ThemeToggle"
import { useTheme } from "@/components/ThemeProvider"
import { getThemeClasses } from "@/lib/theme"

export default function SignIn() {
  const { theme } = useTheme()
  const themeClasses = getThemeClasses(theme)
  
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email,
        redirect: false,
      })

      if (result?.error) {
        setError("Failed to sign in")
      } else {
        router.push("/dashboard")
      }
    } catch {
      setError("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleProviderSignIn = async (provider: string) => {
    setLoading(true)
    try {
      await signIn(provider, { callbackUrl: "/dashboard" })
    } catch {
      setError("Failed to sign in with " + provider)
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center ${themeClasses.background} relative`}>
      {/* Theme toggle button */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle variant="standalone" />
      </div>
      {/* Background Effects - only show in dark mode */}
      {theme === 'dark' && (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(120,219,226,0.4),rgba(255,255,255,0))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,119,198,0.3),rgba(255,255,255,0))]" />
        </>
      )}
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 max-w-md w-full mx-4"
      >
        <div className={`${themeClasses.surface} rounded-xl p-8 shadow-2xl`}>
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className={`text-3xl font-bold ${themeClasses.text} mb-2`}>
              Trading Journal
            </h1>
            <p className={themeClasses.textSecondary}>
              Sign in to track your trading performance
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg"
            >
              <p className="text-red-400 text-sm">{error}</p>
            </motion.div>
          )}

          {/* Quick Demo Sign In */}
          <div className="mb-6">
            <form onSubmit={handleCredentialsSignIn} className="space-y-4">
              <div>
                <label className={`block text-sm ${themeClasses.textSecondary} mb-2`}>
                  Email (Demo Mode)
                </label>
                <div className="relative">
                  <MailIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${themeClasses.textMuted} w-5 h-5`} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 ${themeClasses.input}`}
                    placeholder="Enter any email"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Demo Button */}
          <div className="mb-6">
            <button
              onClick={() => setEmail("demo@example.com")}
              className="w-full py-2 px-4 bg-green-600/20 hover:bg-green-600/30 border border-green-500/50 text-green-400 rounded-lg transition-colors text-sm"
            >
              🚀 Fill Demo Email
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-900/50 text-gray-400">Or continue with</span>
            </div>
          </div>

          {/* OAuth Providers */}
          <div className="space-y-3">
            <button
              onClick={() => handleProviderSignIn("google")}
              disabled={loading}
              className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-colors flex items-center justify-center space-x-3 disabled:opacity-50"
            >
              <Chrome className="w-5 h-5" />
              <span>Continue with Google</span>
            </button>

            <button
              onClick={() => handleProviderSignIn("github")}
              disabled={loading}
              className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-colors flex items-center justify-center space-x-3 disabled:opacity-50"
            >
              <Github className="w-5 h-5" />
              <span>Continue with GitHub</span>
            </button>
          </div>

          {/* Demo Info */}
          <div className="mt-8 p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
            <p className="text-blue-300 text-sm">
              <strong>Demo Mode:</strong> Enter any email to create/access a demo account. No password required!
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}