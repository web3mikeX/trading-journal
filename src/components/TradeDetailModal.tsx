"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity, 
  Target, 
  Shield, 
  BookOpen, 
  Camera,
  Edit,
  Trash2,
  Loader2,
  ArrowUpCircle,
  ArrowDownCircle,
  BarChart3
} from "lucide-react"
import { useTheme } from "@/components/ThemeProvider"
import { getThemeClasses } from "@/lib/theme"
import SmartChartSelector from "@/components/SmartChartSelector"

interface Trade {
  id: string
  symbol: string
  side: 'LONG' | 'SHORT'
  entryDate: Date
  exitDate?: Date
  entryPrice: number
  exitPrice?: number
  quantity: number
  grossPnL?: number
  netPnL?: number
  returnPercent?: number
  commission?: number
  entryFees?: number
  exitFees?: number
  swap?: number
  stopLoss?: number
  takeProfit?: number
  riskAmount?: number
  market?: string
  contractMultiplier?: number
  contractType?: string
  status: 'OPEN' | 'CLOSED' | 'CANCELLED'
  strategy?: string
  setup?: string
  notes?: string
  dataSource?: string
  
  // Enhanced CSV and execution data
  rawCsvData?: string
  fillIds?: string
  executionMetadata?: string
  timingData?: string
  slippage?: number
  orderDetails?: string
  
  // Advanced performance metrics
  maxAdverseExcursion?: number
  maxFavorableExcursion?: number
  commissionPerUnit?: number
  executionDuration?: number
}

interface TradeDetailModalProps {
  isOpen: boolean
  onClose: () => void
  tradeId: string | null
  onEdit?: (tradeId: string) => void
  onDelete?: (tradeId: string) => void
}

