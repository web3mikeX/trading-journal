"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, 
  Pen, 
  TrendingUp, 
  Sparkles,
  BookOpen,
  Save,
  SkipForward
} from "lucide-react"
import { useTheme } from "@/components/ThemeProvider"
import { useToast } from "@/components/ui/toast"

interface PostImportJournalModalProps {
  isOpen: boolean
  onClose: () => void
  importCount: number
  importSummary?: string
}

export default function PostImportJournalModal({ 
  isOpen, 
  onClose, 
  importCount, 
  importSummary 
}: PostImportJournalModalProps) {
  
  console.log('PostImportJournalModal render:', { isOpen, importCount, importSummary })
  const { theme } = useTheme()
  const { addToast } = useToast()
  const [journalEntry, setJournalEntry] = useState("")
  const [mood, setMood] = useState<"excellent" | "good" | "neutral" | "challenging" | "">("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const moodEmojis = {
    excellent: "🚀",
    good: "😊", 
    neutral: "😐",
    challenging: "😓"
  }

  const handleSave = async () => {
    if (!journalEntry.trim()) {
      addToast({
        type: 'error',
        title: 'Empty Entry',
        message: 'Please write something before saving.',
        duration: 3000
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: journalEntry,
          type: 'post_import',
          metadata: {
            importCount,
            importSummary,
            mood,
            timestamp: new Date().toISOString()
          }
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save journal entry')
      }

      addToast({
        type: 'success',
        title: 'Journal Saved! 📝',
        message: 'Your trading reflection has been recorded.',
        duration: 4000
      })

      onClose()
    } catch (error) {
      console.error('Error saving journal entry:', error)
      addToast({
        type: 'error',
        title: 'Save Failed',
        message: 'Could not save your journal entry. Please try again.',
        duration: 4000
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkip = () => {
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
        >
          <motion.div
            initial={{ scale: 0.8, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 50, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
            className={`
              relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden
              ${theme === 'dark' 
                ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-purple-900' 
                : 'bg-gradient-to-br from-white via-blue-50 to-purple-100'
              }
            `}
            style={{
              border: theme === 'dark' 
                ? '2px solid rgba(168, 85, 247, 0.4)' 
                : '2px solid rgba(59, 130, 246, 0.3)',
              boxShadow: theme === 'dark'
                ? '0 25px 50px -12px rgba(168, 85, 247, 0.25)'
                : '0 25px 50px -12px rgba(59, 130, 246, 0.25)'
            }}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className={`
                absolute top-4 right-4 z-10 p-2 rounded-full transition-colors
                ${theme === 'dark'
                  ? 'hover:bg-gray-700 text-gray-300 hover:text-white'
                  : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                }
              `}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="px-8 py-6 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 mb-4"
              >
                <Sparkles className="w-8 h-8 text-white" />
              </motion.div>
              
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`
                  text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent
                  ${theme === 'dark' ? 'from-purple-400 to-blue-400' : 'from-purple-600 to-blue-600'}
                `}
              >
                Trading Session Complete! 🎉
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className={`
                  text-lg
                  ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}
                `}
              >
                You've imported <span className="font-bold text-purple-500">{importCount}</span> trade{importCount !== 1 ? 's' : ''}. 
                How did this session go?
              </motion.p>
            </div>

            {/* Mood Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="px-8 mb-6"
            >
              <p className={`text-sm font-medium mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                How are you feeling about this trading session?
              </p>
              <div className="flex gap-3 justify-center">
                {Object.entries(moodEmojis).map(([moodKey, emoji]) => (
                  <button
                    key={moodKey}
                    onClick={() => setMood(moodKey as any)}
                    className={`
                      p-3 rounded-xl border-2 transition-all duration-200 
                      ${mood === moodKey
                        ? 'border-purple-500 bg-purple-100 dark:bg-purple-900/30 scale-110'
                        : theme === 'dark'
                        ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-800'
                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                      }
                    `}
                  >
                    <span className="text-2xl">{emoji}</span>
                    <div className={`text-xs mt-1 capitalize ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      {moodKey}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Journal Entry */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="px-8 mb-6"
            >
              <label className={`block text-sm font-medium mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                <BookOpen className="w-4 h-4 inline mr-2" />
                Capture your thoughts, insights, and learnings:
              </label>
              <textarea
                value={journalEntry}
                onChange={(e) => setJournalEntry(e.target.value)}
                placeholder="What patterns did you notice? What worked well? What would you do differently next time? How are you feeling about your risk management? Any specific setups or strategies that stood out?"
                rows={6}
                className={`
                  w-full rounded-xl border-2 p-4 text-base resize-none transition-all duration-200
                  ${theme === 'dark'
                    ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-purple-400 focus:bg-gray-750'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-400 focus:bg-purple-50/30'
                  }
                  focus:outline-none focus:ring-2 focus:ring-purple-500/20
                `}
                autoFocus
              />
              <div className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {journalEntry.length}/500 characters
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="px-8 py-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-800/50 dark:to-purple-900/20 flex gap-4 justify-center"
            >
              <button
                onClick={handleSkip}
                disabled={isSubmitting}
                className={`
                  px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2
                  ${theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-gray-800'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                <SkipForward className="w-4 h-4" />
                Skip for Now
              </button>
              
              <button
                onClick={handleSave}
                disabled={isSubmitting}
                className={`
                  px-8 py-3 rounded-xl font-bold text-white transition-all duration-200 flex items-center gap-2
                  bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600
                  transform hover:scale-105 shadow-lg hover:shadow-xl
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                `}
              >
                {isSubmitting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4"
                    >
                      <Pen className="w-4 h-4" />
                    </motion.div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Reflection
                  </>
                )}
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}