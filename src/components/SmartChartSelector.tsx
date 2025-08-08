"use client"

import { useState, useEffect, memo } from "react"
import { useTheme } from "@/components/ThemeProvider"

// Import chart components
import TradingViewSubscriptionChart from "./TradingViewSubscriptionChart"
import TradingViewWithTradeMarkers from "./TradingViewWithTradeMarkers"
import TradingViewChart from "./TradingViewChart"
import WorkingChartNew from "./WorkingChartNew"

// Import configuration and utilities
import { 
  getTradingViewConfig, 
  getChartComponent, 
  isTradingViewSubscriptionAvailable,
  areTradeMarkersEnabled,
  getPreferredDataProvider 
} from "@/lib/tradingViewConfig"
import { getTradingViewSymbol, hasRealTimeSupport } from "@/lib/tradingViewSymbolMapping"

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

interface SmartChartSelectorProps {
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
  // Smart selector options
  preferRealData?: boolean
  autoFallback?: boolean
  showProviderInfo?: boolean
}

type ChartProvider = 'tradingview-advanced' | 'tradingview-basic' | 'tradingview-widget' | 'lightweight-charts' | 'synthetic'

interface ChartOption {
  provider: ChartProvider
  name: string
  description: string
  features: string[]
  available: boolean
  recommended: boolean
  requiresSubscription: boolean
}

