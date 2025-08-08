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
      
      // Generate enhanced sample candlestick data with realistic volatility
      const dataPoints = 30
      const padding = 40
      const chartWidth = width - padding * 2
      const chartHeight = height - padding * 2
      
      // Enhanced base prices and volatility
      const priceConfig = {
        'NQ': { base: 21500, vol: 0.035 },
        'MNQ': { base: 21500, vol: 0.035 },
        'MNQU5': { base: 22500, vol: 0.035 },
        'ES': { base: 6100, vol: 0.025 },
        'MES': { base: 6100, vol: 0.025 },
        'RTY': { base: 2350, vol: 0.045 },
        'GC': { base: 2650, vol: 0.030 },
        'CL': { base: 78, vol: 0.055 },
        'BTC': { base: 98000, vol: 0.065 },
        'ETH': { base: 3800, vol: 0.075 },
        'QQQ': { base: 525, vol: 0.028 },
        'SPY': { base: 610, vol: 0.020 },
        'VIX': { base: 14, vol: 0.15 }
      }
      
      // Get symbol config
      const baseSymbol = symbol.replace(/[HMU Z]\d{2}$/, '')
      const config = priceConfig[baseSymbol as keyof typeof priceConfig] || 
                    priceConfig[symbol as keyof typeof priceConfig] || 
                    { base: 1000, vol: 0.025 }
      
      let basePrice = config.base
      const volatility = config.vol
      
      const candleWidth = chartWidth / dataPoints * 0.75
      let trendDirection = (Math.random() - 0.5) * 0.3
      
      // Track price range for better scaling
      const prices: number[] = []
      
      for (let i = 0; i < dataPoints; i++) {
        // Enhanced price movement with trend and volatility clustering
        const trendMove = trendDirection * volatility * 0.5
        const randomMove = (Math.random() - 0.5) * volatility
        const totalMove = trendMove + randomMove
        
        const open = basePrice
        const close = basePrice * (1 + totalMove)
        
        // Create realistic intrabar range
        const rangeSize = volatility * basePrice * (0.5 + Math.random() * 0.8)
        const high = Math.max(open, close) + Math.random() * rangeSize * 0.6
        const low = Math.min(open, close) - Math.random() * rangeSize * 0.6
        
        prices.push(high, low, open, close)
        basePrice = close
        
        // Update trend with some persistence and mean reversion
        trendDirection = trendDirection * 0.8 + (Math.random() - 0.5) * 0.2
      }
      
      // Calculate dynamic price range for optimal scaling
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)
      const priceRange = maxPrice - minPrice
      const buffer = priceRange * 0.1 // 10% buffer
      const chartMinPrice = minPrice - buffer
      const chartMaxPrice = maxPrice + buffer
      const chartPriceRange = chartMaxPrice - chartMinPrice
      
      // Reset base price and trend for actual drawing
      basePrice = config.base
      trendDirection = (Math.random() - 0.5) * 0.3
      
      for (let i = 0; i < dataPoints; i++) {
        const x = padding + (i * chartWidth / dataPoints) + (chartWidth / dataPoints - candleWidth) / 2
        
        // Recreate the same price movement
        const trendMove = trendDirection * volatility * 0.5
        const randomMove = (Math.random() - 0.5) * volatility
        const totalMove = trendMove + randomMove
        
        const open = basePrice
        const close = basePrice * (1 + totalMove)
        
        const rangeSize = volatility * basePrice * (0.5 + Math.random() * 0.8)
        const high = Math.max(open, close) + Math.random() * rangeSize * 0.6
        const low = Math.min(open, close) - Math.random() * rangeSize * 0.6
        
        // Convert prices to screen coordinates
        const highY = padding + ((chartMaxPrice - high) / chartPriceRange) * chartHeight
        const lowY = padding + ((chartMaxPrice - low) / chartPriceRange) * chartHeight
        const openY = padding + ((chartMaxPrice - open) / chartPriceRange) * chartHeight
        const closeY = padding + ((chartMaxPrice - close) / chartPriceRange) * chartHeight
        
        const isGreen = close > open
        
        // Draw wick with better styling
        ctx.strokeStyle = isGreen ? '#10b981' : '#ef4444'
        ctx.lineWidth = Math.max(1, candleWidth * 0.1)
        ctx.beginPath()
        ctx.moveTo(x + candleWidth / 2, highY)
        ctx.lineTo(x + candleWidth / 2, lowY)
        ctx.stroke()
        
        // Draw body with proper hollow/filled candles
        const bodyTop = Math.min(openY, closeY)
        const bodyHeight = Math.max(Math.abs(closeY - openY), 1)
        
        if (isGreen) {
          // Green candle - hollow
          ctx.strokeStyle = '#10b981'
          ctx.lineWidth = 1
          ctx.strokeRect(x, bodyTop, candleWidth, bodyHeight)
        } else {
          // Red candle - filled
          ctx.fillStyle = '#ef4444'
          ctx.fillRect(x, bodyTop, candleWidth, bodyHeight)
        }
        
        basePrice = close
        trendDirection = trendDirection * 0.8 + (Math.random() - 0.5) * 0.2
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
        {symbol} • Enhanced Demo Chart ({dataPoints} candles)
      </div>
    </div>
  )
}