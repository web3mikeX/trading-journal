"use client"

import { useEffect, useRef, useState } from "react"

interface InstantChartProps {
  symbol: string
  width?: number
  height?: number
  onLoad?: () => void
}

export default function InstantChart({
  symbol,
  width = 600,
  height = 400,
  onLoad
}: InstantChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return
    
    const drawInstantChart = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      canvas.width = width
      canvas.height = height
      
      // Clear with white background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)
      
      // Draw border
      ctx.strokeStyle = '#e5e7eb'
      ctx.strokeRect(0, 0, width, height)
      
      // Generate sample candlestick data instantly
      const dataPoints = 20
      const padding = 40
      const chartWidth = width - padding * 2
      const chartHeight = height - padding * 2
      
      // Generate synthetic price data
      let basePrice = symbol.includes('NQ') ? 20000 : 
                      symbol.includes('ES') ? 5000 : 
                      symbol.includes('GC') ? 2000 : 100
      
      const candleWidth = chartWidth / dataPoints * 0.8
      
      for (let i = 0; i < dataPoints; i++) {
        const x = padding + (i * chartWidth / dataPoints) + (chartWidth / dataPoints - candleWidth) / 2
        
        // Create realistic price movement
        const variation = basePrice * 0.002 // 0.2% variation
        const trend = (Math.random() - 0.5) * variation
        basePrice += trend
        
        const open = basePrice + (Math.random() - 0.5) * variation
        const close = basePrice + (Math.random() - 0.5) * variation
        const high = Math.max(open, close) + Math.random() * variation
        const low = Math.min(open, close) - Math.random() * variation
        
        // Normalize to chart area
        const priceRange = basePrice * 0.05 // 5% range
        const minPrice = basePrice - priceRange / 2
        const maxPrice = basePrice + priceRange / 2
        
        const highY = padding + (maxPrice - high) / priceRange * chartHeight
        const lowY = padding + (maxPrice - low) / priceRange * chartHeight
        const openY = padding + (maxPrice - open) / priceRange * chartHeight
        const closeY = padding + (maxPrice - close) / priceRange * chartHeight
        
        const isGreen = close > open
        
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
      }
      
      // Draw labels
      ctx.fillStyle = '#6b7280'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(symbol, width / 2, height - 10)
      
      console.log(`✅ Instant chart drawn for ${symbol}`)
      onLoad?.()
    }
    
    // Draw immediately
    drawInstantChart()
  }, [symbol, width, height, onLoad, isClient])

  if (!isClient) {
    return (
      <div 
        style={{ width: `${width}px`, height: `${height}px` }}
        className="flex items-center justify-center bg-gray-50 border rounded"
      >
        <div className="text-sm text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        style={{ width: `${width}px`, height: `${height}px` }}
        className="border border-gray-300 rounded"
      />
      
      <div className="text-xs text-gray-500 text-center mt-1">
        {symbol} • Instant Chart (Synthetic Data)
      </div>
    </div>
  )
}