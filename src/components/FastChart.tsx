"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "@/components/ThemeProvider"

interface FastChartProps {
  symbol: string
  width?: number
  height?: number
  onLoad?: () => void
}

export default function FastChart({
  symbol,
  width = 600,
  height = 400,
  onLoad
}: FastChartProps) {
  const { theme } = useTheme()
  const chartRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    let mounted = true
    
    const loadChart = async () => {
      try {
        if (!mounted) return
        
        // Fetch data and create chart in parallel
        const [dataResponse, chartsModule] = await Promise.all([
          fetch(`/api/enhanced-market-data?symbol=${symbol}&days=7&preferReal=true`),
          import('lightweight-charts')
        ])
        
        if (!mounted) return
        
        const data = await dataResponse.json()
        if (data.error) throw new Error(data.error)
        
        if (!chartRef.current || !mounted) return
        
        // Create chart immediately
        const chart = chartsModule.createChart(chartRef.current, {
          width,
          height,
          layout: {
            background: { type: 'solid', color: theme === 'dark' ? '#1f2937' : '#ffffff' },
            textColor: theme === 'dark' ? '#f9fafb' : '#1f2937',
          },
          grid: {
            vertLines: { color: theme === 'dark' ? '#374151' : '#e5e7eb' },
            horzLines: { color: theme === 'dark' ? '#374151' : '#e5e7eb' },
          },
          timeScale: { borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' },
          rightPriceScale: { borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' },
        })
        
        const series = chart.addCandlestickSeries({
          upColor: '#22c55e',
          downColor: '#ef4444',
          borderDownColor: '#ef4444',
          borderUpColor: '#22c55e',
          wickDownColor: '#ef4444',
          wickUpColor: '#22c55e',
        })
        
        // Convert data format
        const chartData = data.data.map((item: any) => ({
          time: Math.floor(item.timestamp / 1000),
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
        }))
        
        series.setData(chartData)
        chart.timeScale().fitContent()
        
        if (mounted) {
          setStatus('success')
          onLoad?.()
          console.log(`✅ FastChart loaded for ${symbol} with ${chartData.length} points`)
        }
        
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Chart failed')
          setStatus('error')
        }
      }
    }
    
    loadChart()
    
    return () => {
      mounted = false
    }
  }, [symbol, theme, width, height, onLoad])

  if (status === 'error') {
    return (
      <div 
        style={{ width: `${width}px`, height: `${height}px` }}
        className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded border"
      >
        <div className="text-center text-red-600">
          <div>⚠️ Chart Error</div>
          <div className="text-sm">{error}</div>
        </div>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div 
        style={{ width: `${width}px`, height: `${height}px` }}
        className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded border"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Loading {symbol}...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div 
        ref={chartRef}
        style={{ width: `${width}px`, height: `${height}px` }}
        className="rounded border border-gray-300 dark:border-gray-600"
      />
      <div className="text-xs text-gray-500 text-center mt-1">
        {symbol} • Live Market Data
      </div>
    </div>
  )
}