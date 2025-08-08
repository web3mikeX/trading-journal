"use client"

import { useEffect, useRef, useState, memo } from "react"
import { useTheme } from "@/components/ThemeProvider"

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

interface TradingViewSubscriptionChartProps {
  symbol?: string
  trade?: Trade
  width?: number
  height?: number
  showTradeMarkers?: boolean
  interval?: string
  allowSymbolChange?: boolean
  hideTopToolbar?: boolean
  hideSideToolbar?: boolean
  className?: string
  onLoad?: () => void
}

// Symbol mapping for futures contracts to TradingView format
const SYMBOL_MAPPING: Record<string, string> = {
  // NASDAQ Futures
  'NQ': 'CME_MINI:NQ1!',
  'MNQ': 'CME_MINI:MNQ1!', 
  'MNQU5': 'CME_MINI:NQU2025',
  'NQH25': 'CME_MINI:NQH2025',
  'NQM25': 'CME_MINI:NQM2025',
  'NQU25': 'CME_MINI:NQU2025',
  'NQZ25': 'CME_MINI:NQZ2025',

  // S&P 500 Futures
  'ES': 'CME_MINI:ES1!',
  'MES': 'CME_MINI:MES1!',
  'ESH25': 'CME_MINI:ESH2025',
  'ESM25': 'CME_MINI:ESM2025',
  'ESU25': 'CME_MINI:ESU2025',
  'ESZ25': 'CME_MINI:ESZ2025',

  // Russell 2000 Futures
  'RTY': 'CME_MINI:RTY1!',
  'M2K': 'CME_MINI:M2K1!',
  'RTYH25': 'CME_MINI:RTYH2025',
  'RTYM25': 'CME_MINI:RTYM2025',

  // Dow Futures
  'YM': 'CBOT_MINI:YM1!',
  'MYM': 'CBOT_MINI:MYM1!',
  'YMH25': 'CBOT_MINI:YMH2025',
  'YMM25': 'CBOT_MINI:YMM2025',

  // Gold Futures
  'GC': 'COMEX:GC1!',
  'GCG25': 'COMEX:GCG2025',
  'GCJ25': 'COMEX:GCJ2025',
  'GCM25': 'COMEX:GCM2025',

  // Silver Futures
  'SI': 'COMEX:SI1!',
  'SIF25': 'COMEX:SIF2025',

  // Oil Futures
  'CL': 'NYMEX:CL1!',
  'CLK25': 'NYMEX:CLK2025',
  'CLM25': 'NYMEX:CLM2025',

  // Natural Gas Futures
  'NG': 'NYMEX:NG1!',
  'NGK25': 'NYMEX:NGK2025',

  // Treasury Bonds
  'ZB': 'CBOT:ZB1!',
  'ZN': 'CBOT:ZN1!',

  // Crypto (use popular symbols)
  'BTC': 'BINANCE:BTCUSDT',
  'ETH': 'BINANCE:ETHUSDT',
  'SOL': 'BINANCE:SOLUSDT',

  // ETFs (keep as-is)
  'QQQ': 'NASDAQ:QQQ',
  'SPY': 'NASDAQ:SPY',
  'IWM': 'NASDAQ:IWM',
  'DIA': 'NASDAQ:DIA',
  'GLD': 'NASDAQ:GLD',
  'SLV': 'NASDAQ:SLV',
  'USO': 'NASDAQ:USO',
  'UNG': 'NASDAQ:UNG',

  // Forex
  'EURUSD': 'FX_IDC:EURUSD',
  'GBPUSD': 'FX_IDC:GBPUSD',
  'USDJPY': 'FX_IDC:USDJPY',
  'AUDUSD': 'FX_IDC:AUDUSD',

  // VIX
  'VIX': 'CBOE:VIX',
  'VXX': 'NASDAQ:VXX'
}

// Interval mapping for TradingView
const INTERVAL_MAPPING: Record<string, string> = {
  '1m': '1',
  '5m': '5', 
  '15m': '15',
  '1h': '60',
  '4h': '240',
  '1d': 'D',
  '1w': 'W',
  '1M': 'M'
}

