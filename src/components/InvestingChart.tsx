"use client"

import { useEffect, useRef, memo } from "react"
import { useTheme } from "@/components/ThemeProvider"

interface InvestingChartProps {
  symbol?: string
  width?: number
  height?: number
  interval?: string
  className?: string
  onLoad?: () => void
}

function InvestingChart({
  symbol = "NQU25", // Default to NASDAQ futures
  width = 800,
  height = 400,
  interval = "1D",
  className = "",
  onLoad
}: InvestingChartProps) {
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
    loadingDiv.innerHTML = '<p class="text-gray-500 dark:text-gray-400">Loading Investing.com chart...</p>'
    containerRef.current.appendChild(loadingDiv)

    // Delay widget loading to not block page render
    const loadWidget = () => {
      if (!containerRef.current) return

      try {
        // Clear loading placeholder
        containerRef.current.innerHTML = ''

        // Create the Investing.com widget container
        const widgetContainer = document.createElement('div')
        widgetContainer.className = 'investing-widget-container'
        
        // Try Yahoo Finance embed with proper futures symbol format
        const yahooSymbol = symbol === 'NQU25' ? 'NQ=F' : 
                           symbol === 'ESU25' ? 'ES=F' : 
                           symbol === 'QQQ' ? 'QQQ' : 
                           symbol === 'EURUSD' ? 'EURUSD=X' : 
                           symbol === 'BTCUSD' ? 'BTC-USD' : symbol
        
        const embedApproaches = [
          // Yahoo Finance chart embed
          `<div style="width: ${width}px; height: ${height}px;">
            <iframe 
              src="https://finance.yahoo.com/chart/embed/${yahooSymbol}" 
              width="${width}" 
              height="${height}" 
              frameborder="0" 
              style="border: none;">
            </iframe>
          </div>`,
          // Alternative Yahoo Finance embed 
          `<div style="width: ${width}px; height: ${height}px;">
            <iframe 
              src="https://finance.yahoo.com/quote/${yahooSymbol}/chart" 
              width="${width}" 
              height="${height}" 
              frameborder="0" 
              style="border: none;">
            </iframe>
          </div>`,
          // Test message showing symbol mapping
          `<div style="width: ${width}px; height: ${height}px; display: flex; align-items: center; justify-content: center; border: 2px solid #e2e8f0; border-radius: 8px; background: #f8fafc;">
            <div style="text-align: center; color: #64748b;">
              <div style="font-size: 18px; margin-bottom: 8px;">📊</div>
              <div style="font-size: 14px; font-weight: 500;">Yahoo Finance Chart</div>
              <div style="font-size: 12px; margin-top: 4px;">Input: ${symbol} → Yahoo: ${yahooSymbol}</div>
              <div style="font-size: 10px; margin-top: 4px; color: #94a3b8;">Testing embed functionality</div>
            </div>
          </div>`
        ]
        
        widgetContainer.innerHTML = embedApproaches[2] // Use test message for now since iframe may not work
        
        containerRef.current.appendChild(widgetContainer)

        // Call onLoad after a delay
        if (onLoad) {
          setTimeout(onLoad, 500)
        }
      } catch (error) {
        console.error('Error loading Investing.com widget:', error)
        if (containerRef.current) {
          containerRef.current.innerHTML = '<div class="flex items-center justify-center h-full bg-red-50 dark:bg-red-900/20 rounded"><p class="text-red-600 dark:text-red-400">Investing.com chart unavailable</p></div>'
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
  }, [symbol, width, height, interval, onLoad])

  return (
    <div className={`investing-chart-container ${className}`}>
      <div
        ref={containerRef}
        style={{
          width: `${width}px`,
          height: `${height}px`
        }}
      />
      <div className="text-xs text-gray-500 mt-1 text-center">
        <a 
          href="https://www.investing.com/" 
          rel="noopener nofollow" 
          target="_blank"
          className="hover:text-gray-700 dark:hover:text-gray-300"
        >
          Powered by Investing.com
        </a>
      </div>
    </div>
  )
}

export default memo(InvestingChart)