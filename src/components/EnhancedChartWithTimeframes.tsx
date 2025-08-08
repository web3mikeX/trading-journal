"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "@/components/ThemeProvider"
import { getEnhancedMarketData, type MarketDataResult } from "@/services/enhancedMarketData"

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

interface EnhancedChartProps {
  symbol?: string
  trade?: Trade
  width?: number
  height?: number
  showTradeMarkers?: boolean
  preferReal?: boolean
}

// Available timeframes
const TIMEFRAMES = [
  { value: '1m', label: '1 Minute', days: 1 },
  { value: '5m', label: '5 Minutes', days: 2 },
  { value: '15m', label: '15 Minutes', days: 3 },
  { value: '1h', label: '1 Hour', days: 7 },
  { value: '4h', label: '4 Hours', days: 14 },
  { value: '1d', label: '1 Day', days: 30 },
  { value: '1w', label: '1 Week', days: 90 },
  { value: '1M', label: '1 Month', days: 365 }
]

export default function EnhancedChartWithTimeframes({ 
  symbol = "NQ",
  trade,
  width = 800, 
  height = 400,
  showTradeMarkers = true,
  preferReal = true
}: EnhancedChartProps) {
  const { theme } = useTheme()
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<any>(null)
  const seriesRef = useRef<any>(null)
  
  const [status, setStatus] = useState('Loading...')
  const [marketData, setMarketData] = useState<MarketDataResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedTimeframe, setSelectedTimeframe] = useState('1d')
  const [isLoading, setIsLoading] = useState(false)

  // Helper function to safely get date object
  const safeDate = (date: any): Date => {
    if (!date) return new Date()
    return date instanceof Date ? date : new Date(date)
  }

  // Get days based on timeframe
  const getDaysForTimeframe = (timeframe: string): number => {
    const tf = TIMEFRAMES.find(t => t.value === timeframe)
    return tf ? tf.days : 7
  }

  useEffect(() => {
    let mounted = true
    setIsLoading(true)

    const loadMarketData = async () => {
      if (!mounted) return
      
      try {
        setStatus('Loading market data...')
        setError(null)
        
        const days = getDaysForTimeframe(selectedTimeframe)
        
        // Get trade context for realistic synthetic data
        const tradeContext = trade ? {
          entryPrice: trade.entryPrice,
          exitPrice: trade.exitPrice,
          entryDate: safeDate(trade.entryDate),
          exitDate: trade.exitDate ? safeDate(trade.exitDate) : undefined
        } : undefined
        
        const data = await getEnhancedMarketData(symbol || 'NQ', days, preferReal, tradeContext)
        
        if (!mounted) return
        
        setMarketData(data)
        setStatus('Market data loaded')
        setIsLoading(false)
        
      } catch (err) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : 'Failed to load market data')
        setStatus('Using fallback data')
        setIsLoading(false)
        
        // Create fallback data if real data fails
        const days = getDaysForTimeframe(selectedTimeframe)
        const fallbackData = {
          symbol: symbol || 'NQ',
          data: generateSyntheticDataForTimeframe(symbol || 'NQ', days, selectedTimeframe, trade),
          dataSource: 'synthetic' as const,
          lastUpdated: Date.now()
        }
        setMarketData(fallbackData)
      }
    }

    loadMarketData()

    return () => {
      mounted = false
    }
  }, [symbol, preferReal, trade, selectedTimeframe])

  // Generate synthetic data based on timeframe
  function generateSyntheticDataForTimeframe(
    symbol: string, 
    days: number, 
    timeframe: string,
    tradeContext?: Trade
  ): any[] {
    const basePrices: Record<string, number> = {
      'NQ': 21500, 'MNQ': 21500, 'MNQU5': 22500, 'ES': 6100, 'MES': 6100, 
      'RTY': 2350, 'M2K': 2350, 'YM': 44500, 'MYM': 44500,
      'GC': 2650, 'CL': 78, 'SI': 31, 'NG': 2.8,
      'BTC': 98000, 'ETH': 3800, 'SOL': 245,
      'QQQ': 525, 'SPY': 610, 'IWM': 235, 'DIA': 445,
      'GLD': 265, 'USO': 78, 'SLV': 31, 'UNG': 28,
      'VIX': 14, 'VXX': 18, 'TLT': 93, 'IEF': 95,
      'FXE': 103, 'FXB': 124, 'FXY': 66, 'FXA': 64,
      'JJC': 45, 'CORN': 25, 'SOYB': 45, 'WEAT': 22
    }

    let basePrice = basePrices[symbol] || basePrices[symbol.replace(/[HMU Z]\d{2}$/, '')] || 1000
    
    if (tradeContext && (tradeContext.entryPrice || tradeContext.exitPrice)) {
      const tradePrice = tradeContext.entryPrice || tradeContext.exitPrice || basePrice
      basePrice = tradePrice * (0.99 + Math.random() * 0.02)
    }

    const data = []
    const now = Date.now()
    
    // Generate more granular data based on timeframe
    const pointsPerDay = timeframe === '1m' ? 390 : // 6.5 hours * 60 minutes
                        timeframe === '5m' ? 78 :  // 6.5 hours * 12 5-minute periods
                        timeframe === '15m' ? 26 : // 6.5 hours * 4 15-minute periods
                        timeframe === '1h' ? 6.5 : // 6.5 hours
                        timeframe === '4h' ? 1.5 : // 1.5 4-hour periods
                        1 // Daily

    const totalPoints = days * (timeframe === '1d' ? 1 : Math.floor(pointsPerDay))
    
    for (let i = 0; i < totalPoints; i++) {
      const timeOffset = (totalPoints - 1 - i) * (timeframe === '1d' ? 24 * 60 * 60 * 1000 : 
                          timeframe === '1h' ? 60 * 60 * 1000 :
                          timeframe === '4h' ? 4 * 60 * 60 * 1000 :
                          timeframe === '15m' ? 15 * 60 * 1000 :
                          timeframe === '5m' ? 5 * 60 * 1000 :
                          60 * 1000)
      
      const timestamp = now - timeOffset
      
      const volatility = 0.02
      const dailyMove = (Math.random() - 0.5) * volatility
      const openPrice = basePrice * (1 + dailyMove * 0.3)
      
      const range = volatility * 0.6 * basePrice
      const high = openPrice + Math.random() * range * 0.7
      const low = openPrice - Math.random() * range * 0.7
      const close = basePrice * (1 + dailyMove)
      
      data.push({
        timestamp,
        open: Number(openPrice.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume: Math.floor(Math.random() * 1000000) + 500000
      })
      
      basePrice = close
    }
    
    return data
  }

  useEffect(() => {
    if (!marketData?.data?.length) return

    let mounted = true

    const initChart = async () => {
      try {
        console.log('🎨 EnhancedChart: Starting chart creation with', marketData?.data?.length, 'data points')
        setStatus('Creating professional chart...')
        
        // Wait for DOM element to be available
        if (!chartRef.current) {
          console.log('⚠️ EnhancedChart: Chart container not ready, retrying...')
          setTimeout(() => {
            if (mounted) initChart()
          }, 100)
          return
        }
        
        console.log('📐 EnhancedChart: Container found, dimensions:', chartRef.current.offsetWidth, 'x', chartRef.current.offsetHeight)
        
        // Import the library
        console.log('📦 EnhancedChart: Importing TradingView library...')
        const LightweightCharts = await import('lightweight-charts')
        const { createChart } = LightweightCharts
        console.log('✅ EnhancedChart: Library imported successfully')
        
        if (!mounted || !chartRef.current) {
          console.log('❌ EnhancedChart: Component unmounted or container missing after import')
          return
        }
        
        // Clear any existing chart
        if (chartInstanceRef.current) {
          try {
            chartInstanceRef.current.remove()
          } catch (e) {
            console.warn('Error removing previous chart:', e)
          }
        }
        
        // Create chart with enhanced configuration
        console.log('🎨 EnhancedChart: About to call createChart...')
        
        let chart
        try {
          chart = createChart(chartRef.current, {
            width,
            height,
            layout: {
              background: { color: theme === 'dark' ? '#1f2937' : '#ffffff' },
              textColor: theme === 'dark' ? '#f1f5f9' : '#1e293b',
            },
            grid: {
              vertLines: { 
                color: theme === 'dark' ? '#374151' : '#f1f5f9',
              },
              horzLines: { 
                color: theme === 'dark' ? '#374151' : '#f1f5f9',
              },
            },
            rightPriceScale: {
              borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
            },
            timeScale: {
              borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
              timeVisible: selectedTimeframe !== '1d' && selectedTimeframe !== '1w' && selectedTimeframe !== '1M',
              secondsVisible: false,
            },
            crosshair: {
              mode: 1,
              vertLine: {
                color: theme === 'dark' ? '#6b7280' : '#9ca3af',
                width: 1,
                style: 1,
              },
              horzLine: {
                color: theme === 'dark' ? '#6b7280' : '#9ca3af',
                width: 1,
                style: 1,
              },
            },
          })
          console.log('✅ EnhancedChart: Chart created successfully')
          
        } catch (createChartError) {
          console.error('❌ EnhancedChart: createChart failed:', createChartError)
          setError(`Chart creation failed: ${createChartError instanceof Error ? createChartError.message : 'Unknown error'}`)
          return
        }

        if (!mounted) return

        chartInstanceRef.current = chart

        // Add candlestick series with enhanced styling
        console.log('📊 EnhancedChart: Adding candlestick series...')
        const candlestickSeries = chart.addCandlestickSeries({
          upColor: '#10b981',
          downColor: '#ef4444',
          borderDownColor: '#dc2626',
          borderUpColor: '#059669',
          wickDownColor: '#dc2626',
          wickUpColor: '#059669',
        })
        console.log('✅ EnhancedChart: Candlestick series added')

        seriesRef.current = candlestickSeries

        // Convert and set market data
        console.log('📈 EnhancedChart: Converting market data...')
        const chartData = marketData.data.map(item => ({
          time: Math.floor(item.timestamp / 1000) as any,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
        })).sort((a, b) => a.time - b.time)
        
        console.log('📈 EnhancedChart: Setting chart data...', chartData.length, 'points')
        candlestickSeries.setData(chartData)
        console.log('✅ EnhancedChart: Chart data set successfully')
        
        // If we have trade data, focus on the trade timeframe
        if (trade && trade.entryDate) {
          const entryDate = safeDate(trade.entryDate)
          const exitDate = trade.exitDate ? safeDate(trade.exitDate) : entryDate
          const entryTime = Math.floor(entryDate.getTime() / 1000)
          const exitTime = Math.floor(exitDate.getTime() / 1000)
          
          // Set visible range to focus on the trade period with appropriate buffer
          const bufferMultiplier = selectedTimeframe === '1m' ? 60 : 
                                  selectedTimeframe === '5m' ? 120 :
                                  selectedTimeframe === '15m' ? 240 :
                                  selectedTimeframe === '1h' ? 480 :
                                  selectedTimeframe === '4h' ? 960 :
                                  2 * 24 * 60 * 60 // 2 days for daily+
          
          const startTime = entryTime - bufferMultiplier
          const endTime = exitTime + bufferMultiplier
          
          try {
            chart.timeScale().setVisibleLogicalRange({
              from: startTime,
              to: endTime
            })
          } catch (e) {
            // Fallback to fit content if range setting fails
            chart.timeScale().fitContent()
          }
        } else {
          chart.timeScale().fitContent()
        }

        // Add trade markers if trade data is provided
        if (trade && showTradeMarkers) {
          setTimeout(() => {
            try {
              const markers: any[] = []
              const entryDate = safeDate(trade.entryDate)
              const entryTime = Math.floor(entryDate.getTime() / 1000)
              
              // Determine precision based on price level
              const getPrecision = (price: number) => {
                if (price < 1) return 4
                if (price < 10) return 3
                if (price < 100) return 2
                if (price < 1000) return 1
                return 0
              }

              const entryPrecision = getPrecision(trade.entryPrice)
              
              // Get formatted entry time
              const entryTimeFormatted = entryDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              })
              
              // Professional entry marker
              markers.push({
                time: entryTime as any,
                position: trade.side === 'LONG' ? 'belowBar' : 'aboveBar',
                color: trade.side === 'LONG' ? '#10b981' : '#3b82f6',
                shape: trade.side === 'LONG' ? 'arrowUp' : 'arrowDown',
                text: `${trade.side} Entry\n$${trade.entryPrice.toFixed(entryPrecision)}\n${entryTimeFormatted}`,
                size: 2,
              })

              // Add entry price line
              candlestickSeries.createPriceLine({
                price: trade.entryPrice,
                color: trade.side === 'LONG' ? '#10b981' : '#3b82f6',
                lineWidth: 2,
                lineStyle: 1, // Dashed
                axisLabelVisible: true,
                title: `Entry: $${trade.entryPrice.toFixed(entryPrecision)}`,
              })

              // Exit marker and price line if available
              if (trade.exitDate && trade.exitPrice) {
                const exitDate = safeDate(trade.exitDate)
                const exitTime = Math.floor(exitDate.getTime() / 1000)
                const exitPrecision = getPrecision(trade.exitPrice)
                const isProfit = trade.side === 'LONG' 
                  ? trade.exitPrice > trade.entryPrice 
                  : trade.exitPrice < trade.entryPrice

                // Calculate P&L for display
                const pnl = trade.side === 'LONG'
                  ? (trade.exitPrice - trade.entryPrice) * trade.quantity
                  : (trade.entryPrice - trade.exitPrice) * trade.quantity
                
                const pnlText = pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`
                
                // Get formatted exit time
                const exitTimeFormatted = exitDate.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                })

                markers.push({
                  time: exitTime as any,
                  position: trade.side === 'LONG' ? 'aboveBar' : 'belowBar',
                  color: isProfit ? '#10b981' : '#f59e0b',
                  shape: trade.side === 'LONG' ? 'arrowDown' : 'arrowUp',
                  text: `Exit\n$${trade.exitPrice.toFixed(exitPrecision)}\n${pnlText}\n${exitTimeFormatted}`,
                  size: 2,
                })

                // Add exit price line
                candlestickSeries.createPriceLine({
                  price: trade.exitPrice,
                  color: isProfit ? '#10b981' : '#f59e0b',
                  lineWidth: 2,
                  lineStyle: 1, // Dashed
                  axisLabelVisible: true,
                  title: `Exit: $${trade.exitPrice.toFixed(exitPrecision)} (${pnlText})`,
                })
              }

              // Set all markers at once
              candlestickSeries.setMarkers(markers)
              
            } catch (markersError) {
              console.warn('Failed to add trade markers:', markersError)
            }
          }, 100)
        }

        setStatus('✅ Professional chart loaded!')
        
      } catch (chartCreationError) {
        console.error('Chart creation error:', chartCreationError)
        setStatus(`❌ Chart creation failed: ${chartCreationError instanceof Error ? chartCreationError.message : 'Unknown error'}`)
        setError(chartCreationError instanceof Error ? chartCreationError.message : 'Chart creation failed')
      }
    }

    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      if (mounted) {
        initChart()
      }
    }, 50)

    return () => {
      mounted = false
      if (chartInstanceRef.current) {
        try {
          chartInstanceRef.current.remove()
        } catch (e) {
          console.warn('Error removing chart:', e)
        }
        chartInstanceRef.current = null
        seriesRef.current = null
      }
    }
  }, [marketData, width, height, theme, selectedTimeframe])

  const handleTimeframeChange = (timeframe: string) => {
    setSelectedTimeframe(timeframe)
  }

  // Loading state
  if (isLoading || status.includes('Loading') || status.includes('Creating')) {
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
                  onClick={() => handleTimeframeChange(tf.value)}
                  disabled={isLoading}
                  className={`px-2 py-1 text-xs rounded ${
                    selectedTimeframe === tf.value
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
                  onClick={() => handleTimeframeChange(tf.value)}
                  className={`px-2 py-1 text-xs rounded ${
                    selectedTimeframe === tf.value
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

  // Success state - chart rendered
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
                onClick={() => handleTimeframeChange(tf.value)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  selectedTimeframe === tf.value
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
        ref={chartRef}
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
           marketData?.dataSource === 'synthetic' ? 'Demo Data' :
           'Real-time'}
        </span>
        <span className="mx-2">•</span>
        <span>{TIMEFRAMES.find(tf => tf.value === selectedTimeframe)?.label}</span>
        {marketData?.data && (
          <>
            <span className="mx-2">•</span>
            <span>{marketData.data.length} points</span>
          </>
        )}
        {trade && (
          <>
            <span className="mx-2">•</span>
            <span className="font-medium text-blue-600 dark:text-blue-400">
              {trade.side} Trade
            </span>
            {trade.exitDate && (
              <>
                <span className="mx-2">•</span>
                <span className="text-xs">
                  {(() => {
                    try {
                      const entryDate = safeDate(trade.entryDate);
                      const exitDate = safeDate(trade.exitDate);
                      const durationMs = exitDate.getTime() - entryDate.getTime();
                      const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
                      const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
                      return durationHours > 0 
                        ? `${durationHours}h ${durationMinutes}m`
                        : `${durationMinutes}m duration`;
                    } catch (e) {
                      return '';
                    }
                  })()}
                </span>
              </>
            )}
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