function TradingViewSubscriptionChart({
  symbol = "NQ",
  trade,
  width = 800,
  height = 400,
  showTradeMarkers = true,
  interval = "1d",
  allowSymbolChange = false,
  hideTopToolbar = false,
  hideSideToolbar = false,
  className = "",
  onLoad
}: TradingViewSubscriptionChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetRef = useRef<any>(null)
  const { theme } = useTheme()
  const [status, setStatus] = useState('Loading real-time TradingView data...')
  const [error, setError] = useState<string | null>(null)

  // Get TradingView symbol format
  const getTradingViewSymbol = (rawSymbol: string): string => {
    // First check exact mapping
    if (SYMBOL_MAPPING[rawSymbol]) {
      return SYMBOL_MAPPING[rawSymbol]
    }

    // Handle contract months (HMU25 etc)
    const baseSymbol = rawSymbol.replace(/[HMU Z]\d{2,4}$/, '')
    if (SYMBOL_MAPPING[baseSymbol]) {
      return SYMBOL_MAPPING[baseSymbol]
    }

    // Fallback - try to construct CME format
    if (rawSymbol.match(/^(NQ|ES|RTY|YM)/)) {
      return `CME_MINI:${rawSymbol}`
    }

    // Default fallback
    return rawSymbol
  }

  // Get TradingView interval format
  const getTradingViewInterval = (rawInterval: string): string => {
    return INTERVAL_MAPPING[rawInterval] || 'D'
  }

  const tradingViewSymbol = getTradingViewSymbol(symbol)
  const tradingViewInterval = getTradingViewInterval(interval)

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined' || !containerRef.current) return

    let mounted = true

    const loadTradingViewWidget = async () => {
      if (!mounted || !containerRef.current) return

      try {
        setStatus('Connecting to your TradingView subscription...')
        setError(null)

        // Clear previous content
        containerRef.current.innerHTML = ''

        // Add loading placeholder
        const loadingDiv = document.createElement('div')
        loadingDiv.className = 'flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800 rounded border'
        loadingDiv.innerHTML = `
          <div class="text-center p-4">
            <div class="w-48 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-4 mx-auto">
              <div class="h-2 bg-blue-500 rounded-full transition-all duration-300 ease-out animate-pulse" style="width: 70%"></div>
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Loading ${tradingViewSymbol} from your TradingView subscription
            </div>
            <div class="text-xs text-gray-500">
              Real-time market data • ${interval} timeframe
            </div>
          </div>
        `
        containerRef.current.appendChild(loadingDiv)

        // Wait a bit for DOM to stabilize
        await new Promise(resolve => setTimeout(resolve, 100))

        if (!mounted || !containerRef.current) return

        // Clear loading and create widget container
        containerRef.current.innerHTML = ''
        const widgetContainer = document.createElement('div')
        widgetContainer.className = 'tradingview-widget-container__widget'
        widgetContainer.style.height = '100%'
        widgetContainer.style.width = '100%'
        containerRef.current.appendChild(widgetContainer)

        // Load TradingView script
        const script = document.createElement('script')
        script.type = 'text/javascript'
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
        script.async = true

        // Enhanced TradingView configuration for subscription users
        const config = {
          "autosize": false,
          "width": width,
          "height": height,
          "symbol": tradingViewSymbol,
          "interval": tradingViewInterval,
          "timezone": "America/New_York",
          "theme": theme === 'dark' ? 'dark' : 'light',
          "style": "1", // Candlestick
          "locale": "en",
          "enable_publishing": false,
          "allow_symbol_change": allowSymbolChange,
          "hide_top_toolbar": hideTopToolbar,
          "hide_side_toolbar": hideSideToolbar,
          "save_image": false,
          "calendar": false,
          "hide_volume": false,
          "support_host": "https://www.tradingview.com",
          // Enhanced features for subscription users
          "studies": [],
          "show_popup_button": true,
          "popup_width": "1000",
          "popup_height": "650",
          "container_id": "tradingview_chart",
          "datafeed": undefined, // Use default TradingView datafeed with your subscription
          "library_path": undefined, // Use default
          "custom_css_url": undefined,
          "loading_screen": { "backgroundColor": theme === 'dark' ? '#1f2937' : '#ffffff' },
          "overrides": {
            // Professional styling
            "volumePaneSize": "medium",
            "mainSeriesProperties.candleStyle.upColor": "#26a69a",
            "mainSeriesProperties.candleStyle.downColor": "#ef5350",
            "mainSeriesProperties.candleStyle.drawWick": true,
            "mainSeriesProperties.candleStyle.drawBorder": true,
            "mainSeriesProperties.candleStyle.borderColor": "#26a69a",
            "mainSeriesProperties.candleStyle.borderUpColor": "#26a69a",
            "mainSeriesProperties.candleStyle.borderDownColor": "#ef5350",
            "mainSeriesProperties.candleStyle.wickUpColor": "#26a69a",
            "mainSeriesProperties.candleStyle.wickDownColor": "#ef5350",
            "paneProperties.background": theme === 'dark' ? '#1f2937' : '#ffffff',
            "paneProperties.vertGridProperties.color": theme === 'dark' ? '#374151' : '#f1f5f9',
            "paneProperties.horzGridProperties.color": theme === 'dark' ? '#374151' : '#f1f5f9',
            "symbolWatermarkProperties.transparency": 90,
            "scalesProperties.textColor": theme === 'dark' ? '#f1f5f9' : '#1e293b',
            "scalesProperties.lineColor": theme === 'dark' ? '#4b5563' : '#d1d5db'
          }
        }

        // Remove undefined values
        Object.keys(config).forEach(key => {
          if (config[key as keyof typeof config] === undefined) {
            delete config[key as keyof typeof config]
          }
        })

        script.innerHTML = JSON.stringify(config)

        // Error handling for script loading
        script.onerror = () => {
          if (!mounted) return
          const errorMsg = 'Failed to load TradingView widget. Please check your internet connection.'
          setError(errorMsg)
          setStatus('❌ Connection failed')
          
          if (containerRef.current) {
            containerRef.current.innerHTML = `
              <div class="flex items-center justify-center h-full bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                <div class="text-center p-6">
                  <div class="text-red-500 mb-2 text-2xl">⚠️</div>
                  <div class="text-sm text-red-600 dark:text-red-400 mb-2">${errorMsg}</div>
                  <div class="text-xs text-gray-500 mt-2">
                    Symbol: ${tradingViewSymbol} | Interval: ${interval}
                  </div>
                </div>
              </div>
            `
          }
        }

        script.onload = () => {
          if (!mounted) return
          setStatus('✅ Connected to TradingView subscription data')
          
          // Setup success callback
          setTimeout(() => {
            if (mounted && onLoad) {
              onLoad()
            }
          }, 2000)
        }

        // Append script to container
        if (containerRef.current) {
          containerRef.current.appendChild(script)
        }

        // Store widget reference for cleanup
        widgetRef.current = { script, container: widgetContainer }

      } catch (error) {
        if (!mounted) return
        console.error('Error loading TradingView subscription widget:', error)
        const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred'
        setError(errorMsg)
        setStatus('❌ Widget initialization failed')
        
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div class="flex items-center justify-center h-full bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
              <div class="text-center p-6">
                <div class="text-red-500 mb-2 text-2xl">⚠️</div>
                <div class="text-sm text-red-600 dark:text-red-400 mb-2">Widget Error: ${errorMsg}</div>
                <div class="text-xs text-gray-500 mt-2">
                  Attempted Symbol: ${tradingViewSymbol} | Interval: ${interval}
                </div>
              </div>
            </div>
          `
        }
      }
    }

    // Start loading after a short delay with proper error handling
    const timer = setTimeout(() => {
      loadTradingViewWidget().catch((error) => {
        console.error('TradingView widget loading error:', error)
        if (mounted) {
          setError('Failed to load TradingView widget')
          setStatus('❌ Loading failed')
        }
      })
    }, 200)

    return () => {
      mounted = false
      clearTimeout(timer)
      
      // Cleanup widget
      if (widgetRef.current && containerRef.current) {
        try {
          containerRef.current.innerHTML = ''
        } catch (e) {
          console.warn('Error cleaning up TradingView widget:', e)
        }
      }
    }
  }, [tradingViewSymbol, tradingViewInterval, theme, width, height, allowSymbolChange, hideTopToolbar, hideSideToolbar])

  // Format symbol for display
  const displaySymbol = symbol || 'NQ'
  const mappedSymbol = tradingViewSymbol !== displaySymbol ? ` (${tradingViewSymbol})` : ''

  return (
    <div className={`tradingview-subscription-chart-container ${className}`}>
      {/* Chart Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {displaySymbol}{mappedSymbol} - Live Data
        </h3>
        <div className="flex items-center space-x-2">
          <div className="text-xs text-green-600 dark:text-green-400 font-medium">
            📡 TradingView Subscription
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

      {/* Chart Metadata */}
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
        <span className="font-medium text-blue-600 dark:text-blue-400">
          Real-time Market Data
        </span>
        <span className="mx-2">•</span>
        <span>{displaySymbol}</span>
        {tradingViewSymbol !== displaySymbol && (
          <>
            <span className="mx-2">•</span>
            <span className="text-green-600 dark:text-green-400">{tradingViewSymbol}</span>
          </>
        )}
        <span className="mx-2">•</span>
        <span className="font-medium">{interval.toUpperCase()}</span>
        <span className="mx-2">•</span>
        <span className="text-green-600 dark:text-green-400">Your TradingView Subscription</span>
        
        {trade && (
          <>
            <span className="mx-2">•</span>
            <span className="font-medium text-blue-600 dark:text-blue-400">
              {trade.side} Trade Entry: ${trade.entryPrice}
            </span>
            {trade.exitPrice && (
              <>
                <span className="mx-2">•</span>
                <span className="text-purple-600 dark:text-purple-400">
                  Exit: ${trade.exitPrice}
                </span>
              </>
            )}
          </>
        )}
      </div>

      {/* Status Display */}
      {status && (
        <div className="text-xs text-center mt-1 text-gray-600 dark:text-gray-400">
          {status}
        </div>
      )}

      {/* Trade Context Information */}
      {trade && showTradeMarkers && (
        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
            📊 Trade Context on Real Market Data
          </div>
          <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <div>
              <strong>Entry:</strong> ${trade.entryPrice} on {new Date(trade.entryDate).toLocaleString()}
            </div>
            {trade.exitPrice && trade.exitDate && (
              <div>
                <strong>Exit:</strong> ${trade.exitPrice} on {new Date(trade.exitDate).toLocaleString()}
              </div>
            )}
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              💡 <em>Your trade is correlated with exact market candles from your TradingView subscription</em>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(TradingViewSubscriptionChart)