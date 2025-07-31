"use client"

import { useEffect, useRef, useState } from "react"
import dynamic from 'next/dynamic'

// Simple hash function to convert string to number seed
function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

// Seeded random number generator
function seededRandom(seed: number) {
  let value = seed
  return function() {
    value = (value * 9301 + 49297) % 233280
    return value / 233280
  }
}

// Detect if a trade hit stop loss based on exit price and stop loss level
function detectStopLossHit(trade: Trade): boolean {
  if (!trade.exitPrice || !trade.stopLoss) return false
  
  const tolerance = 5 // Increased tolerance for price matching (for futures)
  
  if (trade.side === 'LONG') {
    // For LONG trades, stop loss is hit when exit price is at or below stop loss
    return Math.abs(trade.exitPrice - trade.stopLoss) <= tolerance && trade.exitPrice <= trade.stopLoss
  } else {
    // For SHORT trades, stop loss is hit when exit price is at or above stop loss
    return Math.abs(trade.exitPrice - trade.stopLoss) <= tolerance && trade.exitPrice >= trade.stopLoss
  }
}

// Detect if a trade hit take profit based on exit price and take profit level
function detectTakeProfitHit(trade: Trade): boolean {
  if (!trade.exitPrice || !trade.takeProfit) return false
  
  const tolerance = 5 // Increased tolerance for price matching (for futures)
  
  // Check if exit price is close to take profit level
  return Math.abs(trade.exitPrice - trade.takeProfit) <= tolerance
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
  grossPnL?: number
  market?: string
  contractType?: string
  contractMultiplier?: number
  status?: 'OPEN' | 'CLOSED' | 'CANCELLED'
  stopLoss?: number
  takeProfit?: number
}

interface WorkingChartProps {
  symbol: string
  width?: number | string
  height?: number | string
  trade?: Trade
  showTradeMarkers?: boolean
  theme?: 'light' | 'dark'
  timeframe?: string
  className?: string
  onTimeframeChange?: (timeframe: string) => void
}

