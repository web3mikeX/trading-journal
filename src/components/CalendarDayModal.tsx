"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useDropzone } from "react-dropzone"
import { 
  X, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Target,
  Trophy,
  Upload,
  Image as ImageIcon,
  Heart,
  Star,
  Save,
  Loader2,
  BarChart3,
  DollarSign,
  Brain,
  Sparkles
} from "lucide-react"
import { useTheme } from "@/components/ThemeProvider"
import { getThemeClasses } from "@/lib/theme"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useApiThrottle } from "@/hooks/useApiThrottle"
import SmartChartSelector from "@/components/SmartChartSelector"

interface Trade {
  id: string
  symbol: string
  side: 'LONG' | 'SHORT'
  entryPrice: number
  exitPrice?: number
  quantity: number
  netPnL?: number
  status: 'OPEN' | 'CLOSED' | 'CANCELLED'
  entryDate: Date
  exitDate?: Date
}

interface CalendarDayData {
  date: string
  pnl: number
  tradesCount: number
  winRate: number
  hasNotes: boolean
  hasImages: boolean
  mood?: number
  notes?: string
  images?: string[]
  trades?: Trade[]
  aiSummary?: string
}

interface CalendarDayModalProps {
  isOpen: boolean
  onClose: () => void
  date: string
  userId: string
  initialData?: CalendarDayData
  onSaveSuccess?: () => void
}

