"use client"

import { useState, useEffect, memo } from "react"
import InstantChart from "@/components/InstantChart"

type ChartProvider = 'canvas' | 'apexcharts' | 'placeholder'

interface UnifiedChartProps {
  symbol: string
  width?: number
  height?: number
  interval?: string
  className?: string
  preferredProvider?: ChartProvider
  allowFallback?: boolean
  onProviderChange?: (provider: ChartProvider) => void
}

// Symbol mapping for different providers
const symbolMappings = {
  canvas: (symbol: string) => symbol,
  apexcharts: (symbol: string) => symbol,
  placeholder: (symbol: string) => symbol
}

function UnifiedChart({
  symbol,
  width = 400,
  height = 300,
  interval = "D",
  className = "",
  preferredProvider = 'canvas',
  allowFallback = true,
  onProviderChange
}: UnifiedChartProps) {
  const [currentProvider, setCurrentProvider] = useState<ChartProvider>(preferredProvider)
  const [failedProviders, setFailedProviders] = useState<Set<ChartProvider>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  // Provider priority order for fallbacks
  const providerOrder: ChartProvider[] = ['canvas', 'apexcharts', 'placeholder']

  const handleProviderError = (provider: ChartProvider) => {
    console.warn(`Chart provider ${provider} failed for symbol ${symbol}`)
    
    if (!allowFallback) return
    
    // Mark this provider as failed
    const newFailedProviders = new Set(failedProviders)
    newFailedProviders.add(provider)
    setFailedProviders(newFailedProviders)
    
    // Find next available provider
    const availableProviders = providerOrder.filter(p => !newFailedProviders.has(p))
    
    if (availableProviders.length > 0) {
      const nextProvider = availableProviders[0]
      setCurrentProvider(nextProvider)
      onProviderChange?.(nextProvider)
    }
  }

  const handleProviderLoad = () => {
    console.log(`Chart loaded with provider: ${currentProvider}`)
    setIsLoading(false)
  }

  // For instant loading providers, mark as loaded immediately
  useEffect(() => {
    if (currentProvider === 'canvas' || currentProvider === 'apexcharts' || currentProvider === 'placeholder') {
      setIsLoading(false)
      handleProviderLoad()
    }
  }, [currentProvider])

  // Reset failed providers when symbol changes
  useEffect(() => {
    setFailedProviders(new Set())
    setCurrentProvider(preferredProvider)
    setIsLoading(true)
  }, [symbol, preferredProvider])

  const getMappedSymbol = (provider: ChartProvider) => {
    return symbolMappings[provider](symbol)
  }

  const renderChart = () => {
    const mappedSymbol = getMappedSymbol(currentProvider)
    
    switch (currentProvider) {
      case 'canvas':
        return (
          <InstantChart
            symbol={mappedSymbol}
            width={width}
            height={height}
            onLoad={() => {
              console.log(`✅ Canvas chart loaded for ${symbol}`)
              handleProviderLoad()
            }}
          />
        )
      
      case 'apexcharts':
        return (
          <div 
            className="flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700"
            style={{ width: `${width}px`, height: `${height}px` }}
          >
            <div className="text-center p-4">
              <div className="text-blue-500 dark:text-blue-400 mb-2">📈</div>
              <div className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                ApexCharts Demo
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Synthetic chart for {symbol}
              </div>
            </div>
          </div>
        )
      
      case 'placeholder':
        return (
          <div 
            className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600"
            style={{ width: `${width}px`, height: `${height}px` }}
          >
            <div className="text-center p-4">
              <div className="text-gray-400 dark:text-gray-500 mb-2">📊</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Chart for {symbol}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500">
                No providers available
              </div>
            </div>
          </div>
        )
      
      default:
        return <div className="text-red-500">Unknown chart provider</div>
    }
  }

  return (
    <div className={`unified-chart-container ${className}`}>
      {/* Provider selector for testing */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Provider: <span className="font-medium capitalize">{currentProvider}</span>
          {failedProviders.size > 0 && (
            <span className="ml-2 text-xs text-orange-500">
              (Failed: {Array.from(failedProviders).join(', ')})
            </span>
          )}
        </div>
        
        {/* Manual provider switcher */}
        <div className="flex gap-1">
          {providerOrder.map(provider => (
            <button
              key={provider}
              onClick={() => {
                setCurrentProvider(provider)
                setIsLoading(true)
                onProviderChange?.(provider)
              }}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                currentProvider === provider
                  ? 'bg-blue-500 text-white'
                  : failedProviders.has(provider)
                  ? 'bg-red-100 text-red-600 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
              disabled={failedProviders.has(provider)}
              title={`Switch to ${provider} charts`}
            >
              {provider}
            </button>
          ))}
        </div>
      </div>

      {/* Chart container */}
      <div className="relative">
        {isLoading && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded z-10"
            style={{ width: `${width}px`, height: `${height}px` }}
          >
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <div className="text-gray-500 dark:text-gray-400">
                Loading {currentProvider} chart...
              </div>
            </div>
          </div>
        )}
        
        {renderChart()}
      </div>

      {/* Symbol mapping info */}
      <div className="text-xs text-gray-500 mt-1 text-center">
        Symbol: {symbol} → {getMappedSymbol(currentProvider)} ({currentProvider})
      </div>
    </div>
  )
}

export default memo(UnifiedChart)