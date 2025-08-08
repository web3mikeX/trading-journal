"use client"

import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { TrendingUpIcon, AlertTriangle, Home, LogIn } from "lucide-react"
import { useTheme } from "@/components/ThemeProvider"
import { getThemeClasses } from "@/lib/theme"
import ThemeToggle from "@/components/ThemeToggle"

function ErrorContent() {
  const { theme } = useTheme()
  const themeClasses = getThemeClasses(theme)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const error = searchParams.get('error')
  
  let errorMessage = "An authentication error occurred"
  let errorDescription = "Please try signing in again"
  
  switch (error) {
    case 'Configuration':
      errorMessage = "Server Configuration Error"
      errorDescription = "There's an issue with the authentication configuration. Please try again later."
      break
    case 'AccessDenied':
      errorMessage = "Access Denied"
      errorDescription = "You don't have permission to sign in."
      break
    case 'Verification':
      errorMessage = "Verification Error" 
      errorDescription = "The verification token is invalid or has expired."
      break
    case 'Default':
    default:
      errorMessage = "Authentication Error"
      errorDescription = "Unable to sign in. Please try again."
      break
  }

  return (
    <div className={`min-h-screen ${themeClasses.background} flex flex-col items-center justify-center relative overflow-hidden`}>
      {/* Background */}
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
            className="w-16 h-16 bg-red-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg"
          >
            <AlertTriangle className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className={`text-4xl font-bold ${themeClasses.text} mb-2`}>
            {errorMessage}
          </h1>
          <p className={`${themeClasses.textSecondary}`}>
            {errorDescription}
          </p>
        </div>

        {/* Error Details */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={`${themeClasses.surface} rounded-2xl shadow-2xl border ${themeClasses.border} p-8 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95`}
        >
          {/* Error Message */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                {errorMessage}
              </p>
            </div>
            <p className="text-red-500 dark:text-red-400 text-sm mt-2 ml-7">
              {errorDescription}
            </p>
            {error && (
              <p className="text-red-400 dark:text-red-500 text-xs mt-2 ml-7 font-mono">
                Error code: {error}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/auth/signin"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg flex items-center justify-center space-x-2"
            >
              <LogIn className="w-5 h-5" />
              <span>Try Signing In Again</span>
            </Link>
            
            <Link
              href="/auth/register"
              className={`w-full ${themeClasses.border} border-2 ${themeClasses.text} hover:${themeClasses.surface} font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center space-x-2`}
            >
              <TrendingUpIcon className="w-5 h-5" />
              <span>Create New Account</span>
            </Link>
          </div>
        </motion.div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className={`${themeClasses.textSecondary} hover:${themeClasses.text} text-sm inline-flex items-center space-x-1 transition-colors duration-200`}
          >
            <Home className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default function AuthError() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorContent />
    </Suspense>
  )
}