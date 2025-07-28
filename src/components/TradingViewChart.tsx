"use client"

import { useEffect, useRef, memo } from "react"
import { useTheme } from "@/components/ThemeProvider"

interface TradingViewChartProps {
  symbol?: string
  interval?: string
  width?: string | number
  height?: string | number
  allowSymbolChange?: boolean
  hideTopToolbar?: boolean
  hideSideToolbar?: boolean
  saveImage?: boolean
  className?: string
  onLoad?: () => void
}

function TradingViewChart({
  symbol = "NASDAQ:AAPL",
  interval = "D",
  width = "100%",
  height = 400,
  allowSymbolChange = true,
  hideTopToolbar = false,
  hideSideToolbar = false,
  saveImage = false,
  className = "",
  onLoad
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined' || !containerRef.current) return

    // Clear previous content
    containerRef.current.innerHTML = ''

    // Add loading placeholder
    const loadingDiv = document.createElement('div')
    loadingDiv.className = 'flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800 rounded'
    loadingDiv.innerHTML = '<p class="text-gray-500 dark:text-gray-400">Loading chart...</p>'
    containerRef.current.appendChild(loadingDiv)

    // Delay widget loading to not block page render
    const loadWidget = () => {
      if (!containerRef.current) return

      try {
        // Clear loading placeholder
        containerRef.current.innerHTML = ''

        // Create widget container div
        const widgetContainer = document.createElement('div')
        widgetContainer.className = 'tradingview-widget-container__widget'
        containerRef.current.appendChild(widgetContainer)

        // Create the script element with the configuration
        const script = document.createElement('script')
        script.type = 'text/javascript'
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
        script.async = true

        // Widget configuration - using the official format
        const config = {
          "autosize": typeof width === 'string' && width === '100%',
          "width": typeof width === 'string' && width !== '100%' ? width : typeof width === 'number' ? width : undefined,
          "height": typeof height === 'number' ? height : parseInt(height as string, 10),
          "symbol": symbol,
          "interval": interval,
          "timezone": "Etc/UTC",
          "theme": theme === 'dark' ? 'dark' : 'light',
          "style": "1",
          "locale": "en",
          "enable_publishing": false,
          "allow_symbol_change": allowSymbolChange,
          "hide_top_toolbar": hideTopToolbar,
          "hide_side_toolbar": hideSideToolbar,
          "save_image": saveImage,
          "calendar": false,
          "support_host": "https://www.tradingview.com"
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
          if (containerRef.current) {
            containerRef.current.innerHTML = '<div class="flex items-center justify-center h-full bg-red-50 dark:bg-red-900/20 rounded"><p class="text-red-600 dark:text-red-400">Failed to load chart</p></div>'
          }
        }

        // Append script to container
        containerRef.current.appendChild(script)

        // Call onLoad after a delay
        if (onLoad) {
          setTimeout(onLoad, 1000)
        }
      } catch (error) {
        console.error('Error loading TradingView widget:', error)
        if (containerRef.current) {
          containerRef.current.innerHTML = '<div class="flex items-center justify-center h-full bg-red-50 dark:bg-red-900/20 rounded"><p class="text-red-600 dark:text-red-400">Chart unavailable</p></div>'
        }
      }
    }

    // Delay loading to not block initial page render
    const timer = setTimeout(loadWidget, 100)

    return () => {
      clearTimeout(timer)
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [symbol, interval, theme, width, height, allowSymbolChange, hideTopToolbar, hideSideToolbar, saveImage, onLoad])

  return (
    <div className={`tradingview-widget-container ${className}`}>
      <div
        ref={containerRef}
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height
        }}
      />
      <div className="tradingview-widget-copyright">
        <a 
          href="https://www.tradingview.com/" 
          rel="noopener nofollow" 
          target="_blank"
          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          Track all markets on TradingView
        </a>
      </div>
    </div>
  )
}

export default memo(TradingViewChart)