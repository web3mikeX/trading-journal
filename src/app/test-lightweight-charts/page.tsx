"use client"

import { useState, memo, useCallback } from "react"
import { useTheme } from "@/components/ThemeProvider"
import ChartWrapper from "@/components/ChartWrapper"
// import { useMarketData } from "@/hooks/useMarketData" // Removed for simplicity

const TEST_SYMBOLS = [
  'NQ', 'ES', 'RTY', 'YM', // Futures
  'QQQ', 'SPY', 'IWM', 'DIA', // ETFs
  'GC', 'CL', // Commodities
]

const SAMPLE_TRADES = [
  {
    id: '1',
    symbol: 'NQ',
    side: 'LONG' as const,
    entryDate: new Date('2025-01-15T09:30:00'),
    exitDate: new Date('2025-01-15T15:45:00'),
    entryPrice: 20100,
    exitPrice: 20250,  // Take profit hit - exact match
    quantity: 1,
    netPnL: 150,
    takeProfit: 20250,  // Take profit at exact exit price
    stopLoss: 20050  // Stop loss was lower
  },
  {
    id: '2',
    symbol: 'ES',
    side: 'SHORT' as const,
    entryDate: new Date('2025-01-16T10:15:00'),
    exitDate: new Date('2025-01-16T14:30:00'),
    entryPrice: 5050,
    exitPrice: 4980,  // Take profit hit - exact match
    quantity: 2,
    netPnL: 140,
    takeProfit: 4980,  // Take profit at exact exit price
    stopLoss: 5100  // Stop loss was higher
  },
  {
    id: '3',
    symbol: 'RTY',
    side: 'LONG' as const,
    entryDate: new Date('2025-01-17T11:00:00'),
    entryPrice: 2100,
    quantity: 1,
    // Open trade - no exit
  },
  {
    id: '4',
    symbol: 'NQ',
    side: 'LONG' as const,
    entryDate: new Date('2025-01-18T10:00:00'),
    exitDate: new Date('2025-01-18T12:30:00'),
    entryPrice: 20200,
    exitPrice: 20050,  // Stop loss hit - should align with red line
    quantity: 1,
    netPnL: -150,  // Loss trade
    stopLoss: 20050,  // Stop loss line should be visible at this price
    takeProfit: 20350  // Take profit line should be visible at this price
  },
  {
    id: '5',
    symbol: 'ES',
    side: 'SHORT' as const,
    entryDate: new Date('2025-01-19T11:15:00'),
    exitDate: new Date('2025-01-19T14:45:00'),
    entryPrice: 5000,
    exitPrice: 5080,  // Stop loss hit on short - exact match
    quantity: 1,
    netPnL: -80,  // Loss trade on short
    stopLoss: 5080,  // Stop loss at exact exit price
    takeProfit: 4950  // Take profit was lower
  },
  {
    id: '6',
    symbol: 'NQ',
    side: 'SHORT' as const,
    entryDate: new Date('2025-01-20T09:45:00'),
    exitDate: new Date('2025-01-20T13:15:00'),
    entryPrice: 20300,
    exitPrice: 20050,  // Profitable short - price dropped
    quantity: 1,
    netPnL: 250,  // Profit trade on short
    takeProfit: 20050
  },
  {
    id: '7',
    symbol: 'ES',
    side: 'LONG' as const,
    entryDate: new Date('2025-01-21T14:00:00'),
    exitDate: new Date('2025-01-21T15:30:00'),
    entryPrice: 4950,
    exitPrice: 4920,  // Manual exit at loss
    quantity: 1,
    netPnL: -30  // Loss but no stop loss hit - manual exit
    // No stopLoss or takeProfit - manual exit
  }
]

