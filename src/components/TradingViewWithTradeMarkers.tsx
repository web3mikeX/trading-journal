"use client"

import { useEffect, useRef, useState, memo } from "react"
import { useTheme } from "@/components/ThemeProvider"
import { getTradingViewSymbol, getTradingViewInterval, formatSymbolDisplay } from "@/lib/tradingViewSymbolMapping"

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
  contractMultiplier?: number
}

interface TradingViewWithTradeMarkersProps {
  symbol?: string
  trade?: Trade
  width?: number
  height?: number
  interval?: string
  showTradeMarkers?: boolean
  allowSymbolChange?: boolean
  hideTopToolbar?: boolean
  hideSideToolbar?: boolean
  className?: string
  onLoad?: () => void
  onTradeMarkersReady?: () => void
}

declare global {
  interface Window {
    TradingView: any
  }
}

function TradingViewWithTradeMarkers({
  symbol = "NQ",
  trade,
  width = 800,
  height = 400,
  interval = "1d",
  showTradeMarkers = true,
  allowSymbolChange = false,
  hideTopToolbar = false,
  hideSideToolbar = false,
  className = "",
  onLoad,
  onTradeMarkersReady
}: TradingViewWithTradeMarkersProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetRef = useRef<any>(null)
  const { theme } = useTheme()
  const [status, setStatus] = useState('Initializing TradingView with trade markers...')
  const [error, setError] = useState<string | null>(null)
  const [tradeMarkersVisible, setTradeMarkersVisible] = useState(false)

  // Get symbol mapping
  const symbolMapping = getTradingViewSymbol(symbol)
  const tradingViewSymbol = symbolMapping?.tradingViewSymbol || symbol
  const tradingViewInterval = getTradingViewInterval(interval)

  // Generate unique container ID for each widget instance
  const containerId = `tradingview_${Math.random().toString(36).substr(2, 9)}`

  // Calculate trade markers timing
  const getTradeMarkerTiming = () => {
    if (!trade || !showTradeMarkers) return null

    const entryTime = new Date(trade.entryDate).getTime() / 1000 // Unix timestamp
    const exitTime = trade.exitDate ? new Date(trade.exitDate).getTime() / 1000 : null

    return {
      entryTime,
      exitTime,
      entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice,
      side: trade.side,
      quantity: trade.quantity,
      pnl: trade.netPnL
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return

    let mounted = true
    let widgetInstance: any = null

    const initializeTradingViewWidget = async () => {
      if (!mounted || !containerRef.current) return

      try {
        setStatus('Loading TradingView Charting Library...')
        setError(null)

        // Clear container
        containerRef.current.innerHTML = ''

        // Create loading state
        const loadingDiv = document.createElement('div')
        loadingDiv.className = 'flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800 rounded border'
        loadingDiv.innerHTML = `
          <div class="text-center p-4">
            <div class="w-48 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-4 mx-auto">
              <div class="h-2 bg-green-500 rounded-full transition-all duration-500 ease-out animate-pulse" style="width: 80%"></div>
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">
              📡 Connecting to ${formatSymbolDisplay(symbol)}
            </div>
            <div class="text-xs text-green-600 dark:text-green-400 font-medium">
              Real-time subscription data with trade markers
            </div>
          </div>
        `
        containerRef.current.appendChild(loadingDiv)

        // Wait for TradingView library to be available
        let attempts = 0
        while (!window.TradingView && attempts < 50 && mounted) {
          await new Promise(resolve => setTimeout(resolve, 100))
          attempts++
        }

        if (!window.TradingView && mounted) {
          // Load TradingView library dynamically
          const script = document.createElement('script')
          script.src = 'https://s3.tradingview.com/tv.js'
          script.async = true
          
          const scriptPromise = new Promise((resolve, reject) => {
            script.onload = resolve
            script.onerror = reject
          })

          document.head.appendChild(script)
          await scriptPromise

          // Wait a bit more for initialization
          await new Promise(resolve => setTimeout(resolve, 500))
        }

        if (!mounted || !containerRef.current || !window.TradingView) {
          throw new Error('TradingView library failed to load')
        }

        setStatus('Creating advanced chart with trade markers...')

        // Clear loading state
        containerRef.current.innerHTML = ''

        // Create widget container
        const widgetDiv = document.createElement('div')
        widgetDiv.id = containerId
        widgetDiv.style.height = '100%'
        widgetDiv.style.width = '100%'
        containerRef.current.appendChild(widgetDiv)

        // Advanced TradingView widget configuration
        const widgetConfig = {
          symbol: tradingViewSymbol,
          interval: tradingViewInterval,
          container_id: containerId,
          datafeed: new window.TradingView.Datafeed({
            // Use your TradingView subscription data
          }),
          library_path: '/charting_library/',
          
          // Chart settings optimized for trade analysis
          width: width,
          height: height,
          autosize: false,
          fullscreen: false,
          timezone: symbolMapping?.timezone || 'America/New_York',
          locale: 'en',
          
          // Professional styling
          theme: theme === 'dark' ? 'Dark' : 'Light',
          style: '1', // Candlestick
          
          // Toolbar configuration
          toolbar_bg: theme === 'dark' ? '#1f2937' : '#ffffff',
          allow_symbol_change: allowSymbolChange,
          hide_top_toolbar: hideTopToolbar,
          hide_side_toolbar: hideSideToolbar,
          hide_legend: false,
          save_image: false,
          
          // Enhanced features for subscription users
          studies_overrides: {},
          overrides: {
            // Professional candlestick styling
            "mainSeriesProperties.candleStyle.upColor": "#26a69a",
            "mainSeriesProperties.candleStyle.downColor": "#ef5350",
            "mainSeriesProperties.candleStyle.drawWick": true,
            "mainSeriesProperties.candleStyle.drawBorder": true,
            "mainSeriesProperties.candleStyle.borderColor": "#26a69a",
            "mainSeriesProperties.candleStyle.borderUpColor": "#26a69a", 
            "mainSeriesProperties.candleStyle.borderDownColor": "#ef5350",
            "mainSeriesProperties.candleStyle.wickUpColor": "#26a69a",
            "mainSeriesProperties.candleStyle.wickDownColor": "#ef5350",
            
            // Chart background and grid
            "paneProperties.background": theme === 'dark' ? '#1f2937' : '#ffffff',
            "paneProperties.vertGridProperties.color": theme === 'dark' ? '#374151' : '#f1f5f9',
            "paneProperties.horzGridProperties.color": theme === 'dark' ? '#374151' : '#f1f5f9',
            
            // Scale styling
            "scalesProperties.textColor": theme === 'dark' ? '#f1f5f9' : '#1e293b',
            "scalesProperties.lineColor": theme === 'dark' ? '#4b5563' : '#d1d5db',
            
            // Volume pane
            "volumePaneSize": "medium"
          },

          // Disable features not needed for subscription users
          enable_publishing: false,
          withdateranges: true,
          hide_volume: false,
          studies: [],
          
          // Callback functions
          onChartReady: () => {
            if (!mounted) return
            
            setStatus('✅ Chart loaded - Adding trade markers...')
            
            // Add trade markers after chart is ready
            if (showTradeMarkers && trade) {
              addTradeMarkers()
            } else {
              setStatus('✅ Real-time TradingView chart ready')
              if (onLoad) onLoad()
            }
          }
        }

        // Create the widget
        setStatus('Initializing TradingView widget...')
        widgetInstance = new window.TradingView.widget(widgetConfig)
        widgetRef.current = widgetInstance

        // Wait for widget to be fully loaded
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        if (!mounted) return
        
        console.error('TradingView widget initialization error:', error)
        const errorMsg = error instanceof Error ? error.message : 'Failed to initialize TradingView widget'
        setError(errorMsg)
        setStatus('❌ Widget initialization failed')

        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div class="flex items-center justify-center h-full bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
              <div class="text-center p-6">
                <div class="text-red-500 mb-2 text-2xl">⚠️</div>
                <div class="text-sm text-red-600 dark:text-red-400 mb-2">
                  Widget Error: ${errorMsg}
                </div>
                <div class="text-xs text-gray-500 mt-2">
                  Symbol: ${tradingViewSymbol} | Interval: ${interval}
                </div>
                <div class="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  💡 This requires TradingView Advanced Charts subscription
                </div>
              </div>
            </div>
          `
        }
      }
    }

    // Add trade markers to the chart
    const addTradeMarkers = async () => {
      if (!widgetInstance || !trade || !showTradeMarkers || !mounted) return

      try {
        setStatus('Adding precise trade markers...')

        const tradeInfo = getTradeMarkerTiming()
        if (!tradeInfo) return

        // Wait for chart to be fully ready
        await new Promise(resolve => setTimeout(resolve, 500))

        // Get chart widget
        const chart = widgetInstance.chart()
        if (!chart) {
          console.warn('Chart instance not available for trade markers')
          return
        }

        // Create study/drawing for trade markers
        const entryPrice = tradeInfo.entryPrice
        const exitPrice = tradeInfo.exitPrice
        const side = tradeInfo.side

        // Add entry marker
        const entryTime = tradeInfo.entryTime
        const entryColor = side === 'LONG' ? '#22c55e' : '#ef4444'
        
        // Create horizontal line for entry price
        chart.createStudy('Horizontal Line', false, false, {
          price: entryPrice,
          color: entryColor,
          linewidth: 3,
          linestyle: 0 // Solid line
        })

        // Add entry marker annotation
        chart.createShape(
          { time: entryTime, price: entryPrice },
          {
            shape: side === 'LONG' ? 'arrow_up' : 'arrow_down',
            text: `💹 ${side} ENTRY\\n$${entryPrice}\\n${new Date(entryTime * 1000).toLocaleTimeString()}`,
            overrides: {
              color: entryColor,
              textColor: '#ffffff',
              fontsize: 12,
              bold: true
            }
          }
        )

        // Add exit marker if available
        if (exitPrice && tradeInfo.exitTime) {
          const exitTime = tradeInfo.exitTime
          const isProfit = side === 'LONG' ? exitPrice > entryPrice : exitPrice < entryPrice
          const exitColor = isProfit ? '#22c55e' : '#ef4444'
          
          // Calculate P&L
          const pnlPerUnit = side === 'LONG' ? (exitPrice - entryPrice) : (entryPrice - exitPrice)
          const totalPnl = pnlPerUnit * (trade.quantity || 1) * (trade.contractMultiplier || 1)
          const pnlText = totalPnl >= 0 ? `+$${totalPnl.toFixed(2)}` : `-$${Math.abs(totalPnl).toFixed(2)}`

          // Create horizontal line for exit price
          chart.createStudy('Horizontal Line', false, false, {
            price: exitPrice,
            color: exitColor,
            linewidth: 3,
            linestyle: 0 // Solid line
          })

          // Add exit marker annotation
          chart.createShape(
            { time: exitTime, price: exitPrice },
            {
              shape: side === 'LONG' ? 'arrow_down' : 'arrow_up',
              text: `💰 EXIT\\n$${exitPrice}\\n${pnlText}\\n${new Date(exitTime * 1000).toLocaleTimeString()}`,
              overrides: {
                color: exitColor,
                textColor: '#ffffff',
                fontsize: 12,
                bold: true
              }
            }
          )

          // Add connecting line between entry and exit
          chart.createShape(
            [
              { time: entryTime, price: entryPrice },
              { time: exitTime, price: exitPrice }
            ],
            {
              shape: 'trend_line',
              overrides: {
                linecolor: isProfit ? '#22c55e' : '#ef4444',
                linewidth: 2,
                linestyle: 1 // Dashed line
              }
            }
          )
        }

        setTradeMarkersVisible(true)
        setStatus('✅ Trade markers added to real-time chart')
        
        if (onTradeMarkersReady) onTradeMarkersReady()
        if (onLoad) onLoad()

      } catch (error) {
        console.error('Error adding trade markers:', error)
        setStatus('⚠️ Chart loaded, trade markers failed')
        if (onLoad) onLoad()
      }
    }

    // Initialize widget
    const timer = setTimeout(initializeTradingViewWidget, 300)

    return () => {
      mounted = false
      clearTimeout(timer)
      
      if (widgetInstance) {
        try {
          widgetInstance.remove()
        } catch (e) {
          console.warn('Error removing TradingView widget:', e)
        }
      }
      
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [tradingViewSymbol, tradingViewInterval, theme, width, height, trade, showTradeMarkers])

  const displaySymbol = formatSymbolDisplay(symbol)

  return (
    <div className={`tradingview-trade-markers-container ${className}`}>
      {/* Enhanced Chart Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {displaySymbol} - Advanced Chart
          </h3>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Real-time TradingView subscription data with trade correlation
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-xs text-green-600 dark:text-green-400 font-medium">
            📡 Live Data
          </div>
          {tradeMarkersVisible && (
            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              🎯 Trade Markers
            </div>
          )}
          <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">
            {interval.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div
        ref={containerRef}
        className="tradingview-widget-container"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          position: 'relative',
          backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
          border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
          borderRadius: '8px',
          overflow: 'hidden'
        }}
      />

      {/* Enhanced Status and Metadata */}
      <div className="mt-3 space-y-2">
        {/* Status Bar */}
        <div className="text-xs text-center text-gray-600 dark:text-gray-400">
          {status}
        </div>

        {/* Chart Metadata */}
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center space-x-2">
          <span className="font-medium text-blue-600 dark:text-blue-400">
            TradingView Subscription
          </span>
          <span>•</span>
          <span>{symbolMapping?.exchange || 'Unknown Exchange'}</span>
          <span>•</span>
          <span className="font-medium">{interval.toUpperCase()} Timeframe</span>
          {symbolMapping?.assetClass && (
            <>
              <span>•</span>
              <span className="capitalize">{symbolMapping.assetClass}</span>
            </>
          )}
        </div>

        {/* Trade Information Panel */}
        {trade && showTradeMarkers && (
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center">
              🎯 <span className="ml-2">Trade Analysis on Real Market Data</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <div className="text-blue-700 dark:text-blue-300">
                  <strong>Entry:</strong> ${trade.entryPrice} ({trade.side})
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  {new Date(trade.entryDate).toLocaleString()}
                </div>
              </div>
              
              {trade.exitPrice && trade.exitDate && (
                <div className="space-y-1">
                  <div className="text-purple-700 dark:text-purple-300">
                    <strong>Exit:</strong> ${trade.exitPrice}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {new Date(trade.exitDate).toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            {trade.netPnL !== undefined && (
              <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                <div className={`text-sm font-medium ${
                  trade.netPnL >= 0 
                    ? 'text-green-700 dark:text-green-400' 
                    : 'text-red-700 dark:text-red-400'
                }`}>
                  P&L: {trade.netPnL >= 0 ? '+' : ''}${trade.netPnL.toFixed(2)}
                </div>
              </div>
            )}

            <div className="mt-3 text-xs text-blue-600 dark:text-blue-400 italic">
              💡 Your trades are precisely correlated with real market candles from your TradingView subscription, 
              showing exactly what price action you traded against.
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
            <div className="text-sm text-red-600 dark:text-red-400">
              ⚠️ {error}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Fallback: Consider using the basic TradingView widget or synthetic data.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(TradingViewWithTradeMarkers)