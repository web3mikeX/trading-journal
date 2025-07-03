"use client"

import { SunIcon, MoonIcon } from "lucide-react"
import { useTheme } from "./ThemeProvider"
import { motion } from "framer-motion"

interface ThemeToggleProps {
  variant?: "header" | "standalone"
  className?: string
}

export default function ThemeToggle({ variant = "standalone", className = "" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()

  const baseClasses = "flex items-center justify-center transition-all duration-200"
  
  // Theme-aware styling
  const getVariantClasses = () => {
    if (variant === "header") {
      return theme === "light" 
        ? "w-8 h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 rounded-lg"
        : "w-8 h-8 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg"
    }
    
    return theme === "light"
      ? "w-10 h-10 bg-white/90 hover:bg-white border border-gray-200/50 rounded-xl text-gray-700 hover:text-gray-900 shadow-sm hover:shadow-md"
      : "w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl text-white hover:scale-105"
  }

  return (
    <motion.button
      onClick={toggleTheme}
      className={`${baseClasses} ${getVariantClasses()} ${className}`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: variant === "standalone" && theme === "dark" ? 1.05 : 1 }}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        exit={{ rotate: 90, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {theme === 'dark' ? (
          <SunIcon className="w-4 h-4" />
        ) : (
          <MoonIcon className="w-4 h-4" />
        )}
      </motion.div>
    </motion.button>
  )
}