"use client"

import { memo } from "react"
import ApexFinancialChart from "./ApexFinancialChart"
import LightweightChartReal from "./LightweightChartReal"

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
  lazy?: boolean // Add lazy loading option
  useRealData?: boolean // Option to use real market data
}

function TradeChart({
  trade,
  width = "100%",
  height = "65vh",
  className = "",
  lazy = true,
  useRealData = false
}: TradeChartProps) {
  
  // Convert width/height to numbers for LightweightChartReal
  const numericWidth = typeof width === 'string' ? 
    (width === '100%' ? 800 : parseInt(width)) : width
  const numericHeight = typeof height === 'string' ? 
    (height.includes('vh') ? 400 : parseInt(height)) : height

  if (useRealData) {
    // Use real market data with TradingView Lightweight Charts
    return (
      <LightweightChartReal
        symbol={trade.symbol}
        trade={trade}
        width={numericWidth}
        height={numericHeight}
        className={className}
        showTradeMarkers={true}
      />
    )
  }

  // Fallback to ApexFinancialChart with synthetic data
  return (
    <ApexFinancialChart
      trade={trade}
      width={width}
      height={height}
      className={className}
    />
  )
}

export default memo(TradeChart)