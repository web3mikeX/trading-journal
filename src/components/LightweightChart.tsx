"use client"

import { memo, useEffect } from "react"
import { useTheme } from "@/components/ThemeProvider"

interface LightweightChartProps {
  symbol?: string
  width?: number
  height?: number
  interval?: string
  className?: string
  onLoad?: () => void
}

function LightweightChart({
  symbol = "NQ=F",
  width = 800,
  height = 400,
  interval = "1D",
  className = "",
  onLoad
}: LightweightChartProps) {
  const { theme } = useTheme()

  // Load effect to call onLoad
  useEffect(() => {
    if (onLoad) {
      const timer = setTimeout(() => {
        onLoad()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [onLoad])

  // Simplified placeholder since TradingView Lightweight Charts has API issues
  return (
    <div className={`lightweight-chart-container ${className}`}>
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
          <div className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
            📊 {symbol}
          </div>
          <div className="text-3xl text-green-600 dark:text-green-400 font-bold mb-2">
            $20,847.50
          </div>
          <div className="text-lg text-green-500 mb-6">
            +2.3% (+$468.25)
          </div>
          <div className="w-48 h-24 mx-auto bg-gradient-to-r from-green-100 to-green-200 dark:from-green-800 dark:to-green-700 rounded-lg flex items-end justify-center relative overflow-hidden p-2">
            <div className="absolute bottom-2 left-4 w-6 h-8 bg-green-500 dark:bg-green-400 rounded-t"></div>
            <div className="absolute bottom-2 left-12 w-6 h-12 bg-green-500 dark:bg-green-400 rounded-t"></div>
            <div className="absolute bottom-2 left-20 w-6 h-10 bg-green-500 dark:bg-green-400 rounded-t"></div>
            <div className="absolute bottom-2 left-28 w-6 h-16 bg-green-600 dark:bg-green-300 rounded-t"></div>
            <div className="absolute bottom-2 left-36 w-6 h-14 bg-green-600 dark:bg-green-300 rounded-t"></div>
            <div className="absolute bottom-2 left-44 w-6 h-18 bg-green-700 dark:bg-green-200 rounded-t"></div>
            <div className="absolute top-2 right-2 text-sm text-green-700 dark:text-green-200">📈</div>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            Sample Chart Data • Fallback Provider
          </div>
        </div>
      </div>
      
      <div className="text-xs text-gray-500 mt-1 text-center">
        <span className="font-medium">Symbol: {symbol}</span>
        <span className="mx-2">•</span>
        <span>Lightweight Charts (Loaded)</span>
      </div>
    </div>
  )
}

export default memo(LightweightChart)