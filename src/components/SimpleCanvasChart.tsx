"use client"

import { useEffect, useRef, useState } from "react"

interface SimpleCanvasChartProps {
  symbol: string
  width?: number
  height?: number
  onLoad?: () => void
}

export default function SimpleCanvasChart({
  symbol,
  width = 600,
  height = 400,
  onLoad
}: SimpleCanvasChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [status, setStatus] = useState('Loading...')
  const [error, setError] = useState<string>('')
  const [isClient, setIsClient] = useState(false)

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return
    let mounted = true
    
    const drawChart = async () => {
      try {
        if (!mounted) return
        
        setStatus('Fetching data...')
        
        // Add timeout to prevent hanging
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
        
        const response = await fetch(`/api/enhanced-market-data?symbol=${symbol}&days=7&preferReal=true`, {
          signal: controller.signal
        })
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          throw new Error(`API responded with ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        
        if (data.error) throw new Error(data.error)
        if (!mounted) return
        
        setStatus('Drawing chart...')
        
        const canvas = canvasRef.current
        if (!canvas) return
        
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        
        // Set canvas size
        canvas.width = width
        canvas.height = height
        
        // Clear canvas
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, width, height)
        
        // Draw border
        ctx.strokeStyle = '#e5e7eb'
        ctx.strokeRect(0, 0, width, height)
        
        const chartData = data.data
        if (!chartData || chartData.length === 0) {
          throw new Error(`No chart data received. Data: ${JSON.stringify(data)}`)
        }
        
        console.log(`✅ Canvas chart drawing ${chartData.length} data points for ${symbol}`)
        
        // Calculate price range
        const prices = chartData.flatMap((d: any) => [d.high, d.low])
        const minPrice = Math.min(...prices)
        const maxPrice = Math.max(...prices)
        const priceRange = maxPrice - minPrice
        
        // Chart dimensions
        const padding = 40
        const chartWidth = width - padding * 2
        const chartHeight = height - padding * 2
        
        // Draw candlesticks
        const candleWidth = chartWidth / chartData.length * 0.8
        
        chartData.forEach((item: any, index: number) => {
          const x = padding + (index * chartWidth / chartData.length) + (chartWidth / chartData.length - candleWidth) / 2
          
          // Calculate y positions
          const highY = padding + (maxPrice - item.high) / priceRange * chartHeight
          const lowY = padding + (maxPrice - item.low) / priceRange * chartHeight
          const openY = padding + (maxPrice - item.open) / priceRange * chartHeight
          const closeY = padding + (maxPrice - item.close) / priceRange * chartHeight
          
          const isGreen = item.close > item.open
          
          // Draw wick
          ctx.strokeStyle = isGreen ? '#22c55e' : '#ef4444'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(x + candleWidth / 2, highY)
          ctx.lineTo(x + candleWidth / 2, lowY)
          ctx.stroke()
          
          // Draw body
          ctx.fillStyle = isGreen ? '#22c55e' : '#ef4444'
          const bodyTop = Math.min(openY, closeY)
          const bodyHeight = Math.abs(closeY - openY)
          ctx.fillRect(x, bodyTop, candleWidth, Math.max(bodyHeight, 1))
        })
        
        // Draw price labels
        ctx.fillStyle = '#6b7280'
        ctx.font = '12px sans-serif'
        ctx.textAlign = 'right'
        
        // Max price
        ctx.fillText(maxPrice.toFixed(2), padding - 5, padding + 5)
        
        // Min price  
        ctx.fillText(minPrice.toFixed(2), padding - 5, padding + chartHeight)
        
        // Latest price
        const latest = chartData[chartData.length - 1]
        const latestY = padding + (maxPrice - latest.close) / priceRange * chartHeight
        ctx.fillStyle = latest.close > latest.open ? '#22c55e' : '#ef4444'
        ctx.fillText(latest.close.toFixed(2), padding - 5, latestY + 5)
        
        if (mounted) {
          setStatus('Complete')
          onLoad?.()
          console.log(`✅ Canvas chart drawn for ${symbol}`)
        }
        
      } catch (err) {
        if (mounted) {
          let msg = 'Chart failed'
          if (err instanceof Error) {
            if (err.name === 'AbortError') {
              msg = 'Request timeout - API took too long'
            } else {
              msg = err.message
            }
          }
          console.error(`❌ Canvas chart error for ${symbol}:`, err)
          setError(msg)
          setStatus('Error')
        }
      }
    }
    
    drawChart()
    
    return () => {
      mounted = false
    }
  }, [symbol, width, height, onLoad, isClient])

  if (!isClient) {
    return (
      <div 
        style={{ width: `${width}px`, height: `${height}px` }}
        className="flex items-center justify-center bg-gray-50 border rounded"
      >
        <div className="text-sm text-gray-600">Initializing...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div 
        style={{ width: `${width}px`, height: `${height}px` }}
        className="flex items-center justify-center bg-red-50 border border-red-200 rounded"
      >
        <div className="text-center text-red-600">
          <div>⚠️ {error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {status !== 'Complete' && (
        <div 
          style={{ width: `${width}px`, height: `${height}px` }}
          className="absolute inset-0 flex items-center justify-center bg-gray-50 border rounded z-10"
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <div className="text-sm text-gray-600">{status}</div>
          </div>
        </div>
      )}
      
      <canvas
        ref={canvasRef}
        style={{ width: `${width}px`, height: `${height}px` }}
        className="border border-gray-300 rounded"
      />
      
      <div className="text-xs text-gray-500 text-center mt-1">
        {symbol} • Canvas Chart
      </div>
    </div>
  )
}