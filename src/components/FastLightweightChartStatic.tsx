"use client"

import { useEffect, useRef, useState, memo } from "react"
import { useTheme } from "@/components/ThemeProvider"
import { getEnhancedMarketData, type MarketDataResult } from "@/services/enhancedMarketData"

// Try static import approach
let createChart: any = null
let LightweightChartsModule: any = null

// Load library on client side only
if (typeof window !== 'undefined') {
  import('lightweight-charts').then(module => {
    LightweightChartsModule = module
    createChart = module.createChart
    console.log('Static import successful:', {
      hasCreateChart: !!module.createChart,
      moduleKeys: Object.keys(module).slice(0, 10)
    })
  }).catch(error => {
    console.error('Static import failed:', error)
  })
}

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

interface FastLightweightChartStaticProps {
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

function FastLightweightChartStatic({
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
}: FastLightweightChartStaticProps) {
  const { theme } = useTheme()
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<any>(null)
  const seriesRef = useRef<any>(null)
  
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [marketData, setMarketData] = useState<MarketDataResult | null>(null)
  const [loadingProgress, setLoadingProgress] = useState(0)

  // Wait for library and data to load
  useEffect(() => {
    let isCancelled = false

    const loadEverything = async () => {
      try {
        setLoadingProgress(10)
        
        // Wait for library to be available
        let attempts = 0
        while (!LightweightChartsModule && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100))
          attempts++
        }
        
        if (!LightweightChartsModule) {
          throw new Error('TradingView library failed to load after 5 seconds')
        }
        
        setLoadingProgress(50)
        
        // Load market data
        const tradeContext = trade ? {
          entryPrice: trade.entryPrice,
          exitPrice: trade.exitPrice
        } : undefined
        
        const data = await getEnhancedMarketData(symbol, 7, preferReal, tradeContext)
        if (!isCancelled) {
          setMarketData(data)
          setLoadingProgress(80)
          
          if (data?.data?.length) {
            setIsReady(true)
            setLoadingProgress(100)
          } else {
            throw new Error('No market data available')
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

  // Chart creation effect
  useEffect(() => {
    if (!isReady || !marketData?.data?.length || !chartContainerRef.current || !LightweightChartsModule || !createChart) {
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

      console.log('Creating chart with static import...')
      
      // Test createChart function
      console.log('createChart function:', {
        type: typeof createChart,
        isFunction: typeof createChart === 'function',
        toString: createChart.toString().substring(0, 100)
      })

      // Create chart
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
        rightPriceScale: {
          autoScale: true,
          scaleMargins: { top: 0.1, bottom: 0.1 },
          borderVisible: true,
          entireTextOnly: true,
        },
      })

      console.log('Chart creation detailed debug:', {
        chartExists: !!chart,
        chartType: typeof chart,
        chartConstructor: chart?.constructor?.name,
        hasAddCandlestickSeries: !!chart?.addCandlestickSeries,
        addCandlestickSeriesType: typeof chart?.addCandlestickSeries,
        chartMethods: chart ? Object.getOwnPropertyNames(chart).filter(prop => typeof chart[prop] === 'function') : [],
        chartPrototypeMethods: chart ? Object.getOwnPropertyNames(Object.getPrototypeOf(chart)).filter(prop => typeof chart[prop] === 'function') : [],
        allChartProps: chart ? Object.getOwnPropertyNames(chart) : [],
        chartToString: chart ? chart.toString() : 'N/A',
        isChartObject: chart && typeof chart === 'object',
        createChartResult: createChart.toString().substring(0, 150)
      })

      // Try to access addCandlestickSeries in different ways
      if (chart) {
        console.log('Trying different ways to access addCandlestickSeries:', {
          directAccess: !!chart.addCandlestickSeries,
          bracketAccess: !!chart['addCandlestickSeries'],
          hasOwnProperty: chart.hasOwnProperty('addCandlestickSeries'),
          inOperator: 'addCandlestickSeries' in chart,
          prototypeCheck: 'addCandlestickSeries' in Object.getPrototypeOf(chart)
        })
      }

      if (!chart) {
        throw new Error('Chart creation failed - createChart returned null/undefined')
      }

      if (typeof chart.addCandlestickSeries !== 'function') {
        // Try alternative method names or approach
        const alternativeMethods = ['addCandlestickSeries', 'addSeries', 'createSeries']
        let foundMethod = null
        
        for (const methodName of alternativeMethods) {
          if (chart[methodName] && typeof chart[methodName] === 'function') {
            foundMethod = methodName
            break
          }
        }
        
        if (foundMethod) {
          console.log(`Found alternative method: ${foundMethod}`)
        } else {
          throw new Error(`Chart creation failed - no valid series creation method found. Available methods: ${Object.getOwnPropertyNames(chart).filter(prop => typeof chart[prop] === 'function').join(', ')}`)
        }
      }

      chartRef.current = chart
      
      // Create candlestick series
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#f59e0b',
        borderDownColor: '#d97706',
        borderUpColor: '#059669',
        wickDownColor: '#d97706',
        wickUpColor: '#059669',
      })

      seriesRef.current = candlestickSeries

      // Set data
      const chartData = marketData.data.map(item => ({
        time: Math.floor(item.timestamp / 1000),
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      }))

      candlestickSeries.setData(chartData)
      chart.timeScale().fitContent()

      if (onLoad) {
        setTimeout(onLoad, 100)
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Chart creation error:', error)
      setError(`Chart creation failed: ${errorMessage}`)
    }

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
  }, [isReady, marketData, theme, width, height, onLoad])

  // Loading state
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
            <div className="w-48 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-4 mx-auto">
              <div 
                className="h-2 bg-blue-500 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {loadingProgress < 50 ? 'Loading library...' :
               loadingProgress < 80 ? 'Loading data...' :
               'Creating chart...'}
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

  // Success state
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
      </div>
    </div>
  )
}

export default memo(FastLightweightChartStatic)