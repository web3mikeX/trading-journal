"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Target, 
  AlertTriangle,
  CheckCircle,
  Minus,
  Loader2,
  BarChart3,
  Lightbulb,
  Calendar
} from "lucide-react"
import { useTheme } from "@/components/ThemeProvider"
import { getThemeClasses } from "@/lib/theme"
import { 
  parseDateOption, 
  formatDateRangeDisplay, 
  validateCustomDateRange,
  getCustomRange 
} from "@/lib/dateUtils"

interface HabitPattern {
  pattern: string
  frequency: number
  winRate: number
  avgPnL: number
  impact: 'positive' | 'negative' | 'neutral'
  recommendation: string
}

interface OverallStats {
  totalTrades: number
  winningTrades: number
  losingTrades: number
  overallWinRate: number
  totalPnL: number
  avgPnL: number
}

interface HabitAnalysisData {
  patterns: HabitPattern[]
  overallStats: OverallStats
  keyInsights: string[]
  aiInsights?: string
  tradesAnalyzed: number
  timeframe: string
  generatedAt: string
}

interface HabitAnalysisProps {
  className?: string
}

export default function HabitAnalysis({ className }: HabitAnalysisProps) {
  const { theme } = useTheme()
  const themeClasses = getThemeClasses(theme)
  
  const [analysis, setAnalysis] = useState<HabitAnalysisData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dateOption, setDateOption] = useState('90')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [showCustomPicker, setShowCustomPicker] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const runAnalysis = async () => {
    setLoading(true)
    setError(null)
    setValidationError(null)
    
    try {
      // Prepare request body based on selected option
      const requestBody: any = {
        userId: 'cmcwu8b5m0001m17ilm0triy8' // Demo user ID
      }

      if (dateOption === 'custom') {
        // Validate custom dates
        const validation = validateCustomDateRange(customStartDate, customEndDate)
        if (!validation.isValid) {
          setValidationError(validation.error || 'Invalid date range')
          setLoading(false)
          return
        }
        
        requestBody.customStartDate = customStartDate
        requestBody.customEndDate = customEndDate
      } else {
        requestBody.dateOption = dateOption
      }

      const response = await fetch('/api/ai/analyze-habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to analyze habits')
      }

      const data = await response.json()
      setAnalysis(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze habits')
    } finally {
      setLoading(false)
    }
  }

  const handleDateOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newOption = e.target.value
    setDateOption(newOption)
    setShowCustomPicker(newOption === 'custom')
    setValidationError(null)
    
    // Clear custom dates when switching away from custom
    if (newOption !== 'custom') {
      setCustomStartDate('')
      setCustomEndDate('')
    }
  }

  const getSelectedDateRangeDisplay = () => {
    if (dateOption === 'custom' && customStartDate && customEndDate) {
      try {
        const range = getCustomRange(new Date(customStartDate), new Date(customEndDate))
        return formatDateRangeDisplay(range.start, range.end)
      } catch {
        return 'Invalid date range'
      }
    } else if (dateOption !== 'custom') {
      const range = parseDateOption(dateOption)
      if (range) {
        return formatDateRangeDisplay(range.start, range.end)
      }
    }
    return ''
  }

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'positive':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'negative':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      default:
        return <Minus className="w-4 h-4 text-gray-500" />
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive':
        return 'border-green-500/30 bg-green-500/10'
      case 'negative':
        return 'border-red-500/30 bg-red-500/10'
      default:
        return 'border-gray-500/30 bg-gray-500/10'
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header and Controls */}
      <div className={`p-6 rounded-lg ${themeClasses.surface} border ${themeClasses.border}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Brain className="w-6 h-6 text-blue-500" />
            <h2 className={`text-xl font-semibold ${themeClasses.text}`}>
              AI Trading Habit Analysis
            </h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex flex-col space-y-2">
              <select
                value={dateOption}
                onChange={handleDateOptionChange}
                className={`px-3 py-2 rounded-lg border ${themeClasses.surface} ${themeClasses.border} ${themeClasses.text}`}
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="thisWeek">This Week</option>
                <option value="lastWeek">Last Week</option>
                <option value="30">Last 30 days</option>
                <option value="60">Last 60 days</option>
                <option value="90">Last 90 days</option>
                <option value="180">Last 6 months</option>
                <option value="365">Last year</option>
                <option value="custom">Custom Date Range</option>
              </select>
              
              {/* Display selected date range */}
              {getSelectedDateRangeDisplay() && (
                <div className={`text-xs ${themeClasses.textSecondary} px-3`}>
                  {getSelectedDateRangeDisplay()}
                </div>
              )}
            </div>

            {/* Custom Date Picker */}
            {showCustomPicker && (
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => {
                    setCustomStartDate(e.target.value)
                    setValidationError(null)
                  }}
                  className={`px-2 py-1 text-sm rounded border ${themeClasses.surface} ${themeClasses.border} ${themeClasses.text}`}
                  placeholder="Start Date"
                />
                <span className={`text-sm ${themeClasses.textSecondary}`}>to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => {
                    setCustomEndDate(e.target.value)
                    setValidationError(null)
                  }}
                  className={`px-2 py-1 text-sm rounded border ${themeClasses.surface} ${themeClasses.border} ${themeClasses.text}`}
                  placeholder="End Date"
                />
              </div>
            )}
            
            <button
              onClick={runAnalysis}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <BarChart3 className="w-4 h-4" />
              )}
              <span>{loading ? 'Analyzing...' : 'Analyze Habits'}</span>
            </button>
          </div>
        </div>
        
        <p className={`${themeClasses.textSecondary} text-sm`}>
          Get AI-powered insights into your trading patterns, emotional triggers, and performance habits.
        </p>
      </div>

      {/* Error Display */}
      {(error || validationError) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
        >
          <p className="text-red-400">{error || validationError}</p>
        </motion.div>
      )}

      {/* Analysis Results */}
      <AnimatePresence>
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Overall Statistics */}
            <div className={`p-6 rounded-lg ${themeClasses.surface} border ${themeClasses.border}`}>
              <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>
                Overall Statistics ({analysis.timeframe})
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${themeClasses.text}`}>
                    {analysis.analysis?.overallStats?.totalTrades || 0}
                  </div>
                  <div className={`text-sm ${themeClasses.textSecondary}`}>Total Trades</div>
                </div>
                
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    (analysis.analysis?.overallStats?.overallWinRate || 0) >= 50 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {analysis.analysis?.overallStats?.overallWinRate || 0}%
                  </div>
                  <div className={`text-sm ${themeClasses.textSecondary}`}>Win Rate</div>
                </div>
                
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    (analysis.analysis?.overallStats?.totalPnL || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    ${(analysis.analysis?.overallStats?.totalPnL || 0).toFixed(2)}
                  </div>
                  <div className={`text-sm ${themeClasses.textSecondary}`}>Total P&L</div>
                </div>
                
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    (analysis.analysis?.overallStats?.avgPnL || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    ${(analysis.analysis?.overallStats?.avgPnL || 0).toFixed(2)}
                  </div>
                  <div className={`text-sm ${themeClasses.textSecondary}`}>Avg per Trade</div>
                </div>
              </div>
            </div>

            {/* Key Insights */}
            <div className={`p-6 rounded-lg ${themeClasses.surface} border ${themeClasses.border}`}>
              <div className="flex items-center space-x-2 mb-4">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                <h3 className={`text-lg font-semibold ${themeClasses.text}`}>Key Insights</h3>
              </div>
              
              <ul className="space-y-2">
                {(analysis.analysis?.keyInsights || []).map((insight, index) => (
                  <li key={index} className={`${themeClasses.textSecondary} flex items-start space-x-2`}>
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* AI Enhanced Insights */}
            {analysis.analysis?.aiInsights && (
              <div className={`p-6 rounded-lg ${themeClasses.surface} border ${themeClasses.border}`}>
                <div className="flex items-center space-x-2 mb-4">
                  <Brain className="w-5 h-5 text-purple-500" />
                  <h3 className={`text-lg font-semibold ${themeClasses.text}`}>AI-Enhanced Analysis</h3>
                </div>
                
                <div className={`${themeClasses.textSecondary} whitespace-pre-wrap`}>
                  {analysis.analysis?.aiInsights}
                </div>
              </div>
            )}

            {/* Trading Patterns */}
            <div className={`p-6 rounded-lg ${themeClasses.surface} border ${themeClasses.border}`}>
              <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>
                Trading Patterns Detected
              </h3>
              
              <div className="space-y-4">
                {(analysis.analysis?.patterns || []).map((pattern, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border ${getImpactColor(pattern.impact)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {getImpactIcon(pattern.impact)}
                          <h4 className={`font-medium ${themeClasses.text}`}>
                            {pattern.pattern}
                          </h4>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 mb-3">
                          <div>
                            <div className={`text-sm ${themeClasses.textSecondary}`}>Frequency</div>
                            <div className={`font-medium ${themeClasses.text}`}>
                              {pattern.frequency} trades
                            </div>
                          </div>
                          
                          <div>
                            <div className={`text-sm ${themeClasses.textSecondary}`}>Win Rate</div>
                            <div className={`font-medium ${
                              pattern.winRate >= 50 ? 'text-green-500' : 'text-red-500'
                            }`}>
                              {pattern.winRate}%
                            </div>
                          </div>
                          
                          <div>
                            <div className={`text-sm ${themeClasses.textSecondary}`}>Avg P&L</div>
                            <div className={`font-medium ${
                              pattern.avgPnL >= 0 ? 'text-green-500' : 'text-red-500'
                            }`}>
                              ${pattern.avgPnL.toFixed(2)}
                            </div>
                          </div>
                        </div>
                        
                        <p className={`text-sm ${themeClasses.textSecondary}`}>
                          <strong>Recommendation:</strong> {pattern.recommendation}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Analysis Metadata */}
            <div className={`text-xs ${themeClasses.textSecondary} text-center`}>
              Analysis generated at {new Date(analysis.generatedAt).toLocaleString()} 
              • {analysis.tradesAnalyzed} trades analyzed
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}