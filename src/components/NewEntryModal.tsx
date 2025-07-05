"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Save } from "lucide-react"
import { useTheme } from "@/components/ThemeProvider"
import { getThemeClasses } from "@/lib/theme"
import { useTrades } from "@/hooks/useTrades"
import { useSession } from "next-auth/react"

interface NewEntryModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (entry: { 
    title: string; 
    content: string; 
    entryType: 'PRE_TRADE' | 'DURING_TRADE' | 'POST_TRADE' | 'GENERAL' | 'LESSON';
    mood?: number;
    confidence?: number;
    fear?: number;
    excitement?: number;
    tradeId?: string;
  }) => void
}

export default function NewEntryModal({ isOpen, onClose, onSave }: NewEntryModalProps) {
  const { theme } = useTheme()
  const themeClasses = getThemeClasses(theme)
  const { data: session } = useSession()
  const { trades } = useTrades(session?.user?.id || '')
  
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [entryType, setEntryType] = useState<'PRE_TRADE' | 'DURING_TRADE' | 'POST_TRADE' | 'GENERAL' | 'LESSON'>('GENERAL')
  const [mood, setMood] = useState<number | undefined>(undefined)
  const [confidence, setConfidence] = useState<number | undefined>(undefined)
  const [fear, setFear] = useState<number | undefined>(undefined)
  const [excitement, setExcitement] = useState<number | undefined>(undefined)
  const [tradeId, setTradeId] = useState<string | undefined>(undefined)

  const handleSave = () => {
    if (title.trim() && content.trim()) {
      onSave({ 
        title: title.trim(), 
        content: content.trim(), 
        entryType,
        mood,
        confidence,
        fear,
        excitement,
        tradeId
      })
      resetForm()
      onClose()
    }
  }

  const resetForm = () => {
    setTitle("")
    setContent("")
    setEntryType('GENERAL')
    setMood(undefined)
    setConfidence(undefined)
    setFear(undefined)
    setExcitement(undefined)
    setTradeId(undefined)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const entryTypeOptions = [
    { value: 'GENERAL', label: 'General' },
    { value: 'PRE_TRADE', label: 'Pre-Trade' },
    { value: 'DURING_TRADE', label: 'During Trade' },
    { value: 'POST_TRADE', label: 'Post-Trade' },
    { value: 'LESSON', label: 'Lesson Learned' }
  ]

  const renderStars = (value: number | undefined, onChange: (value: number | undefined) => void) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(value === star ? undefined : star)}
            className={`w-6 h-6 ${
              value && value >= star ? 'text-yellow-400' : 'text-gray-400'
            } hover:text-yellow-400 transition-colors`}
          >
            ★
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className="ml-2 text-xs text-gray-400 hover:text-gray-300"
        >
          Clear
        </button>
      </div>
    )
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className={`${themeClasses.surface} rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-semibold ${themeClasses.text}`}>New Journal Entry</h2>
              <button
                onClick={handleClose}
                className={`${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm ${themeClasses.textSecondary} mb-2`}>Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.input}`}
                  placeholder="Enter entry title..."
                />
              </div>

              <div>
                <label className={`block text-sm ${themeClasses.textSecondary} mb-2`}>Entry Type</label>
                <select
                  value={entryType}
                  onChange={(e) => setEntryType(e.target.value as typeof entryType)}
                  className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.input}`}
                >
                  {entryTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {trades.length > 0 && (
                <div>
                  <label className={`block text-sm ${themeClasses.textSecondary} mb-2`}>Link to Trade (Optional)</label>
                  <select
                    value={tradeId || ''}
                    onChange={(e) => setTradeId(e.target.value || undefined)}
                    className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.input}`}
                  >
                    <option value="">Select a trade...</option>
                    {trades.map(trade => (
                      <option key={trade.id} value={trade.id}>
                        {trade.symbol} - {trade.side} - {new Date(trade.entryDate).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className={`block text-sm ${themeClasses.textSecondary} mb-2`}>Content</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${themeClasses.input}`}
                  placeholder="Write your journal entry..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className={`block text-sm ${themeClasses.textSecondary} mb-2`}>Mood (1-5)</label>
                  {renderStars(mood, setMood)}
                </div>

                <div>
                  <label className={`block text-sm ${themeClasses.textSecondary} mb-2`}>Confidence (1-5)</label>
                  {renderStars(confidence, setConfidence)}
                </div>

                <div>
                  <label className={`block text-sm ${themeClasses.textSecondary} mb-2`}>Fear (1-5)</label>
                  {renderStars(fear, setFear)}
                </div>

                <div>
                  <label className={`block text-sm ${themeClasses.textSecondary} mb-2`}>Excitement (1-5)</label>
                  {renderStars(excitement, setExcitement)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={handleClose}
                className={`px-4 py-2 ${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!title.trim() || !content.trim()}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Entry</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}