export default function CalendarDayModal({ isOpen, onClose, date, userId, initialData, onSaveSuccess }: CalendarDayModalProps) {
  const { theme } = useTheme()
  const themeClasses = getThemeClasses(theme)
  
  const [activeTab, setActiveTab] = useState<'overview' | 'trades' | 'diary' | 'images' | 'ai-summary'>('overview')
  const [dayData, setDayData] = useState<CalendarDayData | null>(initialData || null)
  const [notes, setNotes] = useState('')
  const [mood, setMood] = useState<number | undefined>(undefined)
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [generatingAISummary, setGeneratingAISummary] = useState(false)
  const [aiSummary, setAISummary] = useState<string | null>(null)
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null)
  const [chartTimeframe, setChartTimeframe] = useState<string>('1h')
  
  const { shouldThrottle, trackApiCall } = useApiThrottle()
  
  const dateObj = new Date(date)
  const isToday = date === new Date().toISOString().split('T')[0]
  
  // Track if we've already loaded data for this date to prevent infinite loops
  const loadedDateRef = useRef<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  
  // Memoize the loadDayData function to prevent unnecessary re-renders
  const loadDayData = useCallback(async () => {
    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController()
    
    setLoading(true)
    try {
      // Ensure we have a clean date format (YYYY-MM-DD)
      const cleanDate = new Date(date).toISOString().split('T')[0]
      const apiUrl = `/api/calendar/${cleanDate}?userId=${userId}`
      
      // Check if we should throttle this request
      if (shouldThrottle(apiUrl)) {
        console.warn('API request throttled for calendar day:', cleanDate)
        return
      }
      
      trackApiCall(apiUrl)
      const response = await fetch(apiUrl, {
        signal: abortControllerRef.current.signal
      })
      
      if (response.ok) {
        const data = await response.json()
        setDayData(data)
        setNotes(data.notes || '')
        setMood(data.mood)
        setImages(data.images || [])
        setAISummary(data.aiSummary || null)
        loadedDateRef.current = cleanDate
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Failed to load day data:', error)
      }
    } finally {
      setLoading(false)
    }
  }, [date, userId])
  
  // Load day data when modal opens or date changes
  useEffect(() => {
    if (isOpen && date) {
      const cleanDate = new Date(date).toISOString().split('T')[0]
      
      // Only load if we haven't already loaded this date
      if (loadedDateRef.current !== cleanDate) {
        if (initialData) {
          // Set initial data immediately for quick display
          setDayData(initialData)
          setNotes(initialData.notes || '')
          setMood(initialData.mood)
          setImages(initialData.images || [])
          setAISummary(initialData.aiSummary || null)
        }
        // Always load full data from API to ensure we have complete information
        loadDayData()
      }
    }
    
    // Cleanup function to cancel requests when component unmounts or dependencies change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [isOpen, date, loadDayData]) // Removed initialData from dependencies
  
  // loadDayData function moved above and memoized with useCallback
  
  const saveDayData = async () => {
    console.log('📝 Starting save operation...')
    setSaving(true)
    setSaveMessage(null)
    setSaveError(null)
    
    try {
      // Validate required data
      if (!userId) {
        throw new Error('User ID is required')
      }
      
      if (!date) {
        throw new Error('Date is required')
      }
      
      const requestData = {
        userId,
        notes: notes.trim() || undefined,
        mood: mood && mood >= 1 && mood <= 5 ? mood : undefined,
        images: images.length > 0 ? images : undefined
      }
      
      console.log('📝 Request data:', requestData)
      console.log('📝 Notes length:', notes.length)
      console.log('📝 Notes content:', notes)
      
      // Ensure we have a clean date format (YYYY-MM-DD)
      const cleanDate = new Date(date).toISOString().split('T')[0]
      console.log('📝 Using date:', cleanDate)
      console.log('📝 API endpoint:', `/api/calendar/${cleanDate}`)
      
      const response = await fetch(`/api/calendar/${cleanDate}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })
      
      console.log('📝 Response status:', response.status)
      console.log('📝 Response ok:', response.ok)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        console.error('❌ API Error Response:', errorData)
        throw new Error(`Save failed: ${response.status} ${response.statusText}${errorData ? ` - ${JSON.stringify(errorData)}` : ''}`)
      }
      
      const updatedData = await response.json()
      console.log('✅ Save successful! Updated data:', updatedData)
      
      setDayData(updatedData)
      setSaveMessage('Saved successfully!')
      
      // Call the parent callback to refresh calendar data
      if (onSaveSuccess) {
        console.log('📝 Calling onSaveSuccess callback')
        onSaveSuccess()
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000)
      
    } catch (error) {
      console.error('❌ Failed to save day data:', error)
      console.error('❌ Error type:', typeof error)
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      
      setSaveError(error instanceof Error ? error.message : 'Failed to save day data')
      
      // Clear error message after 5 seconds
      setTimeout(() => setSaveError(null), 5000)
    } finally {
      console.log('📝 Save operation finished, setting saving to false')
      setSaving(false)
    }
  }
  
  // Image upload handler
  const onDrop = (acceptedFiles: File[]) => {
    // For now, we'll simulate image upload
    // In a real implementation, you'd upload to a server or cloud storage
    acceptedFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = () => {
        setImages(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 5
  })
  
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }
  
  const openImagePreview = (imageUrl: string) => {
    setSelectedImage(imageUrl)
    setIsImageModalOpen(true)
  }
  
  const closeImagePreview = () => {
    setSelectedImage(null)
    setIsImageModalOpen(false)
  }
  
  // Handle ESC key press to close image modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isImageModalOpen) {
        closeImagePreview()
      }
    }
    
    if (isImageModalOpen) {
      document.addEventListener('keydown', handleEscKey)
      return () => document.removeEventListener('keydown', handleEscKey)
    }
  }, [isImageModalOpen])
  
  const renderStars = (rating: number | undefined, onChange?: (rating: number) => void) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onChange && onChange(star)}
            className={`transition-colors ${onChange ? 'cursor-pointer' : 'cursor-default'}`}
            disabled={!onChange}
          >
            <Star
              className={`w-5 h-5 ${
                rating && star <= rating 
                  ? 'text-yellow-400 fill-current' 
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    )
  }
  
  const generateAISummary = async () => {
    if (!dayData?.tradesCount || generatingAISummary) return
    
    setGeneratingAISummary(true)
    
    try {
      const response = await fetch('/api/calendar/ai-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: date
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setAISummary(data.summary)
        
        // Update dayData to include the new AI summary
        setDayData(prev => prev ? { ...prev, aiSummary: data.summary } : null)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to generate AI summary:', response.status, errorData)
        if (response.status === 401) {
          setAISummary('Authentication error. Please refresh the page and try again.')
        } else {
          setAISummary('Failed to generate AI summary. Please try again.')
        }
      }
    } catch (error) {
      console.error('Error generating AI summary:', error)
      setAISummary('Network error. Please check your connection and try again.')
    } finally {
      setGeneratingAISummary(false)
    }
  }
  
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'trades', label: 'Trades', icon: DollarSign },
    { id: 'diary', label: 'Diary', icon: Heart },
    { id: 'images', label: 'Images', icon: ImageIcon },
    { id: 'ai-summary', label: 'AI Summary', icon: Brain },
  ]

  return (
    <>
      {isOpen && (
        <div key="calendar-day-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              onClick={onClose}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            
            {/* Modal */}
            <div
              className={`relative w-full max-w-4xl max-h-[90vh] ${themeClasses.surface} rounded-xl shadow-2xl border ${themeClasses.border} overflow-hidden`}
            >
            {/* Header */}
            <div className={`${themeClasses.background} px-6 py-4 border-b ${themeClasses.border}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Calendar className={`w-6 h-6 ${themeClasses.accent}`} />
                  <div>
                    <h2 className={`text-xl font-bold ${themeClasses.text}`}>
                      {formatDate(dateObj)}
                      {isToday && <span className="ml-2 text-sm text-blue-500">(Today)</span>}
                    </h2>
                    {dayData && (
                      <div className="flex items-center space-x-4 mt-1">
                        <span className={`text-sm ${dayData.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(dayData.pnl)} P&L
                        </span>
                        <span className={`text-sm ${themeClasses.textSecondary}`}>
                          {dayData.tradesCount} trades
                        </span>
                        {dayData.winRate !== undefined && (
                          <span className={`text-sm ${themeClasses.textSecondary}`}>
                            {(dayData.winRate ?? 0).toFixed(1)}% win rate
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={saveDayData}
                    disabled={saving}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg transition-colors"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Save</span>
                  </button>
                  
                  <button
                    onClick={onClose}
                    className={`p-2 rounded-lg ${themeClasses.button} transition-colors`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Save Messages */}
              {(saveMessage || saveError) && (
                <div className="px-6 pb-4">
                  {saveMessage && (
                    <div className="flex items-center space-x-2 text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 px-4 py-2 rounded-lg">
                      <span className="text-sm font-medium">{saveMessage}</span>
                    </div>
                  )}
                  {saveError && (
                    <div className="flex items-center space-x-2 text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 px-4 py-2 rounded-lg">
                      <span className="text-sm font-medium">{saveError}</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Tabs */}
              <div className="flex space-x-1 mt-4">
                {tabs.map(tab => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white'
                          : `${themeClasses.button} ${themeClasses.text}`
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className={`w-8 h-8 animate-spin ${themeClasses.accent}`} />
                </div>
              ) : (
                <div key="modal-content">
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <div key="overview-tab" className="space-y-6">
                      {dayData ? (
                        <div key="overview-content">
                          {/* Performance Summary */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className={`p-4 ${themeClasses.surface} rounded-lg border ${themeClasses.border}`}>
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className={`text-sm ${themeClasses.textSecondary}`}>P&L</div>
                                  <div className={`text-xl font-bold ${dayData.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(dayData.pnl)}
                                  </div>
                                </div>
                                {dayData.pnl >= 0 ? (
                                  <TrendingUp className="w-8 h-8 text-green-500" />
                                ) : (
                                  <TrendingDown className="w-8 h-8 text-red-500" />
                                )}
                              </div>
                            </div>
                            
                            <div className={`p-4 ${themeClasses.surface} rounded-lg border ${themeClasses.border}`}>
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className={`text-sm ${themeClasses.textSecondary}`}>Trades</div>
                                  <div className={`text-xl font-bold ${themeClasses.text}`}>
                                    {dayData.tradesCount}
                                  </div>
                                </div>
                                <Target className={`w-8 h-8 ${themeClasses.accent}`} />
                              </div>
                            </div>
                            
                            <div className={`p-4 ${themeClasses.surface} rounded-lg border ${themeClasses.border}`}>
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className={`text-sm ${themeClasses.textSecondary}`}>Win Rate</div>
                                  <div className={`text-xl font-bold ${themeClasses.text}`}>
                                    {(dayData.winRate ?? 0).toFixed(1)}%
                                  </div>
                                </div>
                                <Trophy className={`w-8 h-8 ${(dayData.winRate ?? 0) >= 50 ? 'text-green-500' : 'text-red-500'}`} />
                              </div>
                            </div>
                          </div>
                          
                          {/* Mood Tracking */}
                          <div className={`p-4 ${themeClasses.surface} rounded-lg border ${themeClasses.border}`}>
                            <h3 className={`text-lg font-medium ${themeClasses.text} mb-3`}>Daily Mood</h3>
                            <div className="flex items-center space-x-4">
                              {renderStars(mood, setMood)}
                              <span className={`text-sm ${themeClasses.textSecondary}`}>
                                {mood ? `${mood}/5` : 'Not set'}
                              </span>
                            </div>
                          </div>
                          
                          {/* Image Thumbnails */}
                          {images.length > 0 && (
                            <div className={`p-4 ${themeClasses.surface} rounded-lg border ${themeClasses.border}`}>
                              <h3 className={`text-lg font-medium ${themeClasses.text} mb-3`}>
                                Trading Screenshots ({images.length})
                              </h3>
                              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                                {images.slice(0, 3).map((image, index) => (
                                  <div
                                    key={`overview-image-${index}`}
                                    className="relative group cursor-pointer hover:scale-105 transition-transform"
                                    onClick={() => openImagePreview(image)}
                                  >
                                    <img
                                      src={image}
                                      alt={`Trading screenshot ${index + 1}`}
                                      className="w-full h-16 object-cover rounded-lg border border-gray-200 hover:border-blue-400 transition-colors"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-opacity" />
                                  </div>
                                ))}
                                {images.length > 3 && (
                                  <div 
                                    className={`h-16 ${themeClasses.surface} border-2 border-dashed ${themeClasses.border} rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
                                    onClick={() => setActiveTab('images')}
                                  >
                                    <span className={`text-sm ${themeClasses.textSecondary}`}>
                                      +{images.length - 3} more
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Calendar className={`w-12 h-12 mx-auto mb-4 ${themeClasses.textSecondary}`} />
                          <h3 className={`text-lg font-medium ${themeClasses.text} mb-2`}>No trading data</h3>
                          <p className={`${themeClasses.textSecondary}`}>
                            No trades found for this date. Add some diary notes or images to track your trading journey.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Trades Tab */}
                  {activeTab === 'trades' && (
                    <div key="trades-tab" className="space-y-8">
                      {dayData?.trades && dayData.trades.length > 0 ? (
                        <div className="space-y-8">
                          {/* Chart Section - Full width, centered */}
                          <div className="space-y-4">
                            {selectedTrade ? (
                              <>
                                <h3 className={`text-lg font-semibold ${themeClasses.text} mb-3 text-center`}>
                                  Chart: {selectedTrade.symbol} {selectedTrade.side}
                                </h3>
                                <div className={`p-4 rounded-lg ${themeClasses.surface} border ${themeClasses.border}`}>
                                  <SmartChartSelector
                                    symbol={selectedTrade.symbol}
                                    trade={selectedTrade}
                                    width={800}
                                    height={500}
                                    showTradeMarkers={true}
                                    preferRealData={true}
                                    autoFallback={true}
                                    showProviderInfo={true}
                                  />
                                </div>
                              </>
                            ) : (
                              <div className={`p-6 rounded-lg ${themeClasses.surface} border ${themeClasses.border} text-center`}>
                                <p className={themeClasses.textSecondary}>Select a trade to view its chart</p>
                              </div>
                            )}
                          </div>

                          {/* Trade List - Underneath chart, horizontal layout */}
                          <div className="space-y-4">
                            <h3 className={`text-base font-semibold ${themeClasses.text} mb-3 text-center`}>
                              Trades ({dayData.trades.length})
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {dayData.trades.map((trade, index) => (
                                <div
                                  key={trade.id}
                                  onClick={() => setSelectedTrade(trade)}
                                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                                    selectedTrade?.id === trade.id
                                      ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 shadow-md'
                                      : `${themeClasses.surface} border ${themeClasses.border} hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:shadow-sm`
                                  }`}
                                >
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                          trade.side === 'LONG' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                        }`}>
                                          {index + 1}
                                        </div>
                                        <div className={`font-medium ${themeClasses.text}`}>
                                          {trade.symbol} {trade.side}
                                        </div>
                                      </div>
                                      <div className={`text-sm font-medium ${trade.netPnL && trade.netPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {trade.netPnL ? formatCurrency(trade.netPnL) : '-'}
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                      <div className={themeClasses.textSecondary}>
                                        ${trade.entryPrice} → {trade.exitPrice ? `$${trade.exitPrice}` : 'Open'}
                                      </div>
                                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        trade.status === 'CLOSED' ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' : 
                                        trade.status === 'OPEN' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 
                                        'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                      }`}>
                                        {trade.status}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <BarChart3 className={`w-12 h-12 mx-auto mb-4 ${themeClasses.textSecondary}`} />
                          <h3 className={`text-lg font-medium ${themeClasses.text} mb-2`}>No trades</h3>
                          <p className={`${themeClasses.textSecondary}`}>No trades found for this date.</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Diary Tab */}
                  {activeTab === 'diary' && (
                    <div key="diary-tab" className="space-y-4">
                      <div>
                        <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                          Trading Notes & Reflections
                        </label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={8}
                          className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${themeClasses.input}`}
                          placeholder="Record your thoughts, observations, lessons learned, market analysis, or any insights from today's trading..."
                        />
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                          Mood Rating
                        </label>
                        <div className="flex items-center space-x-4">
                          {renderStars(mood, setMood)}
                          <span className={`text-sm ${themeClasses.textSecondary}`}>
                            {mood ? `${mood}/5` : 'Rate your trading mood today'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Images Tab */}
                  {activeTab === 'images' && (
                    <div key="images-tab" className="space-y-4">
                      {/* Upload Area */}
                      <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                          isDragActive 
                            ? 'border-blue-500 bg-blue-50' 
                            : `border-gray-300 ${themeClasses.surface}`
                        }`}
                      >
                        <input {...getInputProps()} />
                        <Upload className={`w-12 h-12 mx-auto mb-4 ${themeClasses.textSecondary}`} />
                        <p className={`text-lg font-medium ${themeClasses.text} mb-2`}>
                          {isDragActive ? 'Drop images here' : 'Upload trading screenshots'}
                        </p>
                        <p className={`text-sm ${themeClasses.textSecondary}`}>
                          Drag & drop images or click to browse (JPG, PNG, GIF, WebP)
                        </p>
                      </div>
                      
                      {/* Image Gallery */}
                      {images.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {images.map((image, index) => (
                            <div key={`gallery-image-${index}`} className="relative group">
                              <img
                                src={image}
                                alt={`Trading screenshot ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                              <button
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* AI Summary Tab */}
                  {activeTab === 'ai-summary' && (
                    <div key="ai-summary-tab" className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-lg font-semibold ${themeClasses.text} flex items-center gap-2`}>
                          <Brain className="w-5 h-5 text-blue-500" />
                          AI Daily Summary
                        </h3>
                        
                        {dayData?.tradesCount && (
                          <button
                            onClick={generateAISummary}
                            disabled={generatingAISummary}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                              generatingAISummary 
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                          >
                            {generatingAISummary ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4" />
                                {aiSummary || dayData?.aiSummary ? 'Regenerate' : 'Generate'} Summary
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      
                      <div className={`min-h-[200px] p-4 rounded-lg ${themeClasses.surface} border ${themeClasses.border}`}>
                        {generatingAISummary ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="text-center">
                              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
                              <p className={`${themeClasses.textSecondary}`}>
                                Analyzing your trading day...
                              </p>
                            </div>
                          </div>
                        ) : (aiSummary || dayData?.aiSummary) ? (
                          <div className="prose prose-sm max-w-none">
                            <div className={`${themeClasses.text} leading-relaxed`}>
                              {aiSummary || dayData?.aiSummary}
                            </div>
                            
                            <div className={`mt-4 pt-4 border-t ${themeClasses.border}`}>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Brain className="w-3 h-3" />
                                Generated by AI • {new Date().toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        ) : dayData?.tradesCount ? (
                          <div className="text-center py-8">
                            <Brain className={`w-16 h-16 mx-auto mb-4 ${themeClasses.textSecondary}`} />
                            <p className={`${themeClasses.text} mb-2`}>
                              Generate an AI summary of your trading day
                            </p>
                            <p className={`${themeClasses.textSecondary} text-sm mb-4`}>
                              Get insights on your performance, patterns, and key takeaways
                            </p>
                            <button
                              onClick={generateAISummary}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors mx-auto"
                            >
                              <Sparkles className="w-4 h-4" />
                              Generate Summary
                            </button>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Calendar className={`w-16 h-16 mx-auto mb-4 ${themeClasses.textSecondary}`} />
                            <p className={`${themeClasses.text} mb-2`}>
                              No trading activity
                            </p>
                            <p className={`${themeClasses.textSecondary} text-sm`}>
                              AI summaries are generated for days with trades
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Image Preview Modal */}
      {isImageModalOpen && selectedImage && (
        <div key="image-preview-modal" className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              onClick={closeImagePreview}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            {/* Modal Content */}
            <div
              className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center"
            >
            {/* Close Button */}
            <button
              onClick={closeImagePreview}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* Image */}
            <img
              src={selectedImage}
              alt="Trading screenshot preview"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            </div>
          </div>
        )}
    </>
  )
}