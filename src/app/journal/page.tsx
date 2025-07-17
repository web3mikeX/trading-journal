"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { PlusIcon, BookOpenIcon, SearchIcon, FilterIcon, HeartIcon, TrendingUpIcon, LinkIcon, FileSpreadsheetIcon, AlertTriangleIcon, ZapIcon, EditIcon, TrashIcon } from "lucide-react"
import Header from "@/components/Header"
import NewEntryModal from "@/components/NewEntryModal"
import ExportButton from "@/components/ExportButton"
import { useTheme } from "@/components/ThemeProvider"
import { getThemeClasses } from "@/lib/theme"
import { useJournal } from "@/hooks/useJournal"
import { exportJournalToCSV } from "@/lib/exports"

export default function Journal() {
  const { theme } = useTheme()
  const themeClasses = getThemeClasses(theme)
  const { entries, loading, error, createEntry, fetchEntries, deleteEntry } = useJournal()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [entryTypeFilter, setEntryTypeFilter] = useState("")

  const handleSaveEntry = async (newEntry: { 
    title: string; 
    content: string; 
    entryType: 'PRE_TRADE' | 'DURING_TRADE' | 'POST_TRADE' | 'GENERAL' | 'LESSON';
    mood?: number;
    confidence?: number;
    fear?: number;
    excitement?: number;
    tradeId?: string;
  }) => {
    const result = await createEntry(newEntry)
    if (result) {
      setIsModalOpen(false)
    }
  }

  const handleDeleteEntry = async (entryId: string) => {
    if (window.confirm('Are you sure you want to delete this journal entry? This action cannot be undone.')) {
      try {
        await deleteEntry(entryId)
      } catch (error) {
        console.error('Failed to delete journal entry:', error)
        alert('Failed to delete journal entry. Please try again.')
      }
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    const timeoutId = setTimeout(() => {
      fetchEntries(value || undefined, entryTypeFilter || undefined)
    }, 300)
    
    return () => clearTimeout(timeoutId)
  }

  const handleFilterChange = (type: string) => {
    setEntryTypeFilter(type)
    fetchEntries(searchTerm || undefined, type || undefined)
  }

  const getEntryTypeColor = (type: string) => {
    switch (type) {
      case 'PRE_TRADE': return 'bg-blue-500/20 text-blue-300'
      case 'DURING_TRADE': return 'bg-orange-500/20 text-orange-300'
      case 'POST_TRADE': return 'bg-green-500/20 text-green-300'
      case 'LESSON': return 'bg-purple-500/20 text-purple-300'
      default: return 'bg-gray-500/20 text-gray-300'
    }
  }

  const getEntryTypeLabel = (type: string) => {
    switch (type) {
      case 'PRE_TRADE': return 'Pre-Trade'
      case 'DURING_TRADE': return 'During Trade'
      case 'POST_TRADE': return 'Post-Trade'
      case 'LESSON': return 'Lesson'
      default: return 'General'
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-sm ${star <= rating ? 'text-yellow-400' : 'text-gray-400'}`}
          >
            ★
          </span>
        ))}
      </div>
    )
  }

  if (loading && entries.length === 0) {
    return (
      <div className={`min-h-screen ${themeClasses.background} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${themeClasses.background}`}>
      
      <Header />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-8">
            <h1 className={`text-3xl font-bold ${themeClasses.text}`}>DetaWise Journal</h1>
            <div className="flex items-center space-x-3">
              <ExportButton
                options={[
                  {
                    id: 'journal-csv',
                    label: 'Export Journal CSV',
                    icon: FileSpreadsheetIcon,
                    action: () => exportJournalToCSV(entries)
                  }
                ]}
                disabled={entries.length === 0}
              />
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                <span>New Entry</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-300">Error: {error}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search journal entries..."
                className={`w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.input}`}
              />
            </div>
            
            <div className="relative">
              <FilterIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={entryTypeFilter}
                onChange={(e) => handleFilterChange(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.input}`}
              >
                <option value="">All Entry Types</option>
                <option value="GENERAL">General</option>
                <option value="PRE_TRADE">Pre-Trade</option>
                <option value="DURING_TRADE">During Trade</option>
                <option value="POST_TRADE">Post-Trade</option>
                <option value="LESSON">Lesson Learned</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-6">
            {entries.map((entry, index) => (
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
                    <span className={`px-2 py-1 text-xs rounded-md ${getEntryTypeColor(entry.entryType)}`}>
                      {getEntryTypeLabel(entry.entryType)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <span className={`text-sm ${themeClasses.textSecondary} block`}>
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </span>
                      <span className={`text-xs ${themeClasses.textSecondary}`}>
                        {new Date(entry.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          // Future: implement edit functionality
                        }}
                        className={`p-1 ${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors opacity-50`}
                        title="Edit entry (coming soon)"
                        disabled
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteEntry(entry.id)
                        }}
                        className={`p-1 ${themeClasses.textSecondary} hover:text-red-400 transition-colors`}
                        title="Delete entry"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <p className={`${themeClasses.textSecondary} mb-4 line-clamp-2`}>{entry.content}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-wrap">
                    {entry.mood && (
                      <div className="flex items-center space-x-1">
                        <HeartIcon className="w-4 h-4 text-red-400" />
                        <span className={`text-sm ${themeClasses.textSecondary}`}>Mood:</span>
                        {renderStars(entry.mood)}
                      </div>
                    )}
                    
                    {entry.confidence && (
                      <div className="flex items-center space-x-1">
                        <TrendingUpIcon className="w-4 h-4 text-green-400" />
                        <span className={`text-sm ${themeClasses.textSecondary}`}>Confidence:</span>
                        {renderStars(entry.confidence)}
                      </div>
                    )}

                    {entry.fear && (
                      <div className="flex items-center space-x-1">
                        <AlertTriangleIcon className="w-4 h-4 text-orange-400" />
                        <span className={`text-sm ${themeClasses.textSecondary}`}>Fear:</span>
                        {renderStars(entry.fear)}
                      </div>
                    )}

                    {entry.excitement && (
                      <div className="flex items-center space-x-1">
                        <ZapIcon className="w-4 h-4 text-yellow-400" />
                        <span className={`text-sm ${themeClasses.textSecondary}`}>Excitement:</span>
                        {renderStars(entry.excitement)}
                      </div>
                    )}
                  </div>
                  
                  {entry.trade && (
                    <div className="flex items-center space-x-1 text-blue-400">
                      <LinkIcon className="w-4 h-4" />
                      <span className="text-sm">
                        {entry.trade.symbol} - {entry.trade.side}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
          
          {entries.length === 0 && !loading && (
            <div className="text-center py-12">
              <BookOpenIcon className={`w-12 h-12 ${themeClasses.textSecondary} mx-auto mb-4`} />
              <h3 className={`text-lg font-medium ${themeClasses.text} mb-2`}>No journal entries yet</h3>
              <p className={themeClasses.textSecondary}>Start documenting your trading journey</p>
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