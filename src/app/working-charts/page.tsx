"use client"

import { useState, useEffect } from "react"
import SimpleTestChart from "@/components/SimpleTestChart"

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

export default function WorkingChartsPage() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTrades() {
      try {
        const userId = 'cmcwu8b5m0001m17ilm0triy8'
        const response = await fetch(`/api/trades?userId=${userId}`)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(`API Error: ${errorData.error || 'Failed to fetch trades'}`)
        }
        
        const data = await response.json()
        const closedTrades = data
          .filter((trade: any) => trade.exitDate && trade.exitPrice)
          .slice(0, 3) // Just 3 trades for testing
        
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
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Working Charts Test</h1>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4">Loading trades...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Working Charts Test</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Working Charts - Simple Test</h1>
        
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h2 className="font-semibold text-green-800 mb-2">✅ Using Simple Charts</h2>
          <p className="text-sm text-green-700">
            These charts use the basic TradingView implementation that we confirmed is working.
          </p>
        </div>

        {trades.length === 0 ? (
          <div className="text-center py-12">
            <p>No trades found to display.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {trades.map((trade, index) => (
              <div key={trade.id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">
                    Trade #{index + 1}: {trade.symbol} {trade.side}
                  </h3>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
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
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <SimpleTestChart width={700} height={350} />
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Chart Status:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>✅ TradingView library: Working</li>
            <li>✅ Chart rendering: Working</li>
            <li>✅ Basic candlestick data: Working</li>
            <li>🔄 Next: Add trade markers and real market data</li>
          </ul>
        </div>
      </div>
    </div>
  )
}