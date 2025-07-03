"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { DownloadIcon, ChevronDownIcon } from "lucide-react"
import { useTheme } from "@/components/ThemeProvider"
import { getThemeClasses } from "@/lib/theme"

interface ExportOption {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  action: () => void
}

interface ExportButtonProps {
  options: ExportOption[]
  disabled?: boolean
  className?: string
}

export default function ExportButton({ options, disabled = false, className = "" }: ExportButtonProps) {
  const { theme } = useTheme()
  const themeClasses = getThemeClasses(theme)
  const [isOpen, setIsOpen] = useState(false)

  if (options.length === 0) return null

  if (options.length === 1) {
    const option = options[0]
    const Icon = option.icon
    
    return (
      <button
        onClick={option.action}
        disabled={disabled}
        className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors ${className}`}
      >
        <Icon className="w-4 h-4" />
        <span>{option.label}</span>
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors ${className}`}
      >
        <DownloadIcon className="w-4 h-4" />
        <span>Export</span>
        <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute top-full right-0 mt-2 w-48 ${themeClasses.surface} border border-white/10 rounded-lg shadow-lg z-50`}
          >
            <div className="py-2">
              {options.map((option) => {
                const Icon = option.icon
                return (
                  <button
                    key={option.id}
                    onClick={() => {
                      option.action()
                      setIsOpen(false)
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-white/5 transition-colors ${themeClasses.text}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{option.label}</span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}