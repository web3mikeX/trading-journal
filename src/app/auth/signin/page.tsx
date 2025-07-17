"use client"

import { useState, useEffect, Suspense } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { TrendingUpIcon, Eye, EyeOff, Loader2, Mail, Lock, UserPlus, AlertCircle } from "lucide-react"
import { useTheme } from "@/components/ThemeProvider"
import { getThemeClasses } from "@/lib/theme"
import ThemeToggle from "@/components/ThemeToggle"

function SignInContent() {
  const { theme } = useTheme()
  const themeClasses = getThemeClasses(theme)
  const router = useRouter()
  const searchParams = useSearchParams()

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Check for success message from registration
  useEffect(() => {
    const messageParam = searchParams.get('message')
    if (messageParam) {
      setMessage(messageParam)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password")
      } else {
        const session = await getSession()
        if (session) {
          router.push("/dashboard")
        } else {
          setError("Sign in failed. Please try again.")
        }
      }
    } catch (error) {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError('')
  }

  return (
    <div className={`min-h-screen ${themeClasses.background} flex flex-col items-center justify-center relative overflow-hidden`}>
      {/* Background - Match dashboard theme */}
      <div className={`absolute inset-0 ${themeClasses.background}`}></div>
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle variant="standalone" />
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md px-6 relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg"
          >
            <TrendingUpIcon className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className={`text-4xl font-bold ${themeClasses.text} mb-2`}>
            Welcome to DetaWise
          </h1>
          <p className={`${themeClasses.textSecondary}`}>
            Smart Trading Analytics & Insights
          </p>
        </div>

        {/* Success Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6"
          >
            <p className="text-green-600 dark:text-green-400 text-sm text-center">{message}</p>
          </motion.div>
        )}

        {/* Sign In Form */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={`${themeClasses.surface} rounded-2xl shadow-2xl border ${themeClasses.border} p-8 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95`}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                Email Address
              </label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${themeClasses.textSecondary}`} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border ${themeClasses.border} ${themeClasses.input} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-400`}
                  placeholder="Enter your email"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                Password
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${themeClasses.textSecondary}`} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`w-full pl-10 pr-12 py-3 rounded-lg border ${themeClasses.border} ${themeClasses.input} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-400`}
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !formData.email || !formData.password}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100 shadow-lg flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <TrendingUpIcon className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className={`text-sm ${themeClasses.textSecondary}`}>
              Don't have an account?{' '}
              <Link
                href="/auth/register"
                className={`${themeClasses.accent} hover:text-blue-700 dark:hover:text-blue-300 font-medium inline-flex items-center space-x-1 transition-colors duration-200`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </Link>
            </p>
          </div>

          {/* Demo Mode Notice */}
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-yellow-700 dark:text-yellow-400 text-xs text-center">
              🚧 This is a beta version. Your data is stored locally and may be reset during updates.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default function SignIn() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInContent />
    </Suspense>
  )
}