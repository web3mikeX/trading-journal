"use client"

import { useEffect, useRef, useState, memo } from "react"
import { useTheme } from "@/components/ThemeProvider"
import { getEnhancedMarketData, type MarketDataResult } from "@/services/enhancedMarketData"
import dynamic from "next/dynamic"

// Preload the library at module level for faster access
let LightweightChartsModule: any = null
let createChart: any = null
let isLibraryLoading = false
let libraryLoadPromise: Promise<any> | null = null

// Start loading the library immediately when module is imported
const preloadLibrary = async () => {
  if (LightweightChartsModule) return LightweightChartsModule
  if (isLibraryLoading) return libraryLoadPromise

  isLibraryLoading = true
  
  try {
    libraryLoadPromise = import('lightweight-charts')
    const module = await libraryLoadPromise
    
    // Debug library loading
    console.log('TradingView library loaded:', {
      hasCreateChart: !!module.createChart,
      createChartType: typeof module.createChart,
      hasLineStyle: !!module.LineStyle,
      hasCrosshairMode: !!module.CrosshairMode,
      moduleKeys: Object.keys(module).slice(0, 15),
      createChartString: module.createChart ? module.createChart.toString().substring(0, 100) : 'N/A'
    })
    
    // Validate required exports
    if (!module.createChart || typeof module.createChart !== 'function') {
      throw new Error('createChart function not found in module')
    }
    
    if (!module.LineStyle || !module.CrosshairMode) {
      throw new Error('Required chart constants not found in module')
    }
    
    LightweightChartsModule = module
    createChart = module.createChart
    isLibraryLoading = false
    
    return module
  } catch (error) {
    console.error('Failed to load TradingView library:', error)
    isLibraryLoading = false
    LightweightChartsModule = null
    createChart = null
    throw error
  }
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
        const tradeContext = trade ? {
          entryPrice: trade.entryPrice,
          exitPrice: trade.exitPrice
        } : undefined
        
        setLoadingProgress(20)
        
        // Load library first to ensure it's ready
        const libraryModule = await preloadLibrary()
        setLoadingProgress(50)
        
        // Then load data
        const data = await getEnhancedMarketData(symbol, 7, preferReal, tradeContext)
        if (!isCancelled) {
          setMarketData(data)
          setLoadingProgress(80)
          
          // Final validation before marking as ready
          if (libraryModule && libraryModule.createChart && data?.data?.length) {
            setIsReady(true)
            setLoadingProgress(100)
          } else {
            throw new Error('Chart prerequisites not met after loading')
          }
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
  }, [symbol, preferReal, trade])

  // Chart creation effect - runs after both library and data are ready
  useEffect(() => {
    if (!isReady || !marketData?.data?.length || !chartContainerRef.current || !createChart) {
      return
    }

    const container = chartContainerRef.current
    
    try {
      // Clear any existing chart
      if (chartRef.current) {
        try {
          chartRef.current.remove()
        } catch (removeError) {
          console.warn('Chart cleanup warning:', removeError)
        }
        chartRef.current = null
        seriesRef.current = null
      }

      // Validate prerequisites thoroughly
      if (!LightweightChartsModule) {
        throw new Error('TradingView Lightweight Charts module not loaded')
      }

      if (!createChart || typeof createChart !== 'function') {
        throw new Error('createChart function not available')
      }

      if (!marketData?.data?.length) {
        throw new Error('No market data available for chart')
      }

      // Validate essential chart creation dependencies
      if (!LightweightChartsModule.LineStyle || !LightweightChartsModule.CrosshairMode) {
        throw new Error('TradingView Lightweight Charts constants not available')
      }

      // Create professional-grade chart with optimized settings
      const chart = createChart(container, {
        width,
        height,
        layout: {
          background: {
            type: 'solid',
            color: theme === 'dark' ? '#0f172a' : '#ffffff',
          },
          textColor: theme === 'dark' ? '#f1f5f9' : '#1e293b',
          fontSize: 12,
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
        },
        grid: {
          vertLines: { 
            color: theme === 'dark' ? '#1e293b' : '#f1f5f9',
            style: LightweightChartsModule.LineStyle.Dotted,
          },
          horzLines: { 
            color: theme === 'dark' ? '#1e293b' : '#f1f5f9',
            style: LightweightChartsModule.LineStyle.Dotted,
          },
        },
        crosshair: {
          mode: LightweightChartsModule.CrosshairMode.Normal,
          vertLine: {
            color: theme === 'dark' ? '#64748b' : '#475569',
            width: 1,
            style: LightweightChartsModule.LineStyle.Solid,
            labelBackgroundColor: theme === 'dark' ? '#334155' : '#e2e8f0',
          },
          horzLine: {
            color: theme === 'dark' ? '#64748b' : '#475569',
            width: 1,
            style: LightweightChartsModule.LineStyle.Solid,
            labelBackgroundColor: theme === 'dark' ? '#334155' : '#e2e8f0',
          },
        },
        rightPriceScale: {
          borderColor: theme === 'dark' ? '#334155' : '#cbd5e1',
          textColor: theme === 'dark' ? '#cbd5e1' : '#475569',
          autoScale: true,
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
          borderVisible: true,
          entireTextOnly: true,
        },
        timeScale: {
          borderColor: theme === 'dark' ? '#334155' : '#cbd5e1',
          textColor: theme === 'dark' ? '#cbd5e1' : '#475569',
          borderVisible: true,
          timeVisible: true,
          secondsVisible: false,
        },
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
          horzTouchDrag: true,
          vertTouchDrag: true,
        },
        handleScale: {
          axisPressedMouseMove: true,
          mouseWheel: true,
          pinch: true,
        },
      })

      // Debug chart object for troubleshooting
      console.log('Chart creation debug:', {
        chartExists: !!chart,
        chartType: typeof chart,
        chartConstructor: chart?.constructor?.name,
        hasAddCandlestickSeries: !!chart?.addCandlestickSeries,
        addCandlestickSeriesType: typeof chart?.addCandlestickSeries,
        chartMethods: chart ? Object.getOwnPropertyNames(chart).filter(prop => typeof chart[prop] === 'function').slice(0, 10) : [],
        chartPrototypeMethods: chart ? Object.getOwnPropertyNames(Object.getPrototypeOf(chart)).filter(prop => typeof chart[prop] === 'function').slice(0, 10) : []
      })

      // Validate chart was created successfully
      if (!chart) {
        throw new Error('Chart creation failed - createChart returned null/undefined')
      }

      if (typeof chart.addCandlestickSeries !== 'function') {
        throw new Error(`Chart creation failed - addCandlestickSeries method not found. Available methods: ${Object.getOwnPropertyNames(chart).filter(prop => typeof chart[prop] === 'function').join(', ')}`)
      }

      chartRef.current = chart

      // Create professional candlestick series
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#10b981',        // Professional green
        downColor: '#f59e0b',      // Professional amber (better than red)
        borderDownColor: '#d97706', // Darker amber border
        borderUpColor: '#059669',   // Darker green border
        wickDownColor: '#d97706',   // Darker amber wick
        wickUpColor: '#059669',     // Darker green wick
        priceFormat: {
          type: 'price',
          precision: 2,
          minMove: 0.01,
        },
        borderVisible: true,
        wickVisible: true,
        priceLineVisible: true,
        lastValueVisible: true,
        title: symbol,
      })

      seriesRef.current = candlestickSeries

      // Convert and set data with validation
      const chartData = marketData.data
        .filter(item => item && typeof item.timestamp === 'number' && 
                       typeof item.open === 'number' && 
                       typeof item.high === 'number' && 
                       typeof item.low === 'number' && 
                       typeof item.close === 'number')
        .map(item => ({
          time: Math.floor(item.timestamp / 1000),
          open: Number(item.open.toFixed(6)),
          high: Number(item.high.toFixed(6)),
          low: Number(item.low.toFixed(6)),
          close: Number(item.close.toFixed(6)),
        }))
        .sort((a, b) => a.time - b.time) // Ensure chronological order

      if (chartData.length === 0) {
        throw new Error('No valid chart data after processing')
      }

      candlestickSeries.setData(chartData)
      chart.timeScale().fitContent()

      // Add professional trade markers and price lines if provided
      if (trade && showTradeMarkers) {
        setTimeout(() => {
          try {
            const markers = []
            const entryTime = Math.floor(trade.entryDate.getTime() / 1000)
            
            // Determine precision based on price level (for professional display)
            const getPrecision = (price: number) => {
              if (price < 1) return 4
              if (price < 10) return 3
              if (price < 100) return 2
              if (price < 1000) return 1
              return 0
            }

            const entryPrecision = getPrecision(trade.entryPrice)
            
            // Professional entry marker
            markers.push({
              time: entryTime,
              position: trade.side === 'LONG' ? 'belowBar' as const : 'aboveBar' as const,
              color: trade.side === 'LONG' ? '#10b981' : '#3b82f6', // Green for long, blue for short
              shape: trade.side === 'LONG' ? 'arrowUp' as const : 'arrowDown' as const,
              text: `${trade.side} Entry\n$${trade.entryPrice.toFixed(entryPrecision)}`,
              size: 2,
            })

            // Add entry price line
            candlestickSeries.createPriceLine({
              price: trade.entryPrice,
              color: trade.side === 'LONG' ? '#10b981' : '#3b82f6',
              lineWidth: 2,
              lineStyle: LightweightChartsModule.LineStyle.Dashed,
              axisLabelVisible: true,
              title: `Entry: $${trade.entryPrice.toFixed(entryPrecision)}`,
              lineVisible: true,
            })

            // Exit marker and price line if available
            if (trade.exitDate && trade.exitPrice) {
              const exitTime = Math.floor(trade.exitDate.getTime() / 1000)
              const exitPrecision = getPrecision(trade.exitPrice)
              const isProfit = trade.side === 'LONG' 
                ? trade.exitPrice > trade.entryPrice 
                : trade.exitPrice < trade.entryPrice

              // Calculate P&L for display
              const pnl = trade.side === 'LONG'
                ? (trade.exitPrice - trade.entryPrice) * trade.quantity
                : (trade.entryPrice - trade.exitPrice) * trade.quantity
              
              const pnlText = pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`

              markers.push({
                time: exitTime,
                position: trade.side === 'LONG' ? 'aboveBar' as const : 'belowBar' as const,
                color: isProfit ? '#10b981' : '#f59e0b',
                shape: trade.side === 'LONG' ? 'arrowDown' as const : 'arrowUp' as const,
                text: `Exit\n$${trade.exitPrice.toFixed(exitPrecision)}\n${pnlText}`,
                size: 2,
              })

              // Add exit price line
              candlestickSeries.createPriceLine({
                price: trade.exitPrice,
                color: isProfit ? '#10b981' : '#f59e0b',
                lineWidth: 2,
                lineStyle: LightweightChartsModule.LineStyle.Dashed,
                axisLabelVisible: true,
                title: `Exit: $${trade.exitPrice.toFixed(exitPrecision)} (${pnlText})`,
                lineVisible: true,
              })

              // Add a subtle fill area between entry and exit if they're visible
              if (Math.abs(exitTime - entryTime) < 30 * 24 * 60 * 60) { // Within 30 days
                try {
                  const fillColor = isProfit 
                    ? 'rgba(16, 185, 129, 0.1)'  // Light green
                    : 'rgba(245, 158, 11, 0.1)'  // Light amber
                  
                  // This creates a visual connection between entry and exit
                  // Note: TradingView Lightweight Charts doesn't support area fills between specific points
                  // But we can create a more prominent visual effect with the price lines
                } catch (fillError) {
                  // Continue without fill effect
                }
              }
            }

            // Set all markers at once
            candlestickSeries.setMarkers(markers)
            
          } catch (markersError) {
            console.warn('Failed to add trade markers:', markersError)
            // Continue without markers if they fail
          }
        }, 100) // Slightly longer delay to ensure chart is fully rendered
      }

      // Call onLoad callback
      if (onLoad) {
        setTimeout(onLoad, 100)
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Chart initialization error:', error, {
        symbol,
        marketDataAvailable: !!marketData,
        dataLength: marketData?.data?.length || 0,
        libraryLoaded: !!LightweightChartsModule,
        createChartAvailable: !!createChart
      })
      setError(`Chart initialization failed: ${errorMessage}`)
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