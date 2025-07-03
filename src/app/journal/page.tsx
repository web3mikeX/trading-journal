"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { PlusIcon, BookOpenIcon, SearchIcon } from "lucide-react"
import Header from "@/components/Header"
import NewEntryModal from "@/components/NewEntryModal"
import { useTheme } from "@/components/ThemeProvider"
import { getThemeClasses } from "@/lib/theme"

export default function Journal() {
  const { theme } = useTheme()
  const themeClasses = getThemeClasses(theme)
  
  const [entries, setEntries] = useState<Array<{
    id: number;
    date: string;
    title: string;
    content: string;
    tags: string[];
  }>>([])
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const sampleEntries = [
    {
      id: 1,
      date: "2024-01-15",
      title: "AAPL Long Position Analysis",
      content: "Entered long position at $185. Market showing strong bullish momentum...",
      tags: ["AAPL", "Long", "Tech"]
    },
    {
      id: 2,
      date: "2024-01-14",
      title: "Market Analysis - Tech Sector",
      content: "Tech sector showing signs of recovery. Planning entries in major names...",
      tags: ["Market Analysis", "Tech", "Strategy"]
    }
  ]

  const handleSaveEntry = (newEntry: { title: string; content: string; tags: string[] }) => {
    const entry = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      ...newEntry
    }
    setEntries([entry, ...entries])
  }

  const displayEntries = entries.length > 0 ? entries : sampleEntries

  return (
    <div className={`min-h-screen ${themeClasses.background}`}>
      {theme === 'dark' && (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(120,219,226,0.4),rgba(255,255,255,0))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,119,198,0.3),rgba(255,255,255,0))]" />
        </>
      )}
      
      <Header />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-8">
            <h1 className={`text-3xl font-bold ${themeClasses.text}`}>Trading Journal</h1>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              <span>New Entry</span>
            </button>
          </div>
          
          <div className="mb-6">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search journal entries..."
                className={`w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 ${themeClasses.input}`}
              />
            </div>
          </div>
          
          <div className="space-y-6">
            {displayEntries.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`${themeClasses.surface} rounded-xl p-6 hover:opacity-80 transition-opacity cursor-pointer`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <BookOpenIcon className="w-5 h-5 text-blue-400" />
                    <h3 className={`text-lg font-semibold ${themeClasses.text}`}>{entry.title}</h3>
                  </div>
                  <span className={`text-sm ${themeClasses.textSecondary}`}>{entry.date}</span>
                </div>
                
                <p className={`${themeClasses.textSecondary} mb-4 line-clamp-2`}>{entry.content}</p>
                
                <div className="flex items-center space-x-2">
                  {entry.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
          
          {displayEntries.length === 0 && (
            <div className="text-center py-12">
              <BookOpenIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No journal entries yet</h3>
              <p className="text-gray-400">Start documenting your trading journey</p>
            </div>
          )}
        </motion.div>
      </div>
      
      <NewEntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEntry}
      />
    </div>
  )
}