"use client"

import { useEffect, useRef, useState, memo } from "react"
import { useTheme } from "@/components/ThemeProvider"
import { getEnhancedMarketData, type MarketDataResult } from "@/services/enhancedMarketData"

// Preload the library at module level for faster access
let LightweightChartsModule: any = null
let createChart: any = null
let isLibraryLoading = false
let libraryLoadPromise: Promise<any> | null = null

// Start loading the library immediately when module is imported
const preloadLibrary = () => {
  if (LightweightChartsModule || isLibraryLoading) return libraryLoadPromise

  isLibraryLoading = true
  libraryLoadPromise = import('lightweight-charts').then(module => {
    LightweightChartsModule = module
    createChart = module.createChart
    isLibraryLoading = false
    return module
  }).catch(error => {
    isLibraryLoading = false
    throw error
  })

  return libraryLoadPromise
}

// Start preloading immediately
preloadLibrary()

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

interface FastLightweightChartProps {
  symbol?: string
  trade?: Trade
  width?: number
  height?: number
  interval?: string
  className?: string
  onLoad?: () => void
  showTradeMarkers?: boolean
  preferReal?: boolean
  allowFallback?: boolean
}

function FastLightweightChart({
  symbol = "NQ",
  trade,
  width = 800,
  height = 400,
  interval = "1D",
  className = "",
  onLoad,
  showTradeMarkers = true,
  preferReal = true,
  allowFallback = true
}: FastLightweightChartProps) {
  const { theme } = useTheme()
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<any>(null)
  const seriesRef = useRef<any>(null)
  
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [marketData, setMarketData] = useState<MarketDataResult | null>(null)
  const [loadingProgress, setLoadingProgress] = useState(0)

  // Parallel loading: Start data fetch immediately while library loads
  useEffect(() => {
    let isCancelled = false

    const loadEverything = async () => {
      try {
        setLoadingProgress(10)
        
        // Start both library and data loading in parallel
        const libraryPromise = preloadLibrary()
        const dataPromise = getEnhancedMarketData(symbol, 7, preferReal)
        
        setLoadingProgress(30)
        
        // Wait for data first (usually faster)
        const data = await dataPromise
        if (!isCancelled) {
          setMarketData(data)
          setLoadingProgress(60)
        }
        
        // Wait for library
        await libraryPromise
        if (!isCancelled) {
          setLoadingProgress(90)
          setIsReady(true)
          setLoadingProgress(100)
        }
        
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load chart')
        }
      }
    }

    loadEverything()

    return () => {
      isCancelled = true
    }
  }, [symbol, preferReal])

  // Chart creation effect - runs after both library and data are ready
  useEffect(() => {
    if (!isReady || !marketData?.data?.length || !chartContainerRef.current || !createChart) {
      return
    }

    const container = chartContainerRef.current
    
    try {
      // Clear any existing chart
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
        seriesRef.current = null
      }

      // Create chart with optimized settings
      const chart = createChart(container, {
        width,
        height,
        layout: {
          background: {
            type: 'solid',
            color: theme === 'dark' ? '#1f2937' : '#ffffff',
          },
          textColor: theme === 'dark' ? '#f9fafb' : '#1f2937',
        },
        grid: {
          vertLines: { color: theme === 'dark' ? '#374151' : '#e5e7eb' },
          horzLines: { color: theme === 'dark' ? '#374151' : '#e5e7eb' },
        },
        crosshair: {
          mode: LightweightChartsModule.CrosshairMode.Normal,
        },
        rightPriceScale: {
          borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
        },
        timeScale: {
          borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
        },
      })

      chartRef.current = chart

      // Create candlestick series
      const candlestickSeries = chart.addSeries(LightweightChartsModule.CandlestickSeries, {
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderDownColor: '#ef4444',
        borderUpColor: '#22c55e',
        wickDownColor: '#ef4444',
        wickUpColor: '#22c55e',
      })

      seriesRef.current = candlestickSeries

      // Convert and set data
      const chartData = marketData.data.map(item => ({
        time: Math.floor(item.timestamp / 1000),
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      }))

      candlestickSeries.setData(chartData)
      chart.timeScale().fitContent()

      // Add trade markers if provided
      if (trade && showTradeMarkers) {
        setTimeout(() => {
          try {
            const markers = []

            // Entry marker
            const entryTime = Math.floor(trade.entryDate.getTime() / 1000)
            markers.push({
              time: entryTime,
              position: 'belowBar' as const,
              color: trade.side === 'LONG' ? '#22c55e' : '#3b82f6',
              shape: 'arrowUp' as const,
              text: `Entry: $${trade.entryPrice.toFixed(2)}`,
            })

            // Exit marker if available
            if (trade.exitDate && trade.exitPrice) {
              const exitTime = Math.floor(trade.exitDate.getTime() / 1000)
              const isProfit = trade.side === 'LONG' 
                ? trade.exitPrice > trade.entryPrice 
                : trade.exitPrice < trade.entryPrice

              markers.push({
                time: exitTime,
                position: 'aboveBar' as const,
                color: isProfit ? '#22c55e' : '#ef4444',
                shape: 'arrowDown' as const,
                text: `Exit: $${trade.exitPrice.toFixed(2)}`,
              })
            }

            candlestickSeries.setMarkers(markers)
          } catch (markersError) {
            // Continue without markers if they fail
          }
        }, 50)
      }

      // Call onLoad callback
      if (onLoad) {
        setTimeout(onLoad, 100)
      }

    } catch (error) {
      setError('Failed to initialize chart')
    }

    // Cleanup function
    return () => {
      if (chartRef.current) {
        try {
          chartRef.current.remove()
        } catch (e) {
          // Ignore cleanup errors
        }
        chartRef.current = null
        seriesRef.current = null
      }
    }
  }, [isReady, marketData, theme, width, height, trade, showTradeMarkers, onLoad])

  // Loading state with progress
  if (!isReady || !marketData) {
    return (
      <div className={`fast-chart-container ${className}`}>
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
            {/* Progress bar */}
            <div className="w-48 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-4 mx-auto">
              <div 
                className="h-2 bg-blue-500 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
            
            {/* Fast loading skeleton */}
            <div className="mb-4">
              <div className="w-24 h-6 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mx-auto mb-2"></div>
              <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto"></div>
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {loadingProgress < 30 ? 'Loading data...' :
               loadingProgress < 60 ? 'Processing...' :
               loadingProgress < 90 ? 'Preparing chart...' :
               'Almost ready...'}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={`fast-chart-container ${className}`}>
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
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {error}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Symbol: {symbol}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Success state - chart rendered
  return (
    <div className={`fast-chart-container ${className}`}>
      <div
        ref={chartContainerRef}
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
          {symbol}
          {marketData?.metadata?.proxySymbol && ` (via ${marketData.metadata.proxySymbol})`}
        </span>
        <span className="mx-2">•</span>
        <span>
          {marketData?.dataSource === 'yahoo_finance' ? 'Live Data' : 
           marketData?.dataSource === 'alpha_vantage' ? 'Market Data' :
           marketData?.dataSource === 'enhanced_synthetic' ? 'Demo Data' : 
           'Real-time'}
        </span>
        {marketData?.data && (
          <>
            <span className="mx-2">•</span>
            <span>{marketData.data.length} points</span>
          </>
        )}
      </div>
      
      {/* Data source explanation */}
      {marketData?.metadata?.explanation && (
        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 text-center italic opacity-75">
          {marketData.metadata.explanation}
        </div>
      )}
    </div>
  )
}

export default memo(FastLightweightChart)