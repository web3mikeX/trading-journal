"use client"

import dynamic from 'next/dynamic'

// Define the props interface manually to avoid circular dependency
interface ChartWrapperProps {
  symbol: string
  width: string | number
  height: string | number
  trade?: any
  theme?: string
  timeframe?: string
  showTradeMarkers?: boolean
  onLoad?: () => void
}

// Dynamic import with fallback options
const FastChart = dynamic(() => import('./FastChart'), { ssr: false })
const SimpleCanvasChart = dynamic(() => import('./SimpleCanvasChart'), { ssr: false })

export default function ChartWrapper({ 
  symbol, 
  width, 
  height, 
  trade, 
  showTradeMarkers = true,
  onLoad,
  ...props 
}: ChartWrapperProps) {
  // Convert width/height to numbers
  const numericWidth = typeof width === 'string' ? 
    (width === '100%' ? 800 : parseInt(width)) : width
  const numericHeight = typeof height === 'string' ? 
    (height.includes('vh') ? 400 : parseInt(height)) : height

  // For now, use SimpleCanvasChart as it's guaranteed to work
  return (
    <SimpleCanvasChart
      symbol={symbol}
      width={numericWidth}
      height={numericHeight}
      onLoad={() => {
        console.log(`✅ ChartWrapper: Canvas chart loaded for ${symbol}`)
        onLoad?.()
      }}
    />
  )
}