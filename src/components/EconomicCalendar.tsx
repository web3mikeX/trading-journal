"use client"

import { useEffect, useRef, memo } from "react"
import { useTheme } from "@/components/ThemeProvider"

interface EconomicCalendarProps {
  width?: string | number
  height?: string | number
  importanceFilter?: string
  countryFilter?: string
  className?: string
  isTransparent?: boolean
}

function EconomicCalendar({
  width = "100%",
  height = 550,
  importanceFilter = "-1,0,1", // All importance levels
  countryFilter = "ar,au,br,ca,cn,fr,de,in,id,it,jp,kr,mx,ru,sa,za,tr,gb,us,eu",
  className = "",
  isTransparent = false
}: EconomicCalendarProps) {
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
    loadingDiv.innerHTML = '<p class="text-gray-500 dark:text-gray-400">Loading economic calendar...</p>'
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
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js'
        script.async = true

        // Widget configuration
        const config = {
          "colorTheme": theme === 'dark' ? 'dark' : 'light',
          "isTransparent": isTransparent,
          "width": typeof width === 'string' ? width : width.toString(),
          "height": typeof height === 'string' ? height : height.toString(),
          "locale": "en",
          "importanceFilter": importanceFilter,
          "countryFilter": countryFilter
        }

        script.innerHTML = JSON.stringify(config)

        // Error handling for script loading
        script.onerror = () => {
          if (containerRef.current) {
            containerRef.current.innerHTML = '<div class="flex items-center justify-center h-full bg-red-50 dark:bg-red-900/20 rounded"><p class="text-red-600 dark:text-red-400">Failed to load economic calendar</p></div>'
          }
        }

        // Append script to container
        containerRef.current.appendChild(script)

      } catch (error) {
        console.error('Error loading TradingView Economic Calendar:', error)
        if (containerRef.current) {
          containerRef.current.innerHTML = '<div class="flex items-center justify-center h-full bg-red-50 dark:bg-red-900/20 rounded"><p class="text-red-600 dark:text-red-400">Economic calendar unavailable</p></div>'
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
  }, [theme, width, height, importanceFilter, countryFilter, isTransparent])

  return (
    <div className={`tradingview-widget-container ${className}`}>
      <div
        ref={containerRef}
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          minHeight: '400px'
        }}
      />
      <div className="tradingview-widget-copyright mt-2">
        <a 
          href="https://www.tradingview.com/" 
          rel="noopener nofollow" 
          target="_blank"
          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          Economic Calendar by TradingView
        </a>
      </div>
    </div>
  )
}

export default memo(EconomicCalendar)