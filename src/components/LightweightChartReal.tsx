"use client"

import { useEffect, useRef, useState, memo, useCallback, useMemo } from "react"
import { useTheme } from "@/components/ThemeProvider"
import { getEnhancedMarketData, type MarketDataResult } from "@/services/enhancedMarketData"

// Dynamic import to avoid SSR issues
let LightweightChartsModule: any = null
let createChart: any = null
let createSeriesMarkers: any = null

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

interface LightweightChartRealProps {
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

function LightweightChartReal({
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
}: LightweightChartRealProps) {
  const { theme } = useTheme()
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<any>(null)
  const seriesRef = useRef<any>(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [marketData, setMarketData] = useState<MarketDataResult | null>(null)
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false)
  const [loadingStage, setLoadingStage] = useState<'library' | 'data' | 'chart' | 'complete'>('library')
  const [showEarlyChart, setShowEarlyChart] = useState(false)

  // Load TradingView Lightweight Charts library
  useEffect(() => {
    const loadLibrary = async () => {
      if (LightweightChartsModule) {
        setIsLibraryLoaded(true)
        return
      }

      try {
        LightweightChartsModule = await import('lightweight-charts')
        createChart = LightweightChartsModule.createChart
        createSeriesMarkers = LightweightChartsModule.createSeriesMarkers
        setIsLibraryLoaded(true)
        setLoadingStage('data')
        // Library successfully loaded
      } catch (error) {
        console.error('Failed to load TradingView Lightweight Charts:', error)
        setError('Failed to load charting library')
      }
    }

    loadLibrary()
  }, [])

  // Enhanced data fetching with timeframe support
  useEffect(() => {
    if (!symbol) return

    let isCancelled = false

    const fetchData = async () => {
      try {
        setIsLoading(true)
        setLoadingStage('data')
        setError(null)
        
        // Get trade context for better synthetic data
        const tradeContext = trade ? {
          entryPrice: trade.entryPrice,
          exitPrice: trade.exitPrice,
          entryDate: trade.entryDate,
          exitDate: trade.exitDate
        } : undefined
        
        // Default to daily data with enhanced volatility
        const data = await getEnhancedMarketData(
          symbol, 
          7, 
          preferReal, 
          tradeContext,
          interval || '1d'
        )
        
        if (!isCancelled) {
          setMarketData(data)
          setLoadingStage('chart')
          console.log(`✅ LightweightChartReal: Data loaded - ${data.dataSource}, ${data.data.length} points`)
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('LightweightChartReal: Market data fetch failed:', err)
          setError(err instanceof Error ? err.message : 'Failed to fetch market data')
          setIsLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isCancelled = true
    }
  }, [symbol, preferReal, trade, interval])

  // Memoize chart data conversion to prevent unnecessary recalculations
  const chartData = useMemo(() => {
    if (!marketData?.data) return []
    return marketData.data.map(item => ({
      time: Math.floor(item.timestamp / 1000), // TradingView expects seconds
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
    }))
  }, [marketData?.data])

  // Initialize and configure chart
  useEffect(() => {
    if (!isLibraryLoaded || !marketData?.data?.length || !chartContainerRef.current || !createChart) {
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

      // Create chart with theme-appropriate colors
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
          vertLines: {
            color: theme === 'dark' ? '#374151' : '#e5e7eb',
          },
          horzLines: {
            color: theme === 'dark' ? '#374151' : '#e5e7eb',
          },
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

      // Create candlestick series using v5 API
      const candlestickSeries = chart.addSeries(LightweightChartsModule.CandlestickSeries, {
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderDownColor: '#ef4444',
        borderUpColor: '#22c55e',
        wickDownColor: '#ef4444',
        wickUpColor: '#22c55e',
      })

      seriesRef.current = candlestickSeries

      // Use memoized chart data

      // Set the data
      candlestickSeries.setData(chartData)

      // Auto-fit chart content immediately
      chart.timeScale().fitContent()

      // Mark loading as complete - chart is ready even without markers
      setIsLoading(false)
      setLoadingStage('complete')
      setShowEarlyChart(true)

      // Call onLoad callback early
      if (onLoad) {
        onLoad()
      }

      // Add trade markers if trade data is provided (async, non-blocking)
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

            // Exit marker (if available)
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

            // Use v5 markers API
            if (typeof createSeriesMarkers === 'function') {
              const seriesMarkers = createSeriesMarkers(candlestickSeries, markers)
              // Trade markers added successfully
            } else {
              // Markers API not available
            }
          } catch (markersError) {
            // Failed to add trade markers, continuing without them
            // Continue without markers rather than failing completely
          }
        }, 100) // Add markers after chart is displayed
      }

      // Auto-fit chart content
      chart.timeScale().fitContent()

      // Chart initialization completed

    } catch (error) {
      // Chart initialization failed
      setError('Failed to initialize chart')
    }

    // Cleanup function
    return () => {
      if (chartRef.current) {
        try {
          chartRef.current.remove()
        } catch (e) {
          // Chart cleanup completed
        }
        chartRef.current = null
        seriesRef.current = null
      }
    }
  }, [isLibraryLoaded, marketData, theme, width, height, trade, showTradeMarkers])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        const container = chartContainerRef.current
        chartRef.current.applyOptions({
          width: container.clientWidth,
          height: container.clientHeight,
        })
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (!isLibraryLoaded || isLoading) {
    return (
      <div className={`lightweight-chart-container ${className}`}>
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
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {loadingStage === 'library' && 'Loading...'}
              {loadingStage === 'data' && `${symbol}...`}
              {loadingStage === 'chart' && 'Chart...'}
              {!isLibraryLoaded && isLoading && 'Loading...'}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`lightweight-chart-container ${className}`}>
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
              Chart Error: {error}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Symbol: {symbol}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`lightweight-chart-container ${className}`}>
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
          {marketData?.dataSource === 'yahoo_finance' ? 'Live Market Data' : 
           marketData?.dataSource === 'alpha_vantage' ? 'Market Data' :
           marketData?.dataSource === 'enhanced_synthetic' ? 'Enhanced Demo Data' : 
           marketData?.dataSource === 'synthetic' ? 'Demo Data' :
           'Real-time Data'}
        </span>
        {marketData?.data && (
          <>
            <span className="mx-2">•</span>
            <span>{marketData.data.length} data points</span>
          </>
        )}
      </div>
      
      {/* Data source explanation */}
      {marketData?.metadata?.explanation && (
        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 text-center italic">
          {marketData.metadata.explanation}
        </div>
      )}
    </div>
  )
}

export default memo(LightweightChartReal)