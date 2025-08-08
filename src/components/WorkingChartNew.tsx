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

interface WorkingChartProps {
  symbol?: string
  trade?: Trade
  width?: number
  height?: number
  showTradeMarkers?: boolean
  preferReal?: boolean
}

// Available timeframes
const TIMEFRAMES = [
  { value: '1m', label: '1m', days: 1 },
  { value: '5m', label: '5m', days: 2 },
  { value: '15m', label: '15m', days: 3 },
  { value: '1h', label: '1h', days: 7 },
  { value: '4h', label: '4h', days: 14 },
  { value: '1d', label: '1D', days: 30 },
  { value: '1w', label: '1W', days: 90 },
  { value: '1M', label: '1M', days: 365 }
]

export default function WorkingChartNew({ 
  symbol = "NQ",
  trade,
  width = 800, 
  height = 400,
  showTradeMarkers = true,
  preferReal = true
}: WorkingChartProps) {
  const { theme } = useTheme()
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<any>(null)
  const seriesRef = useRef<any>(null)
  
  const [status, setStatus] = useState('Loading...')
  const [marketData, setMarketData] = useState<MarketDataResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedTimeframe, setSelectedTimeframe] = useState('1d')

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

  // Enhanced synthetic data generation using the new service
  const generateSyntheticDataForTimeframe = (
    symbol: string, 
    days: number, 
    timeframe: string,
    tradeContext?: Trade
  ): any[] => {
    // This is now a simplified wrapper - the heavy lifting is done in the service
    try {
      // Import the generateSyntheticData function from the service
      // Note: This is a fallback for when the service call fails
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
        basePrice = tradePrice * (0.985 + Math.random() * 0.03)
      }

      const data = []
      const now = Date.now()
      
      // Enhanced volatility patterns
      const volatilityMap: Record<string, number> = {
        '1m': 0.008, '5m': 0.012, '15m': 0.018, '1h': 0.025, 
        '4h': 0.035, '1d': 0.045, '1w': 0.055, '1M': 0.065
      }
      
      const baseVolatility = volatilityMap[timeframe] || 0.025
      
      // Symbol-specific volatility multipliers
      const symbolVolMultiplier = symbol.includes('VIX') ? 4.0 :
                                 symbol.includes('BTC') || symbol.includes('ETH') ? 2.5 :
                                 symbol.includes('CL') || symbol.includes('NG') ? 2.0 :
                                 symbol.includes('NQ') || symbol.includes('RTY') ? 1.8 :
                                 symbol.includes('ES') || symbol.includes('SPY') ? 1.2 :
                                 1.0
      
      const volatility = baseVolatility * symbolVolMultiplier
      
      // Generate appropriate number of points
      const pointsPerDay = {
        '1m': 390, '5m': 78, '15m': 26, '1h': 6.5, 
        '4h': 1.6, '1d': 1, '1w': 0.2, '1M': 0.033
      }[timeframe] || 1
      
      const totalPoints = Math.min(Math.ceil(days * pointsPerDay), 1000) // Cap at 1000 points
      
      let currentPrice = basePrice
      let trendDirection = (Math.random() - 0.5) * 0.1
      
      for (let i = 0; i < totalPoints; i++) {
        const timeIntervalMs = {
          '1m': 60 * 1000, '5m': 5 * 60 * 1000, '15m': 15 * 60 * 1000,
          '1h': 60 * 60 * 1000, '4h': 4 * 60 * 60 * 1000, '1d': 24 * 60 * 60 * 1000,
          '1w': 7 * 24 * 60 * 60 * 1000, '1M': 30 * 24 * 60 * 60 * 1000
        }[timeframe] || 24 * 60 * 60 * 1000
        
        const timestamp = now - (totalPoints - 1 - i) * timeIntervalMs
        
        const periodMove = (Math.random() - 0.5) * volatility + trendDirection * 0.1
        const openPrice = currentPrice * (1 + periodMove * 0.4)
        
        const range = volatility * (0.5 + Math.random()) * currentPrice
        const high = Math.max(openPrice, currentPrice) + Math.random() * range * 0.7
        const low = Math.min(openPrice, currentPrice) - Math.random() * range * 0.7
        const close = currentPrice * (1 + periodMove)
        
        // Ensure proper OHLC relationships
        const finalHigh = Math.max(openPrice, high, close)
        const finalLow = Math.min(openPrice, low, close)
        
        data.push({
          timestamp,
          open: Number(openPrice.toFixed(4)),
          high: Number(finalHigh.toFixed(4)),
          low: Number(finalLow.toFixed(4)),
          close: Number(close.toFixed(4)),
          volume: Math.floor((Math.random() * 500000 + 100000) * (1 + periodMove * 2))
        })
        
        currentPrice = close
        trendDirection = trendDirection * 0.95 + (Math.random() - 0.5) * 0.05
      }
      
      return data
    } catch (error) {
      console.error('Fallback data generation failed:', error)
      return []
    }
  }

  useEffect(() => {
    let mounted = true

    const loadMarketData = async () => {
      if (!mounted) return
      
      try {
        setStatus('Loading enhanced market data...')
        setError(null)
        
        const days = getDaysForTimeframe(selectedTimeframe)
        
        // Get trade context for realistic synthetic data
        const tradeContext = trade ? {
          entryPrice: trade.entryPrice,
          exitPrice: trade.exitPrice,
          entryDate: safeDate(trade.entryDate),
          exitDate: trade.exitDate ? safeDate(trade.exitDate) : undefined
        } : undefined
        
        // Use the enhanced market data service with timeframe support
        const data = await getEnhancedMarketData(
          symbol || 'NQ', 
          days, 
          preferReal, 
          tradeContext,
          selectedTimeframe
        )
        
        if (!mounted) return
        
        setMarketData(data)
        setStatus(`✅ ${data.dataSource} data loaded (${data.data.length} points)`)
        
      } catch (err) {
        if (!mounted) return
        console.error('Market data loading failed:', err)
        setError(err instanceof Error ? err.message : 'Failed to load market data')
        setStatus('❌ Using enhanced fallback data')
        
        // Create enhanced fallback with improved synthetic data
        const days = getDaysForTimeframe(selectedTimeframe)
        const fallbackData = {
          symbol: symbol || 'NQ',
          data: generateSyntheticDataForTimeframe(symbol || 'NQ', days, selectedTimeframe, trade),
          dataSource: 'enhanced_synthetic' as const,
          lastUpdated: Date.now(),
          metadata: {
            originalSymbol: symbol || 'NQ',
            provider: 'enhanced_synthetic',
            explanation: `Enhanced fallback data for ${symbol} (${selectedTimeframe})`
          }
        }
        setMarketData(fallbackData)
      }
    }

    loadMarketData()

    return () => {
      mounted = false
    }
  }, [symbol, preferReal, trade, selectedTimeframe])

  useEffect(() => {
    if (!marketData?.data?.length) return

    let mounted = true

    const initChart = async () => {
      try {
        console.log('🎨 WorkingChartNew: Starting chart creation with', marketData?.data?.length, 'data points')
        setStatus('Creating professional chart...')
        
        // Wait for DOM element to be available
        if (!chartRef.current) {
          console.log('⚠️ WorkingChartNew: Chart container not ready, retrying...')
          setTimeout(() => {
            if (mounted) initChart()
          }, 100)
          return
        }
        
        console.log('📐 WorkingChartNew: Container found, dimensions:', chartRef.current.offsetWidth, 'x', chartRef.current.offsetHeight)
        
        // Import the library
        console.log('📦 WorkingChartNew: Importing TradingView library...')
        const LightweightCharts = await import('lightweight-charts')
        const { createChart } = LightweightCharts
        console.log('✅ WorkingChartNew: Library imported successfully')
        
        if (!mounted || !chartRef.current) {
          console.log('❌ WorkingChartNew: Component unmounted or container missing after import')
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
        
        // Double-check the container is still available
        if (!chartRef.current) {
          console.warn('Chart container disappeared during initialization')
          return
        }
        
        // Create chart with enhanced configuration for timeframe support
        console.log('🎨 WorkingChartNew: About to call createChart...')
        
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
              autoScale: false, // Disable auto-scale for manual control
              scaleMargins: {
                top: 0.05,    // 5% margin at top (tighter like TradingView)
                bottom: 0.05, // 5% margin at bottom
              },
              mode: 0, // Normal price scale mode
            },
            timeScale: {
              borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
              rightOffset: 5,
              barSpacing: selectedTimeframe === '1m' ? 3 : 6, // Tighter spacing for 1m like TradingView
              minBarSpacing: 1,
              fixLeftEdge: false,
              fixRightEdge: false,
              timeVisible: true, // Always show time
              secondsVisible: selectedTimeframe === '1m', // Seconds only for 1m
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
          console.log('✅ WorkingChartNew: Chart created successfully')
          
        } catch (createChartError) {
          console.error('❌ WorkingChartNew: createChart failed:', createChartError)
          setError(`Chart creation failed: ${createChartError instanceof Error ? createChartError.message : 'Unknown error'}`)
          return
        }

        if (!mounted) return

        chartInstanceRef.current = chart

        // TRADINGVIEW-STYLE: Professional candlestick styling
        console.log('📊 WorkingChartNew: Adding TradingView-style candlestick series...')
        const candlestickSeries = chart.addCandlestickSeries({
          upColor: '#26a69a',        // TradingView green
          downColor: '#ef5350',      // TradingView red
          borderDownColor: '#ef5350',
          borderUpColor: '#26a69a', 
          wickDownColor: '#ef5350',
          wickUpColor: '#26a69a',
          priceFormat: {
            type: 'price',
            precision: 2,  // Always 2 decimal places for futures
            minMove: 0.25, // Standard futures tick size
          },
          priceLineVisible: false, // Hide automatic price line
        })
        console.log('✅ WorkingChartNew: Candlestick series added')

        seriesRef.current = candlestickSeries

        // Convert and set market data
        console.log('📈 WorkingChartNew: Converting market data...')
        const chartData = marketData.data.map(item => ({
          time: Math.floor(item.timestamp / 1000) as any,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
        })).sort((a, b) => a.time - b.time)
        
        console.log('📈 WorkingChartNew: Setting chart data...', chartData.length, 'points')
        candlestickSeries.setData(chartData)
        console.log('✅ WorkingChartNew: Chart data set successfully')
        
        // TRADINGVIEW-STYLE: Tight price scaling like professional charts
        if (trade && trade.entryDate) {
          const entryPrice = trade.entryPrice
          const exitPrice = trade.exitPrice || trade.entryPrice
          
          // TradingView-style tight scaling - typically 200-400 point range for futures
          const priceCenter = (entryPrice + exitPrice) / 2
          const tradePriceRange = Math.abs(exitPrice - entryPrice)
          
          // Calculate appropriate range based on asset type and trade movement
          let displayRange: number
          
          if (tradePriceRange > 0) {
            // If there's trade movement, base range on the movement with reasonable buffer
            displayRange = Math.max(tradePriceRange * 3, priceCenter * 0.008) // Min 0.8% range
          } else {
            // For single-price trades, use standard ranges by asset
            const assetRanges = {
              NQ: 300,    // NASDAQ futures: ~300 point range
              MNQ: 300,   // Micro NASDAQ: ~300 point range  
              MNQU5: 300, // NASDAQ contract: ~300 point range
              ES: 150,    // S&P futures: ~150 point range
              RTY: 100,   // Russell: ~100 point range
              YM: 800,    // Dow: ~800 point range
              GC: 50,     // Gold: ~$50 range
              CL: 10,     // Oil: ~$10 range
              BTC: 2000,  // Bitcoin: ~$2000 range
              ETH: 200    // Ethereum: ~$200 range
            }
            
            const baseSymbol = trade.symbol.replace(/[HMU Z]\d{2,4}$/, '')
            displayRange = assetRanges[baseSymbol as keyof typeof assetRanges] || (priceCenter * 0.015)
          }
          
          const minVisiblePrice = priceCenter - (displayRange / 2)
          const maxVisiblePrice = priceCenter + (displayRange / 2)
          
          console.log(`📊 TradingView-style scaling: ${trade.symbol} center=${priceCenter.toFixed(2)}, range=${displayRange.toFixed(2)}, display=${minVisiblePrice.toFixed(2)}-${maxVisiblePrice.toFixed(2)}`)
          
          // Set tight price scale like TradingView
          setTimeout(() => {
            try {
              chart.priceScale('right').setVisiblePriceRange({
                from: minVisiblePrice,
                to: maxVisiblePrice
              })
              console.log(`✅ Price range set: ${minVisiblePrice.toFixed(2)} - ${maxVisiblePrice.toFixed(2)}`)
            } catch (e) {
              console.warn('Failed to set price range:', e)
              chart.timeScale().fitContent()
            }
          }, 300) // Increased delay for chart stability
        } else {
          chart.timeScale().fitContent()
        }

        // CRITICAL: Add trade markers with proper positioning and visibility
        if (trade && showTradeMarkers) {
          console.log(`🎯 Adding trade markers for ${trade.symbol}: Entry=${trade.entryPrice}, Exit=${trade.exitPrice || 'N/A'}`)
          
          setTimeout(() => {
            try {
              const markers: any[] = []
              const entryDate = safeDate(trade.entryDate)
              const entryTime = Math.floor(entryDate.getTime() / 1000)
              
              // Enhanced precision for different price levels
              const getPrecision = (price: number) => {
                if (price >= 10000) return 2  // For futures like NQ: 23456.75
                if (price >= 1000) return 2   // For mid-range: 1234.56  
                if (price >= 100) return 2    // For stocks: 123.45
                if (price >= 10) return 3     // For low price: 12.345
                return 4                       // For very low: 1.2345
              }

              const entryPrecision = getPrecision(trade.entryPrice)
              
              // Get formatted entry time
              const entryTimeFormatted = entryDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
              })
              
              // ENHANCED entry marker with better visibility
              const entryMarker = {
                time: entryTime as any,
                position: trade.side === 'LONG' ? 'belowBar' : 'aboveBar',
                color: trade.side === 'LONG' ? '#22c55e' : '#ef4444',
                shape: trade.side === 'LONG' ? 'arrowUp' : 'arrowDown',
                text: `💹 ${trade.side} ENTRY\n$${trade.entryPrice.toFixed(entryPrecision)}\n${entryTimeFormatted}`,
                size: 1.5,
              }
              
              markers.push(entryMarker)
              console.log(`✅ Added entry marker:`, entryMarker)

              // PROMINENT entry price line
              const entryPriceLine = candlestickSeries.createPriceLine({
                price: trade.entryPrice,
                color: trade.side === 'LONG' ? '#22c55e' : '#ef4444',
                lineWidth: 3,
                lineStyle: 2, // Solid line
                axisLabelVisible: true,
                title: `💹 Entry: $${trade.entryPrice.toFixed(entryPrecision)}`,
              })
              
              console.log(`✅ Added entry price line at $${trade.entryPrice}`)

              // Exit marker and price line if available
              if (trade.exitDate && trade.exitPrice) {
                const exitDate = safeDate(trade.exitDate)
                const exitTime = Math.floor(exitDate.getTime() / 1000)
                const exitPrecision = getPrecision(trade.exitPrice)
                const isProfit = trade.side === 'LONG' 
                  ? trade.exitPrice > trade.entryPrice 
                  : trade.exitPrice < trade.entryPrice

                // Calculate P&L for display
                const multiplier = trade.contractMultiplier || 1
                const pnlPerContract = trade.side === 'LONG'
                  ? (trade.exitPrice - trade.entryPrice) * multiplier
                  : (trade.entryPrice - trade.exitPrice) * multiplier
                const totalPnl = pnlPerContract * trade.quantity
                
                const pnlText = totalPnl >= 0 ? `+$${totalPnl.toFixed(2)}` : `-$${Math.abs(totalPnl).toFixed(2)}`
                
                // Get formatted exit time
                const exitTimeFormatted = exitDate.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit', 
                  second: '2-digit',
                  hour12: false
                })

                const exitMarker = {
                  time: exitTime as any,
                  position: trade.side === 'LONG' ? 'aboveBar' : 'belowBar',
                  color: isProfit ? '#22c55e' : '#ef4444',
                  shape: trade.side === 'LONG' ? 'arrowDown' : 'arrowUp',
                  text: `💰 EXIT\n$${trade.exitPrice.toFixed(exitPrecision)}\n${pnlText}\n${exitTimeFormatted}`,
                  size: 1.5,
                }
                
                markers.push(exitMarker)
                console.log(`✅ Added exit marker:`, exitMarker)

                // PROMINENT exit price line
                const exitPriceLine = candlestickSeries.createPriceLine({
                  price: trade.exitPrice,
                  color: isProfit ? '#22c55e' : '#ef4444',
                  lineWidth: 3,
                  lineStyle: 2, // Solid line
                  axisLabelVisible: true,
                  title: `💰 Exit: $${trade.exitPrice.toFixed(exitPrecision)} (${pnlText})`,
                })
                
                console.log(`✅ Added exit price line at $${trade.exitPrice} with P&L ${pnlText}`)
              }

              // Set all markers at once with verification
              candlestickSeries.setMarkers(markers)
              console.log(`✅ Set ${markers.length} trade markers successfully`)
              
            } catch (markersError) {
              console.error('❌ Failed to add trade markers:', markersError)
            }
          }, 200) // Increased delay to ensure chart is ready
        }

        setStatus(`✅ Professional chart loaded! (${marketData.dataSource})`)
        
      } catch (chartCreationError) {
        console.error('Chart creation error:', chartCreationError)
        const errorMessage = chartCreationError instanceof Error ? chartCreationError.message : 'Unknown error'
        setStatus(`❌ Chart creation failed: ${errorMessage}`)
        setError(`Chart rendering failed: ${errorMessage}`)
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
  if (status.includes('Loading') || status.includes('Creating')) {
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