export default function TradeDetailModal({ 
  isOpen, 
  onClose, 
  tradeId, 
  onEdit, 
  onDelete 
}: TradeDetailModalProps) {
  const { theme } = useTheme()
  const themeClasses = getThemeClasses(theme)
  
  const [trade, setTrade] = useState<Trade | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'risk' | 'execution' | 'contract' | 'journal' | 'chart'>('overview')

  // Fetch trade details when modal opens
  useEffect(() => {
    if (isOpen && tradeId) {
      fetchTradeDetails()
    }
  }, [isOpen, tradeId])

  const fetchTradeDetails = useCallback(async () => {
    if (!tradeId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/trades/${tradeId}`, {
        headers: {
          'Cache-Control': 'max-age=300' // 5 minute cache
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch trade details: ${response.status}`)
      }
      
      const tradeData = await response.json()
      
      // Validate that we have essential data
      if (!tradeData.id || !tradeData.symbol) {
        throw new Error('Invalid trade data received')
      }
      
      // Safely convert date strings to Date objects with error handling
      const processedTrade = {
        ...tradeData,
        entryDate: tradeData.entryDate ? new Date(tradeData.entryDate) : new Date(),
        exitDate: tradeData.exitDate ? new Date(tradeData.exitDate) : undefined
      }
      
      // Validate dates
      if (isNaN(processedTrade.entryDate.getTime())) {
        processedTrade.entryDate = new Date()
      }
      
      if (processedTrade.exitDate && isNaN(processedTrade.exitDate.getTime())) {
        processedTrade.exitDate = undefined
      }
      
      setTrade(processedTrade)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trade details')
    } finally {
      setLoading(false)
    }
  }, [tradeId])

  const handleEdit = useCallback(() => {
    if (trade && onEdit) {
      onEdit(trade.id)
    }
  }, [trade, onEdit])

  const handleDelete = useCallback(() => {
    if (trade && onDelete) {
      onDelete(trade.id)
    }
  }, [trade, onDelete])

  const currencyFormatter = useMemo(() => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    })
  }, [])

  const dateFormatter = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }, [])

  const formatCurrency = useCallback((amount: number) => {
    return currencyFormatter.format(amount)
  }, [currencyFormatter])

  const formatDate = useCallback((date: Date) => {
    return dateFormatter.format(date)
  }, [dateFormatter])

  const getPnLColor = (pnl: number) => {
    if (pnl > 0) return 'text-green-600 dark:text-green-400'
    if (pnl < 0) return 'text-red-600 dark:text-red-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'chart', label: 'Chart', icon: BarChart3 },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'execution', label: 'Execution', icon: Target },
    { id: 'contract', label: 'Contract', icon: DollarSign },
    { id: 'risk', label: 'Risk', icon: Shield },
    { id: 'journal', label: 'Journal', icon: BookOpen }
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 overflow-y-auto"
        >
          <div className="flex min-h-screen items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={onClose}
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`relative w-full max-w-4xl ${themeClasses.surface} rounded-lg shadow-xl`}
            >
              {/* Header */}
              <div className={`flex items-center justify-between p-6 border-b ${themeClasses.border}`}>
                <div className="flex items-center space-x-4">
                  {trade && (
                    <>
                      <div className="flex items-center space-x-2">
                        {trade.side === 'LONG' ? (
                          <ArrowUpCircle className="h-6 w-6 text-green-600" />
                        ) : (
                          <ArrowDownCircle className="h-6 w-6 text-red-600" />
                        )}
                        <h2 className={`text-xl font-semibold ${themeClasses.text}`}>
                          {trade.symbol} - {trade.side}
                        </h2>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        trade.status === 'CLOSED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        trade.status === 'OPEN' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {trade.status}
                      </div>
                    </>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {trade && (
                    <>
                      <button
                        onClick={handleEdit}
                        className={`p-2 rounded-lg ${themeClasses.button} hover:bg-opacity-80 transition-colors`}
                        title="Edit Trade"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleDelete}
                        className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 transition-colors"
                        title="Delete Trade"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={onClose}
                    className={`p-2 rounded-lg ${themeClasses.button} hover:bg-opacity-80 transition-colors`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {loading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                )}

                {error && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
                      <button
                        onClick={fetchTradeDetails}
                        className={`px-4 py-2 rounded-lg ${themeClasses.button} text-white`}
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                )}

                {trade && !loading && !error && (
                  <>
                    {/* Tabs */}
                    <div className="flex space-x-1 mb-6">
                      {tabs.map((tab) => {
                        const Icon = tab.icon
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as 'overview' | 'performance' | 'risk' | 'execution' | 'contract' | 'journal' | 'chart')}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                              activeTab === tab.id
                                ? `${themeClasses.button} text-white`
                                : `${themeClasses.button} hover:bg-opacity-80`
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            <span>{tab.label}</span>
                          </button>
                        )
                      })}
                    </div>

                    {/* Tab Content */}
                    <div className="space-y-6">
                      {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Basic Info */}
                          <div className={`p-4 rounded-lg ${themeClasses.surface} border ${themeClasses.border}`}>
                            <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>Trade Details</h3>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className={themeClasses.textSecondary}>Entry Date:</span>
                                <span className={themeClasses.text}>{formatDate(trade.entryDate)}</span>
                              </div>
                              {trade.exitDate && (
                                <div className="flex justify-between">
                                  <span className={themeClasses.textSecondary}>Exit Date:</span>
                                  <span className={themeClasses.text}>{formatDate(trade.exitDate)}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className={themeClasses.textSecondary}>Entry Price:</span>
                                <span className={themeClasses.text}>{formatCurrency(trade.entryPrice)}</span>
                              </div>
                              {trade.exitPrice && (
                                <div className="flex justify-between">
                                  <span className={themeClasses.textSecondary}>Exit Price:</span>
                                  <span className={themeClasses.text}>{formatCurrency(trade.exitPrice)}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className={themeClasses.textSecondary}>Quantity:</span>
                                <span className={themeClasses.text}>{trade.quantity}</span>
                              </div>
                              {trade.market && (
                                <div className="flex justify-between">
                                  <span className={themeClasses.textSecondary}>Market:</span>
                                  <span className={themeClasses.text}>{trade.market}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* P&L Summary */}
                          <div className={`p-4 rounded-lg ${themeClasses.surface} border ${themeClasses.border}`}>
                            <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>P&L Summary</h3>
                            <div className="space-y-3">
                              {trade.grossPnL !== undefined && (
                                <div className="flex justify-between">
                                  <span className={themeClasses.textSecondary}>Gross P&L:</span>
                                  <span className={getPnLColor(trade.grossPnL)}>{formatCurrency(trade.grossPnL)}</span>
                                </div>
                              )}
                              {trade.netPnL !== undefined && (
                                <div className="flex justify-between">
                                  <span className={themeClasses.textSecondary}>Net P&L:</span>
                                  <span className={getPnLColor(trade.netPnL)}>{formatCurrency(trade.netPnL)}</span>
                                </div>
                              )}
                              {trade.returnPercent !== undefined && (
                                <div className="flex justify-between">
                                  <span className={themeClasses.textSecondary}>Return %:</span>
                                  <span className={getPnLColor(trade.returnPercent ?? 0)}>{(trade.returnPercent ?? 0).toFixed(2)}%</span>
                                </div>
                              )}
                              {trade.commission !== undefined && (
                                <div className="flex justify-between">
                                  <span className={themeClasses.textSecondary}>Commission:</span>
                                  <span className={themeClasses.text}>{formatCurrency(trade.commission)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}


                      {activeTab === 'chart' && (
                        <div className="space-y-6">
                          {/* Chart Section */}
                          <div className={`p-4 rounded-lg ${themeClasses.surface} border ${themeClasses.border}`}>
                            <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>Trade Chart Visualization</h3>
                            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                              <p className="text-sm text-blue-700 dark:text-blue-300">
                                <strong>Professional Chart Analysis:</strong> Interactive candlestick chart with precise entry/exit markers and price action visualization
                              </p>
                            </div>
                            <SmartChartSelector
                              symbol={trade.symbol}
                              trade={trade}
                              width={800}
                              height={500}
                              showTradeMarkers={true}
                              preferRealData={true}
                              autoFallback={true}
                              showProviderInfo={true}
                            />
                          </div>
                        </div>
                      )}

                      {activeTab === 'performance' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Contract Details */}
                          <div className={`p-4 rounded-lg ${themeClasses.surface} border ${themeClasses.border}`}>
                            <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>Contract Details</h3>
                            <div className="space-y-3">
                              {trade.contractMultiplier && (
                                <div className="flex justify-between">
                                  <span className={themeClasses.textSecondary}>Contract Multiplier:</span>
                                  <span className={themeClasses.text}>{trade.contractMultiplier}x</span>
                                </div>
                              )}
                              {trade.contractType && (
                                <div className="flex justify-between">
                                  <span className={themeClasses.textSecondary}>Contract Type:</span>
                                  <span className={themeClasses.text}>{trade.contractType}</span>
                                </div>
                              )}
                              {trade.strategy && (
                                <div className="flex justify-between">
                                  <span className={themeClasses.textSecondary}>Strategy:</span>
                                  <span className={themeClasses.text}>{trade.strategy}</span>
                                </div>
                              )}
                              {trade.setup && (
                                <div className="flex justify-between">
                                  <span className={themeClasses.textSecondary}>Setup:</span>
                                  <span className={themeClasses.text}>{trade.setup}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Fees Breakdown */}
                          <div className={`p-4 rounded-lg ${themeClasses.surface} border ${themeClasses.border}`}>
                            <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>Fees Breakdown</h3>
                            <div className="space-y-3">
                              {trade.entryFees !== undefined && (
                                <div className="flex justify-between">
                                  <span className={themeClasses.textSecondary}>Entry Fees:</span>
                                  <span className={themeClasses.text}>{formatCurrency(trade.entryFees)}</span>
                                </div>
                              )}
                              {trade.exitFees !== undefined && (
                                <div className="flex justify-between">
                                  <span className={themeClasses.textSecondary}>Exit Fees:</span>
                                  <span className={themeClasses.text}>{formatCurrency(trade.exitFees)}</span>
                                </div>
                              )}
                              {trade.commission !== undefined && (
                                <div className="flex justify-between">
                                  <span className={themeClasses.textSecondary}>Commission:</span>
                                  <span className={themeClasses.text}>{formatCurrency(trade.commission)}</span>
                                </div>
                              )}
                              {trade.swap !== undefined && (
                                <div className="flex justify-between">
                                  <span className={themeClasses.textSecondary}>Swap:</span>
                                  <span className={themeClasses.text}>{formatCurrency(trade.swap)}</span>
                                </div>
                              )}
                              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex justify-between font-semibold">
                                  <span className={themeClasses.textSecondary}>Total Fees:</span>
                                  <span className={themeClasses.text}>
                                    {formatCurrency(
                                      (trade.entryFees || 0) + 
                                      (trade.exitFees || 0) + 
                                      (trade.commission || 0) + 
                                      (trade.swap || 0)
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'execution' && (
                        <div className="space-y-6">
                          {/* Execution Details */}
                          <div className={`p-4 rounded-lg ${themeClasses.surface} border ${themeClasses.border}`}>
                            <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>Execution Details</h3>
                            <div className="space-y-3">
                              {trade.fillIds && (() => {
                                try {
                                  const fillIds = JSON.parse(trade.fillIds)
                                  return fillIds.map((fillId: string, index: number) => (
                                    <div key={index} className="flex justify-between">
                                      <span className={themeClasses.textSecondary}>Fill ID {index + 1}:</span>
                                      <span className={`${themeClasses.text} font-mono text-sm`}>{fillId}</span>
                                    </div>
                                  ))
                                } catch {
                                  return (
                                    <div className="flex justify-between">
                                      <span className={themeClasses.textSecondary}>Fill IDs:</span>
                                      <span className={`${themeClasses.text} font-mono text-sm`}>{trade.fillIds}</span>
                                    </div>
                                  )
                                }
                              })()}
                              
                              {trade.executionDuration !== undefined && (
                                <div className="flex justify-between">
                                  <span className={themeClasses.textSecondary}>Execution Duration:</span>
                                  <span className={themeClasses.text}>
                                    {trade.executionDuration < 1000 ? 
                                      `${trade.executionDuration}ms` : 
                                      `${(trade.executionDuration / 1000).toFixed(1)}s`
                                    }
                                  </span>
                                </div>
                              )}
                              
                              {trade.commissionPerUnit !== undefined && (
                                <div className="flex justify-between">
                                  <span className={themeClasses.textSecondary}>Commission per Unit:</span>
                                  <span className={themeClasses.text}>{formatCurrency(trade.commissionPerUnit)}</span>
                                </div>
                              )}
                              
                              {trade.slippage !== undefined && (
                                <div className="flex justify-between">
                                  <span className={themeClasses.textSecondary}>Slippage:</span>
                                  <span className={getPnLColor(trade.slippage)}>{formatCurrency(trade.slippage)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Timing Analysis */}
                          {trade.timingData && (() => {
                            try {
                              const timingData = JSON.parse(trade.timingData)
                              return (
                                <div className={`p-4 rounded-lg ${themeClasses.surface} border ${themeClasses.border}`}>
                                  <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>Timing Analysis</h3>
                                  <div className="space-y-3">
                                    {timingData.buyTimestamp && (
                                      <div className="flex justify-between">
                                        <span className={themeClasses.textSecondary}>Entry Timestamp:</span>
                                        <span className={`${themeClasses.text} font-mono text-sm`}>
                                          {new Date(timingData.buyTimestamp).toLocaleString()}
                                        </span>
                                      </div>
                                    )}
                                    {timingData.sellTimestamp && (
                                      <div className="flex justify-between">
                                        <span className={themeClasses.textSecondary}>Exit Timestamp:</span>
                                        <span className={`${themeClasses.text} font-mono text-sm`}>
                                          {new Date(timingData.sellTimestamp).toLocaleString()}
                                        </span>
                                      </div>
                                    )}
                                    {timingData.durationString && (
                                      <div className="flex justify-between">
                                        <span className={themeClasses.textSecondary}>Hold Duration:</span>
                                        <span className={themeClasses.text}>{timingData.durationString}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            } catch {
                              return null
                            }
                          })()}
                          
                          {/* Advanced Metrics */}
                          {(trade.maxAdverseExcursion !== undefined || trade.maxFavorableExcursion !== undefined) && (
                            <div className={`p-4 rounded-lg ${themeClasses.surface} border ${themeClasses.border}`}>
                              <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>Advanced Metrics</h3>
                              <div className="space-y-3">
                                {trade.maxAdverseExcursion !== undefined && (
                                  <div className="flex justify-between">
                                    <span className={themeClasses.textSecondary}>Max Adverse Excursion (MAE):</span>
                                    <span className="text-red-600 dark:text-red-400">
                                      {formatCurrency(trade.maxAdverseExcursion)}
                                    </span>
                                  </div>
                                )}
                                {trade.maxFavorableExcursion !== undefined && (
                                  <div className="flex justify-between">
                                    <span className={themeClasses.textSecondary}>Max Favorable Excursion (MFE):</span>
                                    <span className="text-green-600 dark:text-green-400">
                                      {formatCurrency(trade.maxFavorableExcursion)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {activeTab === 'contract' && (
                        <div className="space-y-6">
                          {/* Contract Specifications */}
                          <div className={`p-4 rounded-lg ${themeClasses.surface} border ${themeClasses.border}`}>
                            <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>Contract Specifications</h3>
                            <div className="space-y-3">
                              {trade.contractMultiplier && (
                                <div className="flex justify-between">
                                  <span className={themeClasses.textSecondary}>Contract Multiplier:</span>
                                  <span className={themeClasses.text}>{trade.contractMultiplier}x</span>
                                </div>
                              )}
                              {trade.contractType && (
                                <div className="flex justify-between">
                                  <span className={themeClasses.textSecondary}>Contract Type:</span>
                                  <span className={themeClasses.text}>{trade.contractType}</span>
                                </div>
                              )}
                              {trade.market && (
                                <div className="flex justify-between">
                                  <span className={themeClasses.textSecondary}>Market:</span>
                                  <span className={themeClasses.text}>{trade.market}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Execution Metadata */}
                          {trade.executionMetadata && (() => {
                            try {
                              const metadata = JSON.parse(trade.executionMetadata)
                              return (
                                <div className={`p-4 rounded-lg ${themeClasses.surface} border ${themeClasses.border}`}>
                                  <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>Execution Metadata</h3>
                                  <div className="space-y-3">
                                    {metadata.priceFormat !== null && (
                                      <div className="flex justify-between">
                                        <span className={themeClasses.textSecondary}>Price Format:</span>
                                        <span className={themeClasses.text}>{metadata.priceFormat}</span>
                                      </div>
                                    )}
                                    {metadata.priceFormatType !== null && (
                                      <div className="flex justify-between">
                                        <span className={themeClasses.textSecondary}>Price Format Type:</span>
                                        <span className={themeClasses.text}>{metadata.priceFormatType}</span>
                                      </div>
                                    )}
                                    {metadata.tickSize !== null && (
                                      <div className="flex justify-between">
                                        <span className={themeClasses.textSecondary}>Tick Size:</span>
                                        <span className={themeClasses.text}>{metadata.tickSize}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            } catch {
                              return null
                            }
                          })()}
                          
                          {/* Raw CSV Data */}
                          {trade.rawCsvData && (() => {
                            try {
                              const rawData = JSON.parse(trade.rawCsvData)
                              return (
                                <div className={`p-4 rounded-lg ${themeClasses.surface} border ${themeClasses.border}`}>
                                  <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>Original CSV Data</h3>
                                  <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {rawData.headers && rawData.originalRow && rawData.headers.map((header: string, index: number) => (
                                      <div key={index} className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                                        <span className={`${themeClasses.textSecondary} font-semibold`}>{header}:</span>
                                        <span className={`${themeClasses.text} font-mono text-sm`}>
                                          {rawData.originalRow[index] || '-'}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )
                            } catch {
                              return (
                                <div className={`p-4 rounded-lg ${themeClasses.surface} border ${themeClasses.border}`}>
                                  <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>Raw Data</h3>
                                  <pre className={`${themeClasses.text} text-xs overflow-auto max-h-40`}>
                                    {trade.rawCsvData}
                                  </pre>
                                </div>
                              )
                            }
                          })()}
                        </div>
                      )}

                      {activeTab === 'risk' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Risk Management */}
                          <div className={`p-4 rounded-lg ${themeClasses.surface} border ${themeClasses.border}`}>
                            <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>Risk Management</h3>
                            <div className="space-y-3">
                              {trade.stopLoss && (
                                <div className="flex justify-between">
                                  <span className={themeClasses.textSecondary}>Stop Loss:</span>
                                  <span className={themeClasses.text}>{formatCurrency(trade.stopLoss)}</span>
                                </div>
                              )}
                              {trade.takeProfit && (
                                <div className="flex justify-between">
                                  <span className={themeClasses.textSecondary}>Take Profit:</span>
                                  <span className={themeClasses.text}>{formatCurrency(trade.takeProfit)}</span>
                                </div>
                              )}
                              {trade.riskAmount && (
                                <div className="flex justify-between">
                                  <span className={themeClasses.textSecondary}>Risk Amount:</span>
                                  <span className={themeClasses.text}>{formatCurrency(trade.riskAmount)}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Risk Metrics */}
                          {trade.stopLoss && trade.takeProfit && (
                            <div className={`p-4 rounded-lg ${themeClasses.surface} border ${themeClasses.border}`}>
                              <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>Risk Metrics</h3>
                              <div className="space-y-3">
                                <div className="flex justify-between">
                                  <span className={themeClasses.textSecondary}>Risk:Reward Ratio:</span>
                                  <span className={themeClasses.text}>
                                    {trade.side === 'LONG' 
                                      ? `1:${((trade.takeProfit - trade.entryPrice) / (trade.entryPrice - trade.stopLoss)).toFixed(2)}`
                                      : `1:${((trade.entryPrice - trade.takeProfit) / (trade.stopLoss - trade.entryPrice)).toFixed(2)}`
                                    }
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className={themeClasses.textSecondary}>Max Risk:</span>
                                  <span className="text-red-600 dark:text-red-400">
                                    {trade.side === 'LONG' 
                                      ? formatCurrency((trade.entryPrice - trade.stopLoss) * trade.quantity * (trade.contractMultiplier || 1))
                                      : formatCurrency((trade.stopLoss - trade.entryPrice) * trade.quantity * (trade.contractMultiplier || 1))
                                    }
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className={themeClasses.textSecondary}>Max Reward:</span>
                                  <span className="text-green-600 dark:text-green-400">
                                    {trade.side === 'LONG' 
                                      ? formatCurrency((trade.takeProfit - trade.entryPrice) * trade.quantity * (trade.contractMultiplier || 1))
                                      : formatCurrency((trade.entryPrice - trade.takeProfit) * trade.quantity * (trade.contractMultiplier || 1))
                                    }
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {activeTab === 'journal' && (
                        <div className="space-y-6">
                          {/* Trade Notes */}
                          <div className={`p-4 rounded-lg ${themeClasses.surface} border ${themeClasses.border}`}>
                            <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>Trade Notes</h3>
                            {trade.notes ? (
                              <div className={`p-3 rounded-lg ${themeClasses.background} ${themeClasses.text}`}>
                                <p className="whitespace-pre-wrap">{trade.notes}</p>
                              </div>
                            ) : (
                              <p className={themeClasses.textSecondary}>No notes available for this trade.</p>
                            )}
                          </div>

                          {/* Data Source */}
                          <div className={`p-4 rounded-lg ${themeClasses.surface} border ${themeClasses.border}`}>
                            <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>Trade Source</h3>
                            <div className="flex justify-between">
                              <span className={themeClasses.textSecondary}>Data Source:</span>
                              <span className={themeClasses.text}>{trade.dataSource || 'Manual'}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
