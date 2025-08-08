"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "@/components/ThemeProvider"
import { getTradingViewSymbol } from "@/lib/tradingViewSymbolMapping"
import { getTradingViewConfig } from "@/lib/tradingViewConfig"

interface Trade {
  id: string
  symbol: string
  side: 'LONG' | 'SHORT'
  entryDate: Date
  exitDate?: Date
  entryPrice: number
  exitPrice?: number
  quantity: number
  netPnL?: number
}

interface EnhancedChartWithTradingViewProps {
  symbol?: string
  trade?: Trade
  width?: number
  height?: number
  showTradeMarkers?: boolean
  timeframe?: string
}

// Available timeframes for TradingView
const TIMEFRAMES = [
  { value: '1', label: '1m', tvInterval: '1' },
  { value: '5', label: '5m', tvInterval: '5' },
  { value: '15', label: '15m', tvInterval: '15' },
  { value: '60', label: '1h', tvInterval: '60' },
  { value: '240', label: '4h', tvInterval: '240' },
  { value: '1D', label: '1D', tvInterval: '1D' },
  { value: '1W', label: '1W', tvInterval: '1W' },
  { value: '1M', label: '1M', tvInterval: '1M' }
]

export default function EnhancedChartWithTradingView({ 
  symbol = "NQ",
  trade,
  width = 800,
  height = 400,
  showTradeMarkers = true,
  timeframe = "1D"
}: EnhancedChartWithTradingViewProps) {
  const { theme } = useTheme()
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const widgetRef = useRef<any>(null)
  
  const [status, setStatus] = useState('Initializing TradingView...')
  const [error, setError] = useState<string | null>(null)
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe)
  const [isLoading, setIsLoading] = useState(false)

  // Helper function to safely get date object
  const safeDate = (date: any): Date => {
    if (!date) return new Date()
    return date instanceof Date ? date : new Date(date)
  }

  useEffect(() => {
    if (!chartContainerRef.current) return

    let mounted = true
    setIsLoading(true)

    const initializeTradingView = async () => {
      if (!mounted) return

      try {
        setStatus('Loading TradingView chart...')
        setError(null)

        // Clean up existing widget
        if (widgetRef.current) {
          try {
            widgetRef.current.remove()
          } catch (e) {
            console.warn('Error removing previous TradingView widget:', e)
          }
        }

        // Get TradingView symbol
        const tradingViewSymbol = getTradingViewSymbol(symbol)
        if (!tradingViewSymbol) {
          throw new Error(`No TradingView symbol mapping found for ${symbol}`)
        }

        // Configure TradingView widget
        const config = getTradingViewConfig()
        const widgetOptions = {
          symbol: tradingViewSymbol,
          interval: selectedTimeframe,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          theme: theme === 'dark' ? 'dark' : 'light',
          style: '1',
          locale: 'en',
          toolbar_bg: theme === 'dark' ? '#1f2937' : '#ffffff',
          enable_publishing: false,
          allow_symbol_change: false,
          container_id: chartContainerRef.current.id,
          width: width,
          height: height,
          hide_top_toolbar: !config.showTopToolbar,
          hide_side_toolbar: !config.showSideToolbar,
          hide_legend: false,
          library_path: '/charting_library/',
          disabled_features: [
            'header_symbol_search',
            'header_compare',
            'header_screenshot',
            'header_undo_redo',
            'header_chart_type',
            'header_settings',
            'header_fullscreen_button'
          ],
          enabled_features: [
            'study_templates',
            'hide_left_toolbar_by_default',
            'side_toolbar_in_fullscreen_mode'
          ],
          overrides: {
            'paneProperties.background': theme === 'dark' ? '#1f2937' : '#ffffff',
            'paneProperties.vertGridProperties.color': theme === 'dark' ? '#374151' : '#f1f5f9',
            'paneProperties.horzGridProperties.color': theme === 'dark' ? '#374151' : '#f1f5f9',
            'scalesProperties.textColor': theme === 'dark' ? '#f1f5f9' : '#1e293b',
            'mainSeriesProperties.candleStyle.upColor': '#10b981',
            'mainSeriesProperties.candleStyle.downColor': '#ef4444',
            'mainSeriesProperties.candleStyle.borderUpColor': '#059669',
            'mainSeriesProperties.candleStyle.borderDownColor': '#dc2626',
            'mainSeriesProperties.candleStyle.wickUpColor': '#059669',
            'mainSeriesProperties.candleStyle.wickDownColor': '#dc2626'
          }
        }

        // Dynamically load TradingView widget
        const script = document.createElement('script')
        script.src = 'https://s3.tradingview.com/tv.js'
        script.async = true
        
        script.onload = () => {
          if (!mounted || !window.TradingView) return

          try {
            widgetRef.current = new window.TradingView.widget(widgetOptions)
            
            // Add trade markers after chart loads
            if (trade && showTradeMarkers) {
              widgetRef.current.onChartReady(() => {
                addTradeMarkers()
              })
            }

            setStatus('✅ TradingView chart loaded!')
            setIsLoading(false)
          } catch (error) {
            console.error('Error creating TradingView widget:', error)
            setError('Failed to initialize TradingView chart')
            setIsLoading(false)
          }
        }

        script.onerror = () => {
          setError('Failed to load TradingView library')
          setIsLoading(false)
        }

        document.head.appendChild(script)

      } catch (error) {
        console.error('Error initializing TradingView:', error)
        setError(error instanceof Error ? error.message : 'Failed to initialize chart')
        setIsLoading(false)
      }
    }

    initializeTradingView()

    return () => {
      if (widgetRef.current) {
        try {
          widgetRef.current.remove()
        } catch (e) {
          console.warn('Error removing TradingView widget:', e)
        }
        widgetRef.current = null
      }
    }
  }, [symbol, selectedTimeframe, theme, trade, showTradeMarkers, width, height])

  const addTradeMarkers = () => {
    if (!widgetRef.current || !trade) return

    try {
      const entryDate = safeDate(trade.entryDate)
      const entryTime = Math.floor(entryDate.getTime() / 1000)

      // Create entry marker
      widgetRef.current.createShape({
        time: entryTime,
        shape: trade.side === 'LONG' ? 'arrow_up' : 'arrow_down',
        text: `${trade.side} Entry @ $${trade.entryPrice}`,
        overrides: {
          backgroundColor: trade.side === 'LONG' ? '#10b981' : '#3b82f6',
          borderColor: trade.side === 'LONG' ? '#059669' : '#2563eb',
          color: '#ffffff'
        }
      })

      // Create entry price line
      widgetRef.current.createMultipointShape({
        points: [
          { time: entryTime - 3600, price: trade.entryPrice },
          { time: entryTime + 3600, price: trade.entryPrice }
        ],
        shape: 'horizontal_line',
        text: `Entry: $${trade.entryPrice}`,
        overrides: {
          backgroundColor: trade.side === 'LONG' ? '#10b981' : '#3b82f6',
          borderColor: trade.side === 'LONG' ? '#059669' : '#2563eb'
        }
      })

      // Add exit markers if available
      if (trade.exitDate && trade.exitPrice) {
        const exitDate = safeDate(trade.exitDate)
        const exitTime = Math.floor(exitDate.getTime() / 1000)
        const isProfit = trade.side === 'LONG' 
          ? trade.exitPrice > trade.entryPrice 
          : trade.exitPrice < trade.entryPrice

        const pnl = trade.side === 'LONG'
          ? (trade.exitPrice - trade.entryPrice) * trade.quantity
          : (trade.entryPrice - trade.exitPrice) * trade.quantity
        
        const pnlText = pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`

        // Create exit marker
        widgetRef.current.createShape({
          time: exitTime,
          shape: trade.side === 'LONG' ? 'arrow_down' : 'arrow_up',
          text: `Exit @ $${trade.exitPrice} (${pnlText})`,
          overrides: {
            backgroundColor: isProfit ? '#10b981' : '#f59e0b',
            borderColor: isProfit ? '#059669' : '#d97706',
            color: '#ffffff'
          }
        })

        // Create exit price line
        widgetRef.current.createMultipointShape({
          points: [
            { time: exitTime - 3600, price: trade.exitPrice },
            { time: exitTime + 3600, price: trade.exitPrice }
          ],
          shape: 'horizontal_line',
          text: `Exit: $${trade.exitPrice} (${pnlText})`,
          overrides: {
            backgroundColor: isProfit ? '#10b981' : '#f59e0b',
            borderColor: isProfit ? '#059669' : '#d97706'
          }
        })
      }

    } catch (error) {
      console.warn('Error adding trade markers:', error)
    }
  }

  const handleTimeframeChange = (newTimeframe: string) => {
    setSelectedTimeframe(newTimeframe)
    setIsLoading(true)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="professional-chart-container">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {symbol} Chart
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Timeframe:</span>
            <div className="flex space-x-1">
              {TIMEFRAMES.map(tf => (
                <button
                  key={tf.value}
                  onClick={() => handleTimeframeChange(tf.tvInterval)}
                  disabled={isLoading}
                  className={`px-2 py-1 text-xs rounded ${
                    selectedTimeframe === tf.tvInterval
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div
          style={{
            width: `${width}px`,
            height: `${height}px`,
            position: 'relative',
            backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
            border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div className="text-center p-4">
            <div className="w-48 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-4 mx-auto">
              <div 
                className="h-2 bg-blue-500 rounded-full transition-all duration-300 ease-out animate-pulse"
                style={{ width: '60%' }}
              ></div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {status}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="professional-chart-container">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {symbol} Chart
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Timeframe:</span>
            <div className="flex space-x-1">
              {TIMEFRAMES.map(tf => (
                <button
                  key={tf.value}
                  onClick={() => handleTimeframeChange(tf.tvInterval)}
                  className={`px-2 py-1 text-xs rounded ${
                    selectedTimeframe === tf.tvInterval
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div
          style={{
            width: `${width}px`,
            height: `${height}px`,
            position: 'relative',
            backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
            border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div className="text-center p-6">
            <div className="text-red-500 mb-2">⚠️</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {error}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Symbol: {symbol} | Timeframe: {selectedTimeframe}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Success state - TradingView widget loaded
  return (
    <div className="professional-chart-container">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {symbol} Chart
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Timeframe:</span>
          <div className="flex space-x-1">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf.value}
                onClick={() => handleTimeframeChange(tf.tvInterval)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  selectedTimeframe === tf.tvInterval
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div
        ref={chartContainerRef}
        id={`tradingview-chart-${symbol}-${Date.now()}`}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          position: 'relative',
          backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
          border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
          borderRadius: '8px',
        }}
      />
      
      {/* Chart metadata */}
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
        <span className="font-medium">
          {symbol} (TradingView)
        </span>
        <span className="mx-2">•</span>
        <span>Real-time data</span>
        <span className="mx-2">•</span>
        <span>{TIMEFRAMES.find(tf => tf.tvInterval === selectedTimeframe)?.label}</span>
        {trade && (
          <>
            <span className="mx-2">•</span>
            <span className="font-medium text-blue-600 dark:text-blue-400">
              {trade.side} Trade
            </span>
          </>
        )}
      </div>
    </div>
  )
}

// Add TradingView type declaration
declare global {
  interface Window {
    TradingView: any
  }
}