function TestLightweightCharts() {
  const { theme } = useTheme()
  const [selectedSymbol, setSelectedSymbol] = useState('NQ')
  const [selectedTrade, setSelectedTrade] = useState(SAMPLE_TRADES[0])
  const [showTradeMarkers, setShowTradeMarkers] = useState(true)
  const [preferRealData, setPreferRealData] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h')
  
  // Simplified - no market data hook for now
  const loading = false
  const error = null
  const isStale = false
  const dataSource = 'synthetic'
  const hasRealDataProxy = true
  const symbolExplanation = 'Using simplified chart for fast loading'

  // Memoize callbacks to prevent unnecessary re-renders
  const handleSymbolChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSymbol(e.target.value)
  }, [])

  const handleTradeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const trade = SAMPLE_TRADES.find(t => t.id === e.target.value)
    if (trade) {
      setSelectedTrade(trade)
      setSelectedSymbol(trade.symbol)
    }
  }, [])

  const handleRefresh = useCallback(() => {
    console.log('Refresh clicked - using simplified chart')
  }, [])

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            TradingView Lightweight Charts Test
          </h1>
          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Testing real market data integration with entry/exit visualization
          </p>
        </div>

        {/* Controls */}
        <div className={`mb-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Symbol Selection */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Symbol
              </label>
              <select
                value={selectedSymbol}
                onChange={handleSymbolChange}
                className={`w-full px-3 py-2 border rounded-md ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {TEST_SYMBOLS.map(symbol => (
                  <option key={symbol} value={symbol}>{symbol}</option>
                ))}
              </select>
            </div>

            {/* Trade Selection */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Sample Trade
              </label>
              <select
                value={selectedTrade.id}
                onChange={handleTradeChange}
                className={`w-full px-3 py-2 border rounded-md ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {SAMPLE_TRADES.map(trade => (
                  <option key={trade.id} value={trade.id}>
                    {trade.symbol} {trade.side} {trade.exitDate 
                      ? `(${trade.netPnL ? (trade.netPnL > 0 ? '+$' + trade.netPnL : '$' + trade.netPnL) : 'Closed'})` 
                      : '(Open)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Options */}
            <div className="flex flex-col gap-2">
              <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Options
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showTradeMarkers}
                  onChange={(e) => setShowTradeMarkers(e.target.checked)}
                  className="mr-2"
                />
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Show Trade Markers
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferRealData}
                  onChange={(e) => setPreferRealData(e.target.checked)}
                  className="mr-2"
                />
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Prefer Real Data
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Actions
              </label>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Refreshing...' : 'Refresh Data'}
              </button>
            </div>
          </div>
        </div>

        {/* Data Status */}
        <div className={`mb-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <h3 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Data Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Status:</span>
              <span className={`ml-2 ${loading ? 'text-yellow-500' : error ? 'text-red-500' : 'text-green-500'}`}>
                {loading ? 'Loading...' : error ? 'Error' : 'Ready'}
              </span>
            </div>
            <div>
              <span className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Data Source:</span>
              <span className={`ml-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                {dataSource || 'None'}
              </span>
            </div>
            <div>
              <span className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Real Data Available:</span>
              <span className={`ml-2 ${hasRealDataProxy ? 'text-green-500' : 'text-orange-500'}`}>
                {hasRealDataProxy ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Data Points:</span>
              <span className={`ml-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                10
              </span>
            </div>
          </div>
          {error && (
            <div className="mt-2 text-red-500 text-sm">
              Error: {error}
            </div>
          )}
          {symbolExplanation && (
            <div className="mt-2 text-blue-600 dark:text-blue-400 text-sm italic">
              {symbolExplanation}
            </div>
          )}
          {isStale && (
            <div className="mt-2 text-orange-500 text-sm">
              ⚠️ Data may be stale. Consider refreshing.
            </div>
          )}
        </div>

        {/* Chart */}
        <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <h3 className={`font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Chart: {selectedSymbol}
          </h3>
          
          <div className="flex justify-center">
            <ChartWrapper
              symbol={selectedSymbol}
              width={900}
              height={500}
              trade={selectedTrade}
              showTradeMarkers={showTradeMarkers}
              theme={theme}
              timeframe={selectedTimeframe}
              onTimeframeChange={setSelectedTimeframe}
            />
          </div>
        </div>

        {/* Trade Details */}
        {showTradeMarkers && selectedTrade && (
          <div className={`mt-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <h3 className={`font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Trade Details
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Symbol:</span>
                <span className={`ml-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  {selectedTrade.symbol}
                </span>
              </div>
              <div>
                <span className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Side:</span>
                <span className={`ml-2 ${selectedTrade.side === 'LONG' ? 'text-green-500' : 'text-red-500'}`}>
                  {selectedTrade.side}
                </span>
              </div>
              <div>
                <span className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Entry:</span>
                <span className={`ml-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  ${selectedTrade.entryPrice}
                </span>
              </div>
              <div>
                <span className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Exit:</span>
                <span className={`ml-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  {selectedTrade.exitPrice ? `$${selectedTrade.exitPrice}` : 'Open'}
                </span>
              </div>
              <div>
                <span className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Quantity:</span>
                <span className={`ml-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  {selectedTrade.quantity}
                </span>
              </div>
              <div>
                <span className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>P&L:</span>
                <span className={`ml-2 ${
                  selectedTrade.netPnL 
                    ? selectedTrade.netPnL > 0 ? 'text-green-500' : 'text-red-500'
                    : theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {selectedTrade.netPnL ? `$${selectedTrade.netPnL}` : 'Open'}
                </span>
              </div>
              <div>
                <span className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Entry Date:</span>
                <span className={`ml-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  {selectedTrade.entryDate.toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Exit Date:</span>
                <span className={`ml-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  {selectedTrade.exitDate ? selectedTrade.exitDate.toLocaleDateString() : 'Open'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(TestLightweightCharts)