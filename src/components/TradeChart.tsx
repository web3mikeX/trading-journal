"use client"

import { useEffect, useRef, useState, memo } from "react"
import { useTheme } from "@/components/ThemeProvider"
import { getTradesVizUrl, detectAssetClass, getAssetClassName, isAssetClassSupported } from "@/lib/tradesvizUrl"

interface Trade {
  id: string
  symbol: string
  side: 'LONG' | 'SHORT'
  entryDate: Date
  exitDate?: Date
  entryPrice: number
  exitPrice?: number
  quantity: number
  market?: string
  contractType?: string
  contractMultiplier?: number
}

interface TradeChartProps {
  trade: Trade
  width?: string | number
  height?: string | number
  className?: string
}

function TradeChart({
  trade,
  width = "100%",
  height = "65vh",
  className = ""
}: TradeChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { theme } = useTheme()
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chartUrl, setChartUrl] = useState<string | null>(null)

  // Generate chart URL when trade changes
  useEffect(() => {
    if (!trade) {
      setError("No trade data provided")
      setIsLoading(false)
      return
    }

    // Check if TradesViz is enabled
    const isTradesVizEnabled = process.env.NEXT_PUBLIC_TRADESVIZ_ENABLED === 'true'
    
    if (!isTradesVizEnabled) {
      setError("TradesViz charts are currently disabled. Set NEXT_PUBLIC_TRADESVIZ_ENABLED=true in your environment variables to enable charts.")
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const assetClass = detectAssetClass(trade)
      const assetClassName = getAssetClassName(assetClass)
      
      // Check if asset class is supported
      if (!isAssetClassSupported(assetClass)) {
        setError(`${assetClassName} charts are not yet supported`)
        setIsLoading(false)
        return
      }
      
      const url = getTradesVizUrl(trade)
      
      if (!url) {
        setError(`Unable to generate chart for ${trade.symbol}`)
        setIsLoading(false)
        return
      }
      
      setChartUrl(url)
      
    } catch (err) {
      console.error('Error setting up TradeChart:', err)
      setError(err instanceof Error ? err.message : 'Failed to load chart')
      setIsLoading(false)
    }
  }, [trade])

  // Handle iframe load events
  useEffect(() => {
    if (!chartUrl || !iframeRef.current) return

    const iframe = iframeRef.current
    
    const handleLoad = () => {
      setIsLoading(false)
      setError(null)
    }
    
    const handleError = () => {
      setError('Failed to load chart from TradesViz')
      setIsLoading(false)
    }
    
    iframe.addEventListener('load', handleLoad)
    iframe.addEventListener('error', handleError)
    
    // Set a timeout to handle cases where load event doesn't fire
    const timeout = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false)
      }
    }, 10000) // 10 second timeout
    
    return () => {
      iframe.removeEventListener('load', handleLoad)
      iframe.removeEventListener('error', handleError)
      clearTimeout(timeout)
    }
  }, [chartUrl, isLoading])

  // Render error state
  if (error) {
    const assetClass = detectAssetClass(trade)
    const assetClassName = getAssetClassName(assetClass)
    
    return (
      <div className={`trade-chart-container ${className}`}>
        <div
          style={{
            width: typeof width === 'number' ? `${width}px` : width,
            height: typeof height === 'number' ? `${height}px` : height,
            minHeight: '400px'
          }}
          className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600"
        >
          <div className="text-center p-6">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <svg 
                className="w-16 h-16 mx-auto" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Chart Unavailable
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {error}
            </p>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              <div><strong>Symbol:</strong> {trade.symbol}</div>
              <div><strong>Asset Class:</strong> {assetClassName}</div>
              <div><strong>Side:</strong> {trade.side}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render loading or chart
  return (
    <div className={`trade-chart-container ${className}`}>
      <div
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          minHeight: '400px',
          position: 'relative'
        }}
      >
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <div className="text-gray-600 dark:text-gray-400">
                Loading chart for {trade.symbol}...
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {getAssetClassName(detectAssetClass(trade))} • {trade.side}
              </div>
            </div>
          </div>
        )}
        
        {/* Chart iframe */}
        {chartUrl && (
          <iframe
            ref={iframeRef}
            src={chartUrl}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff'
            }}
            title={`Chart for ${trade.symbol}`}
            allowFullScreen
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        )}
      </div>
      
      {/* Chart info footer */}
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
        <span className="font-medium">
          {trade.symbol} • {getAssetClassName(detectAssetClass(trade))}
        </span>
        {chartUrl && (
          <>
            <span className="mx-2">•</span>
            <a 
              href="https://tradesviz.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-gray-700 dark:hover:text-gray-300"
            >
              Powered by TradesViz
            </a>
          </>
        )}
      </div>
    </div>
  )
}

export default memo(TradeChart)