function SmartChartSelector({
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
  preferRealData = true,
  autoFallback = true,
  showProviderInfo = true
}: SmartChartSelectorProps) {
  const { theme } = useTheme()
  const [selectedProvider, setSelectedProvider] = useState<ChartProvider | null>(null)
  const [fallbackProvider, setFallbackProvider] = useState<ChartProvider | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Get configuration and capabilities
  const config = getTradingViewConfig()
  const symbolMapping = getTradingViewSymbol(symbol)
  const hasRealTimeSupport = symbolMapping !== null
  const subscriptionAvailable = isTradingViewSubscriptionAvailable()
  const tradeMarkersAvailable = areTradeMarkersEnabled()

  // Define available chart options
  const getChartOptions = (): ChartOption[] => {
    return [
      {
        provider: 'tradingview-advanced',
        name: 'TradingView Advanced',
        description: 'Full TradingView Charting Library with trade markers',
        features: ['Real-time data', 'Trade markers', 'Advanced tools', 'Custom studies'],
        available: false, // Disabled until charting library is properly configured
        recommended: false,
        requiresSubscription: true
      },
      {
        provider: 'tradingview-basic',
        name: 'TradingView Basic',
        description: 'TradingView subscription widget with real-time data',
        features: ['Real-time data', 'Professional interface', 'Multiple timeframes'],
        available: subscriptionAvailable && hasRealTimeSupport,
        recommended: true,
        requiresSubscription: true
      },
      {
        provider: 'tradingview-widget',
        name: 'TradingView Widget',
        description: 'Standard TradingView widget (free)',
        features: ['Real-time data', 'Basic tools', 'Standard interface'],
        available: hasRealTimeSupport,
        recommended: false,
        requiresSubscription: false
      },
      {
        provider: 'lightweight-charts',
        name: 'Enhanced Charts',
        description: 'Lightweight Charts with market data APIs',
        features: ['Market data', 'Fast rendering', 'Trade markers', 'Custom styling'],
        available: true,
        recommended: !subscriptionAvailable,
        requiresSubscription: false
      },
      {
        provider: 'synthetic',
        name: 'Demo Charts',
        description: 'Synthetic data for testing and demo purposes',
        features: ['Offline support', 'Fast loading', 'Trade simulation'],
        available: true,
        recommended: false,
        requiresSubscription: false
      }
    ]
  }

  // Automatically select best provider
  useEffect(() => {
    const selectBestProvider = () => {
      setIsLoading(true)
      setError(null)

      const options = getChartOptions()
      const availableOptions = options.filter(opt => opt.available)

      if (availableOptions.length === 0) {
        setError('No chart providers available')
        setSelectedProvider('synthetic')
        setIsLoading(false)
        return
      }

      // Smart selection logic
      let bestOption: ChartOption | null = null

      if (trade && showTradeMarkers) {
        // Prioritize providers with trade marker support
        bestOption = availableOptions.find(opt => 
          opt.provider === 'tradingview-advanced' || 
          opt.provider === 'lightweight-charts'
        ) || null
      }

      if (!bestOption && preferRealData) {
        // Prioritize real-time data providers
        bestOption = availableOptions.find(opt => 
          opt.provider.startsWith('tradingview') && opt.available
        ) || null
      }

      if (!bestOption) {
        // Fall back to first available recommended option
        bestOption = availableOptions.find(opt => opt.recommended) || availableOptions[0]
      }

      if (bestOption) {
        setSelectedProvider(bestOption.provider)
        
        // Set fallback option
        const fallback = availableOptions.find(opt => 
          opt.provider !== bestOption!.provider && 
          opt.provider !== 'synthetic'
        )
        setFallbackProvider(fallback?.provider || 'synthetic')
      }

      setIsLoading(false)
    }

    selectBestProvider()
  }, [symbol, trade, showTradeMarkers, preferRealData, subscriptionAvailable, hasRealTimeSupport])

  // Handle chart load success
  const handleChartLoad = () => {
    setError(null)
    if (onLoad) onLoad()
  }

  // Handle chart load error and auto-fallback
  const handleChartError = (errorMessage: string) => {
    console.warn(`Chart provider ${selectedProvider} failed:`, errorMessage)
    
    if (autoFallback && fallbackProvider && fallbackProvider !== selectedProvider) {
      console.log(`Falling back to ${fallbackProvider}`)
      setSelectedProvider(fallbackProvider)
      setError(null)
    } else {
      setError(errorMessage)
    }
  }

  // Render appropriate chart component
  const renderChart = () => {
    if (!selectedProvider) return null

    const commonProps = {
      symbol,
      trade,
      width,
      height,
      interval,
      showTradeMarkers,
      allowSymbolChange,
      hideTopToolbar,
      hideSideToolbar,
      className: "chart-component",
      onLoad: handleChartLoad
    }

    switch (selectedProvider) {
      case 'tradingview-advanced':
        return (
          <TradingViewWithTradeMarkers
            {...commonProps}
            onTradeMarkersReady={() => console.log('Trade markers ready')}
          />
        )

      case 'tradingview-basic':
        return (
          <TradingViewSubscriptionChart
            {...commonProps}
          />
        )

      case 'tradingview-widget':
        return (
          <TradingViewChart
            {...commonProps}
          />
        )

      case 'lightweight-charts':
        return (
          <WorkingChartNew
            {...commonProps}
            preferReal={true}
          />
        )

      case 'synthetic':
        return (
          <WorkingChartNew
            {...commonProps}
            preferReal={false}
          />
        )

      default:
        return null
    }
  }

  // Get current provider info
  const getCurrentProviderInfo = () => {
    if (!selectedProvider) return null
    return getChartOptions().find(opt => opt.provider === selectedProvider)
  }

  const currentProvider = getCurrentProviderInfo()

  if (isLoading) {
    return (
      <div className={`smart-chart-selector ${className}`}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {symbol} Chart
          </h3>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Selecting optimal chart provider...
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
                className="h-2 bg-blue-500 rounded-full transition-all duration-500 ease-out animate-pulse"
                style={{ width: '60%' }}
              ></div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Initializing smart chart selection...
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`smart-chart-selector ${className}`}>
      {/* Chart Header with Provider Info */}
      {showProviderInfo && currentProvider && (
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {symbol} Chart
            </h3>
            <div className="flex items-center space-x-2">
              <div className={`text-xs px-2 py-1 rounded font-medium ${
                currentProvider.requiresSubscription 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
              }`}>
                {currentProvider.name}
              </div>
              {currentProvider.recommended && (
                <div className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 font-medium">
                  Recommended
                </div>
              )}
            </div>
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {currentProvider.description} • Features: {currentProvider.features.join(', ')}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
          <div className="text-sm text-red-600 dark:text-red-400">
            ⚠️ Chart Error: {error}
          </div>
          {fallbackProvider && (
            <div className="text-xs text-gray-500 mt-1">
              Fallback available: {getChartOptions().find(opt => opt.provider === fallbackProvider)?.name}
            </div>
          )}
        </div>
      )}

      {/* Chart Component */}
      {renderChart()}

      {/* Provider Selection */}
      {showProviderInfo && !isLoading && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Available Chart Providers
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
            {getChartOptions().map((option) => (
              <button
                key={option.provider}
                onClick={() => setSelectedProvider(option.provider)}
                disabled={!option.available}
                className={`p-2 rounded border text-left transition-colors ${
                  selectedProvider === option.provider
                    ? 'bg-blue-100 border-blue-300 text-blue-900 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-400'
                    : option.available
                    ? 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                    : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-600'
                }`}
              >
                <div className="font-medium">{option.name}</div>
                <div className="text-xs opacity-75">{option.description}</div>
                {option.requiresSubscription && (
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                    🔐 Subscription Required
                  </div>
                )}
                {!option.available && (
                  <div className="text-xs text-red-500 mt-1">
                    ❌ Not Available
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Configuration Summary */}
      {showProviderInfo && (
        <div className="mt-2 text-xs text-center space-x-2 text-gray-500 dark:text-gray-400">
          <span>Subscription: {subscriptionAvailable ? '✅' : '❌'}</span>
          <span>•</span>
          <span>Real-time Support: {hasRealTimeSupport ? '✅' : '❌'}</span>
          <span>•</span>
          <span>Trade Markers: {tradeMarkersAvailable ? '✅' : '❌'}</span>
          <span>•</span>
          <span>Preferred Provider: {getPreferredDataProvider()}</span>
        </div>
      )}
    </div>
  )
}

export default memo(SmartChartSelector)