export default function WorkingChart({ 
  symbol, 
  width = 600, 
  height = 400, 
  trade, 
  showTradeMarkers = true,
  theme = 'light',
  timeframe = '1h',
  className = '',
  onTimeframeChange
}: WorkingChartProps) {
  // Convert width/height to numbers
  const numericWidth = typeof width === 'string' ? 
    (width === '100%' ? 800 : parseInt(width)) : width
  const numericHeight = typeof height === 'string' ? 
    (height.includes('vh') ? 500 : parseInt(height)) : height
  const [status, setStatus] = useState('Initializing...')
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<any>(null)

  useEffect(() => {
    let mounted = true

    const createChart = async () => {
      if (!containerRef.current || !mounted) return

      try {
        setStatus('Loading chart library...')

        // Import TradingView library with retry mechanism
        let LightweightCharts: any
        let retryCount = 0
        const maxRetries = 3
        
        while (retryCount < maxRetries) {
          try {
            LightweightCharts = await import('lightweight-charts')
            break // Success, exit retry loop
          } catch (importError: any) {
            console.error(`Failed to load lightweight-charts (attempt ${retryCount + 1}):`, importError)
            retryCount++
            
            if (retryCount >= maxRetries) {
              setStatus('Failed to load chart library. Please refresh the page.')
              setError('Chart library failed to load after multiple attempts')
              return
            }
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
          }
        }
        
        if (!LightweightCharts) {
          setStatus('Chart library not available')
          setError('Chart library could not be loaded')
          return
        }
        
        const { CandlestickSeries, LineSeries } = LightweightCharts
        
        if (!mounted) return

        setStatus('Creating chart...')

        // Professional chart styling
        const isDark = theme === 'dark'
        const chart = LightweightCharts.createChart(containerRef.current, {
          width: numericWidth,
          height: numericHeight,
          layout: {
            background: { 
              type: 'solid', 
              color: isDark ? '#1a1a1a' : '#ffffff' 
            },
            textColor: isDark ? '#e5e5e5' : '#333333',
            fontSize: 12,
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          },
          grid: {
            vertLines: { 
              color: isDark ? '#2a2a2a' : '#f0f0f0',
              style: LightweightCharts.LineStyle.Solid
            },
            horzLines: { 
              color: isDark ? '#2a2a2a' : '#f0f0f0',
              style: LightweightCharts.LineStyle.Solid
            }
          },
          crosshair: {
            mode: LightweightCharts.CrosshairMode.Normal,
            vertLine: {
              color: isDark ? '#4a5568' : '#718096',
              width: 1,
              style: LightweightCharts.LineStyle.Dashed
            },
            horzLine: {
              color: isDark ? '#4a5568' : '#718096',
              width: 1,
              style: LightweightCharts.LineStyle.Dashed
            }
          },
          rightPriceScale: {
            borderColor: isDark ? '#2d3748' : '#e2e8f0',
            textColor: isDark ? '#a0aec0' : '#4a5568',
            entireTextOnly: false,
            visible: true,
            scaleMargins: {
              top: 0.1,
              bottom: 0.1
            }
          },
          timeScale: {
            borderColor: isDark ? '#2d3748' : '#e2e8f0',
            textColor: isDark ? '#a0aec0' : '#4a5568',
            timeVisible: true,
            secondsVisible: false
          },
          handleScroll: {
            mouseWheel: true,
            pressedMouseMove: true,
            horzTouchDrag: true,
            vertTouchDrag: true
          },
          handleScale: {
            axisPressedMouseMove: true,
            mouseWheel: true,
            pinch: true
          }
        })

        chartRef.current = chart

        setStatus('Adding data...')

        // Professional candlestick series with proper styling
        const series = chart.addSeries(CandlestickSeries, {
          upColor: '#26a69a',           // Professional teal-green
          downColor: '#ef5350',         // Professional red
          borderUpColor: '#26a69a',     // Border matches body
          borderDownColor: '#ef5350',   // Border matches body
          wickUpColor: '#26a69a',       // Wick matches body
          wickDownColor: '#ef5350',     // Wick matches body
          borderVisible: true,          // Show borders for definition
          wickVisible: true,            // Show wicks
          priceFormat: {
            type: 'price',
            precision: 2,
            minMove: 0.01
          }
        })

        // Generate realistic price data centered around trade prices
        const seed = trade?.id ? hashCode(trade.id) : hashCode(symbol + timeframe)
        const rng = seededRandom(seed)
        
        const timeframeMinutes = {
          '1m': 1,
          '5m': 5,
          '15m': 15,
          '30m': 30,
          '1h': 60,
          '4h': 240,
          '1d': 1440
        }[timeframe] || 60
        
        console.log(`📊 Creating chart with timeframe: ${timeframe} (${timeframeMinutes} minutes)`)

        // Consistent data points based on timeframe for better chart appearance
        const dataPoints = timeframe === '1d' ? 25 : 
                          timeframe === '4h' ? 35 : 
                          timeframe === '1h' ? 50 : 
                          timeframe === '30m' ? 60 : 
                          timeframe === '15m' ? 70 : 
                          timeframe === '5m' ? 80 : 90
        const data = []
        
        // Use trade entry price as the center point, or symbol defaults
        const centerPrice = trade?.entryPrice || (symbol === 'NQ' ? 20000 : symbol === 'ES' ? 5000 : symbol === 'RTY' ? 2000 : 1000)
        
        // Calculate realistic price range around trade
        const priceRange = centerPrice * 0.02 // 2% range around center price
        let currentPrice = centerPrice + (rng() - 0.5) * priceRange
        
        // Generate timestamps around trade dates if available
        const centerTime = trade?.entryDate ? new Date(trade.entryDate).getTime() : Date.now()
        const startTime = centerTime - (dataPoints * 0.7 * timeframeMinutes * 60 * 1000) // Start before entry
        
        // Calculate position relative to trade timeline
        const entryPosition = 0.3 // Entry at 30% into data
        const exitPosition = 0.7   // Exit at 70% into data
        const entryIndex = Math.floor(dataPoints * entryPosition)
        const exitIndex = Math.floor(dataPoints * exitPosition)

        // Pre-calculate volatility once for all data points - more realistic scaling
        const baseVolatility = centerPrice * (symbol === 'CL' ? 0.015 : symbol === 'RTY' ? 0.002 : symbol === 'NQ' || symbol === 'MNQU5' ? 0.0015 : 0.001)
        const timeframeMultiplier = timeframe === '1d' ? 3.0 : timeframe === '4h' ? 2.2 : timeframe === '1h' ? 1.5 : timeframe === '30m' ? 1.2 : timeframe === '15m' ? 1.0 : timeframe === '5m' ? 0.8 : 0.6
        const adjustedVolatility = baseVolatility * timeframeMultiplier

        for (let i = 0; i < dataPoints; i++) {
          const timestamp = Math.floor((startTime + i * timeframeMinutes * 60 * 1000) / 1000)
          
          let open, close, high, low
          
          // Calculate trend direction towards trade outcome
          let trendBias = 0
          if (trade && trade.exitPrice && i > entryIndex && i < exitIndex) {
            const progressToExit = (i - entryIndex) / (exitIndex - entryIndex)
            const totalMove = trade.exitPrice - trade.entryPrice
            trendBias = totalMove * progressToExit * 0.15 // Gradual move towards exit
          }
          
          // Force exact prices at key points
          if (trade && i === entryIndex) {
            // Entry point - price must touch entry level
            open = currentPrice
            close = trade.entryPrice
            const bodyTop = Math.max(open, close)
            const bodyBottom = Math.min(open, close)
            // Smaller, more realistic wicks for key levels
            high = bodyTop + adjustedVolatility * (0.1 + rng() * 0.25)
            low = bodyBottom - adjustedVolatility * (0.1 + rng() * 0.25)
          } else if (trade && trade.exitPrice && i === exitIndex) {
            // Exit point - price must touch exit level
            open = currentPrice
            close = trade.exitPrice
            const bodyTop = Math.max(open, close)
            const bodyBottom = Math.min(open, close)
            // Smaller, more realistic wicks for key levels
            high = bodyTop + adjustedVolatility * (0.1 + rng() * 0.25)
            low = bodyBottom - adjustedVolatility * (0.1 + rng() * 0.25)
          } else {
            // Normal candlestick generation
            open = currentPrice
            
            // Generate realistic price movement with timeframe-appropriate scaling
            const randomStrength = timeframe === '1d' ? 0.8 : timeframe === '4h' ? 0.6 : timeframe === '1h' ? 0.5 : 0.4
            const randomComponent = (rng() - 0.5) * adjustedVolatility * randomStrength
            const meanReversion = (centerPrice - currentPrice) * 0.03 // Consistent pull to center
            const momentumStrength = timeframe === '1d' ? 0.15 : timeframe === '4h' ? 0.12 : 0.08
            const momentum = i > 0 ? (currentPrice - (data[i-1]?.close || centerPrice)) * momentumStrength : 0
            
            const priceChange = randomComponent + trendBias + meanReversion + momentum
            close = open + priceChange
            
            // Realistic wick generation with proper proportions
            const bodyTop = Math.max(open, close)
            const bodyBottom = Math.min(open, close)
            const bodySize = Math.abs(close - open)
            
            // Wick size should be proportional to body size and volatility
            const maxWickRatio = 0.4 // Maximum wick as 40% of adjusted volatility
            const minWickRatio = 0.05 // Minimum wick as 5% of adjusted volatility
            
            const upperWickSize = adjustedVolatility * (minWickRatio + rng() * (maxWickRatio - minWickRatio))
            const lowerWickSize = adjustedVolatility * (minWickRatio + rng() * (maxWickRatio - minWickRatio))
            
            // More realistic wick distribution - most candles have small wicks
            const wickProbability = rng()
            const upperWickMultiplier = wickProbability < 0.7 ? (0.1 + rng() * 0.3) : (0.3 + rng() * 0.7)
            const lowerWickMultiplier = wickProbability < 0.7 ? (0.1 + rng() * 0.3) : (0.3 + rng() * 0.7)
            
            high = bodyTop + upperWickSize * upperWickMultiplier
            low = bodyBottom - lowerWickSize * lowerWickMultiplier
          }
          
          // Ensure stop loss levels are touched for stop loss trades
          if (trade?.stopLoss) {
            if (trade.side === 'LONG' && trade.exitPrice && Math.abs(trade.exitPrice - trade.stopLoss) <= 5) {
              // LONG stop loss hit - ensure low touches stop loss during trade
              if (i >= entryIndex && i <= exitIndex) {
                low = Math.min(low, trade.stopLoss - adjustedVolatility * 0.1)
              }
            } else if (trade.side === 'SHORT' && trade.exitPrice && Math.abs(trade.exitPrice - trade.stopLoss) <= 5) {
              // SHORT stop loss hit - ensure high touches stop loss during trade
              if (i >= entryIndex && i <= exitIndex) {
                high = Math.max(high, trade.stopLoss + adjustedVolatility * 0.1)
              }
            }
          }
          
          // Ensure high >= max(open,close) and low <= min(open,close)
          high = Math.max(high, Math.max(open, close))
          low = Math.min(low, Math.min(open, close))
          
          // Round to appropriate precision
          const precision = symbol.includes('GC') || symbol.includes('CL') ? 2 : symbol.includes('NQ') || symbol.includes('ES') ? 2 : 2
          
          data.push({ 
            time: timestamp, 
            open: parseFloat(open.toFixed(precision)), 
            high: parseFloat(high.toFixed(precision)), 
            low: parseFloat(low.toFixed(precision)), 
            close: parseFloat(close.toFixed(precision)) 
          })
          
          currentPrice = close
        }

        series.setData(data)

        // Add horizontal reference lines for stop loss and take profit using price lines
        if (trade?.stopLoss || trade?.takeProfit) {
          // Add stop loss price line
          if (trade.stopLoss) {
            series.createPriceLine({
              price: trade.stopLoss,
              color: '#dc2626',
              lineWidth: 2,
              lineStyle: LightweightCharts.LineStyle.Dashed,
              axisLabelVisible: true,
              title: 'Stop Loss'
            })
          }
          
          // Add take profit price line
          if (trade.takeProfit) {
            series.createPriceLine({
              price: trade.takeProfit,
              color: '#10b981',
              lineWidth: 2,
              lineStyle: LightweightCharts.LineStyle.Dashed,
              axisLabelVisible: true,
              title: 'Take Profit'
            })
          }
        }

        // Wait for chart to be fully rendered before adding markers
        setTimeout(() => {
          if (!mounted || !trade || !showTradeMarkers) return
          
          setStatus('Adding trade markers...')
          
          try {
            const markers = []
            
            // Use the same entry/exit positions as the price data generation
            const entryPosition = 0.3 // Must match the position used in price data
            const exitPosition = 0.7   // Must match the position used in price data
            
            const entryIndex = Math.floor(data.length * entryPosition)
            const exitIndex = Math.floor(data.length * exitPosition)
            
            const entryTimestamp = data[entryIndex]?.time
            const exitTimestamp = data[exitIndex]?.time
            
            console.log(`🎯 Creating markers for ${trade.symbol} ${trade.side}`)
            console.log(`Using timestamps - Entry: ${entryTimestamp}, Exit: ${exitTimestamp}`)
            
            // Add entry marker
            if (entryTimestamp) {
              const entryMarker = {
                time: entryTimestamp,
                position: trade.side === 'LONG' ? 'belowBar' as const : 'aboveBar' as const,
                color: trade.side === 'LONG' ? '#10b981' : '#ef4444',  // Green for long, red for short
                shape: trade.side === 'LONG' ? 'arrowUp' as const : 'arrowDown' as const,
                text: `${trade.side} ENTRY $${trade.entryPrice.toFixed(2)}`,
                size: 1  // Smaller size
              }
              markers.push(entryMarker)
              console.log('📍 Entry marker created:', entryMarker)
            }
            
            // Add exit marker if trade is closed
            if (trade.exitDate && trade.exitPrice && exitTimestamp) {
              
              // Calculate actual profit/loss based on trade direction
              let actualPnL = 0
              if (trade.side === 'LONG') {
                actualPnL = (trade.exitPrice - trade.entryPrice) * trade.quantity
              } else { // SHORT
                actualPnL = (trade.entryPrice - trade.exitPrice) * trade.quantity
              }
              
              // Use trade.netPnL if available, otherwise use calculated P&L
              const displayPnL = trade.netPnL !== undefined ? trade.netPnL : actualPnL
              const isProfit = displayPnL > 0
              
              // Detect exit type
              const isStopLoss = detectStopLossHit(trade)
              const isTakeProfit = detectTakeProfitHit(trade)
              
              // Choose exit marker style based on exit type
              let exitColor = '#6b7280' // Default gray
              let exitText = 'EXIT'
              
              if (isStopLoss) {
                // Stop loss hit - always red regardless of P&L
                exitColor = '#dc2626' // Red for stop loss
                exitText = 'STOP LOSS'
                console.log(`🔴 Stop loss detected for ${trade.symbol} ${trade.side}: exit=${trade.exitPrice}, stopLoss=${trade.stopLoss}`)
              } else if (isTakeProfit) {
                // Take profit hit - always green
                exitColor = '#10b981' // Green for take profit
                exitText = 'TAKE PROFIT'
                console.log(`🟢 Take profit detected for ${trade.symbol} ${trade.side}: exit=${trade.exitPrice}, takeProfit=${trade.takeProfit}`)
              } else if (isProfit) {
                // Manual profitable exit
                exitColor = '#10b981' // Green for profit
                exitText = 'PROFIT EXIT'
                console.log(`💚 Manual profit exit for ${trade.symbol} ${trade.side}: P&L=${displayPnL}`)
              } else {
                // Manual loss exit
                exitColor = '#f59e0b' // Orange for manual exit at loss
                exitText = 'LOSS EXIT'
                console.log(`🟠 Manual loss exit for ${trade.symbol} ${trade.side}: P&L=${displayPnL}`)
              }
                
              const exitMarker = {
                time: exitTimestamp,
                position: trade.side === 'LONG' ? 'aboveBar' as const : 'belowBar' as const,
                color: exitColor,
                shape: trade.side === 'LONG' ? 'arrowDown' as const : 'arrowUp' as const,
                text: `${exitText} $${trade.exitPrice.toFixed(2)} P&L: ${isProfit ? '+' : ''}$${displayPnL.toFixed(0)}`,
                size: 1  // Smaller size
              }
              markers.push(exitMarker)
              console.log('📍 Exit marker created:', exitMarker)
            }
            
            // Add trade markers as price lines (more reliable than markers)
            if (markers.length > 0) {
              console.log(`🔹 Adding ${markers.length} trade markers as price lines`)
              try {
                markers.forEach(marker => {
                  // Get the price based on marker type
                  let price = 0
                  if (marker.text?.includes('ENTRY') && trade) {
                    price = trade.entryPrice
                  } else if (marker.text?.includes('EXIT') && trade?.exitPrice) {
                    price = trade.exitPrice
                  }
                  
                  if (price > 0) {
                    // Create a price line for each marker
                    series.createPriceLine({
                      price: price,
                      color: marker.color,
                      lineWidth: 2,
                      lineStyle: LightweightCharts.LineStyle.Solid,
                      axisLabelVisible: true,
                      title: marker.text || `${price.toFixed(2)}`
                    })
                    console.log(`📍 Added price line at ${price} with text: ${marker.text}`)
                  }
                })
                
                console.log(`✅ Trade markers added as price lines!`)
                setStatus(`✅ Chart ready with ${markers.length} price lines!`)
              } catch (markerSetError) {
                console.error('❌ Error adding price lines:', markerSetError)
                setStatus(`❌ Price line error: ${markerSetError.message}`)
              }
            } else {
              console.warn('⚠️ No markers to apply')
              setStatus('✅ Chart ready (no markers)')
            }
            
          } catch (markersError) {
            console.error('❌ Marker error:', markersError)
            setStatus(`❌ Marker error: ${markersError.message}`)
          }
        }, 100)  // Wait 100ms for chart to render

        chart.timeScale().fitContent()

        if (mounted) {
          setStatus('✅ Professional chart ready!')
        }

      } catch (error) {
        console.error('Chart error:', error)
        if (mounted) {
          setStatus(`❌ Error: ${error}`)
        }
      }
    }

    createChart()

    return () => {
      mounted = false
      if (chartRef.current) {
        try {
          chartRef.current.remove()
        } catch (e) {
          console.warn('Chart cleanup error:', e)
        }
        chartRef.current = null
      }
    }
  }, [symbol, numericWidth, numericHeight, trade, showTradeMarkers, theme, timeframe])

  const timeframeOptions = [
    { value: '1m', label: '1 Minute' },
    { value: '5m', label: '5 Minutes' },
    { value: '15m', label: '15 Minutes' },
    { value: '30m', label: '30 Minutes' },
    { value: '1h', label: '1 Hour' },
    { value: '4h', label: '4 Hours' },
    { value: '1d', label: '1 Day' }
  ]

  return (
    <div className={`working-chart ${className}`}>
      {/* Header with timeframe selector */}
      <div className="flex items-center justify-between mb-3">
        <div className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          {symbol} Chart - {status}
        </div>
        <select
          value={timeframe}
          onChange={(e) => {
            if (onTimeframeChange) {
              onTimeframeChange(e.target.value)
            }
          }}
          className={`px-2 py-1 text-xs rounded border ${
            theme === 'dark' 
              ? 'bg-gray-700 border-gray-600 text-gray-300' 
              : 'bg-white border-gray-300 text-gray-700'
          } focus:outline-none focus:ring-1 focus:ring-blue-500`}
        >
          {timeframeOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      
      {/* Enhanced chart container */}
      <div 
        ref={containerRef}
        className={`rounded-lg overflow-hidden shadow-sm ${
          theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}
        style={{ width: `${numericWidth}px`, height: `${numericHeight}px` }}
      />
    </div>
  )
}