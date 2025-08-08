"use client"

import { useState, useEffect } from "react"
import WorkingChartNew from "@/components/WorkingChartNew"

interface Trade {
  id: string
  symbol: string
  side: 'LONG' | 'SHORT'
  entryDate: Date
  exitDate?: Date
  entryPrice: number
  exitPrice?: number
  quantity: number
  netPnL?: number
}

export default function TestEnhancedChartsPage() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTrades() {
      try {
        // Use the first user from database for testing
        const userId = 'cmcwu8b5m0001m17ilm0triy8'
        
        // Fetch trades for this user
        const response = await fetch(`/api/trades?userId=${userId}`)
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(`API Error: ${errorData.error || 'Failed to fetch trades'}`)
        }
        
        const data = await response.json()
        
        // Take only the first 5 closed trades for testing
        const closedTrades = data
          .filter((trade: any) => trade.exitDate && trade.exitPrice)
          .slice(0, 5)
        
        const tradesWithDates = closedTrades.map((trade: any) => ({
          ...trade,
          entryDate: new Date(trade.entryDate),
          exitDate: trade.exitDate ? new Date(trade.exitDate) : null
        }))
        
        setTrades(tradesWithDates)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchTrades()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
            Enhanced Charts Test
          </h1>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading trades...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
            Enhanced Charts Test
          </h1>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Error</h2>
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
          Enhanced Charts Test - Real Trade Data
        </h1>
        
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h2 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Testing Features:</h2>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Real-time market data integration with precise trade date matching</li>
            <li>• Candlestick patterns that align with actual trade execution times</li>
            <li>• Entry/exit markers with precise timestamps and P&L calculations</li>
            <li>• Trade duration indicators and chart focusing on trade timeframes</li>
            <li>• Enhanced synthetic data generation when real data is unavailable</li>
          </ul>
        </div>

        {trades.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">No trades found to test with.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {trades.map((trade, index) => (
              <div key={trade.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Trade #{index + 1}: {trade.symbol} {trade.side}
                  </h3>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>Entry: ${trade.entryPrice} @ {trade.entryDate.toLocaleString()}</span>
                    {trade.exitPrice && trade.exitDate && (
                      <span>Exit: ${trade.exitPrice} @ {trade.exitDate.toLocaleString()}</span>
                    )}
                    <span>Qty: {trade.quantity}</span>
                    {trade.netPnL && (
                      <span className={trade.netPnL >= 0 ? 'text-green-600' : 'text-red-600'}>
                        P&L: ${trade.netPnL.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <WorkingChartNew
                    symbol={trade.symbol}
                    trade={trade}
                    width={800}
                    height={400}
                    showTradeMarkers={true}
                    preferReal={true}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Chart Enhancements Implemented:</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <h4 className="font-medium mb-1">Market Data:</h4>
              <ul className="space-y-1">
                <li>• Trade-specific timeframe generation</li>
                <li>• Price ranges that include actual trade prices</li>
                <li>• Weekend filtering for financial markets</li>
                <li>• Realistic volatility by asset class</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-1">Visual Enhancements:</h4>
              <ul className="space-y-1">
                <li>• Precise entry/exit timestamps in markers</li>
                <li>• Trade duration calculations and display</li>
                <li>• Automatic chart focusing on trade period</li>
                <li>• Professional color coding for profit/loss</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}