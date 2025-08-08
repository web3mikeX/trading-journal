"use client"

import { useState, useEffect } from "react"
import { useTheme } from "@/components/ThemeProvider"
import SmartChartSelector from "@/components/SmartChartSelector"
import TradingViewSubscriptionChart from "@/components/TradingViewSubscriptionChart"
import TradingViewWithTradeMarkers from "@/components/TradingViewWithTradeMarkers"
import { 
  getTradingViewConfig, 
  getConfigSummary, 
  validateTradingViewConfig 
} from "@/lib/tradingViewConfig"
import { 
  getTradingViewSymbol, 
  getSupportedSymbols, 
  validateTradingViewSymbol,
  autoDetectTradingViewSymbol 
} from "@/lib/tradingViewSymbolMapping"

// Mock trade data for testing
const MOCK_TRADES = [
  {
    id: '1',
    symbol: 'NQ',
    side: 'LONG' as const,
    entryDate: new Date('2025-01-31T10:30:00-05:00'), // Today 10:30 AM EST
    exitDate: new Date('2025-01-31T14:15:00-05:00'),  // Today 2:15 PM EST
    entryPrice: 21485.75,
    exitPrice: 21523.25,
    quantity: 2,
    netPnL: 1500.00,
    contractMultiplier: 20
  },
  {
    id: '2',
    symbol: 'ES',
    side: 'SHORT' as const,
    entryDate: new Date('2025-01-31T09:45:00-05:00'), // Today 9:45 AM EST
    exitDate: new Date('2025-01-31T11:30:00-05:00'),  // Today 11:30 AM EST
    entryPrice: 6102.50,
    exitPrice: 6089.75,
    quantity: 1,
    netPnL: 637.50,
    contractMultiplier: 50
  },
  {
    id: '3',
    symbol: 'GC',
    side: 'LONG' as const,
    entryDate: new Date('2025-01-31T13:20:00-05:00'), // Today 1:20 PM EST
    exitDate: undefined, // Still open
    entryPrice: 2658.40,
    exitPrice: undefined,
    quantity: 1,
    netPnL: undefined,
    contractMultiplier: 100
  }
]

const TEST_SYMBOLS = ['NQ', 'ES', 'RTY', 'GC', 'CL', 'BTC', 'SPY', 'QQQ']
const TEST_INTERVALS = ['1m', '5m', '15m', '1h', '4h', '1d', '1w']

export default function TestTradingViewSubscriptionPage() {
  const { theme } = useTheme()
  const [selectedSymbol, setSelectedSymbol] = useState('NQ')
  const [selectedInterval, setSelectedInterval] = useState('1d')
  const [selectedTrade, setSelectedTrade] = useState(MOCK_TRADES[0])
  const [showTradeMarkers, setShowTradeMarkers] = useState(true)
  const [testResults, setTestResults] = useState<{
    configValid: boolean
    symbolSupport: boolean
    tradingViewMapping: any
    errors: string[]
    warnings: string[]
  } | null>(null)

  // Run tests on component mount
  useEffect(() => {
    runTradingViewTests()
  }, [selectedSymbol])

  const runTradingViewTests = () => {
    console.log('🧪 Running TradingView subscription tests...')
    
    // Test 1: Configuration validation
    const configValidation = validateTradingViewConfig()
    
    // Test 2: Symbol mapping validation
    const symbolValidation = validateTradingViewSymbol(selectedSymbol)
    
    // Test 3: Auto-detection test
    const autoDetection = autoDetectTradingViewSymbol(selectedSymbol)
    
    // Test 4: Real-time support check
    const mapping = getTradingViewSymbol(selectedSymbol)
    
    const results = {
      configValid: configValidation.isValid,
      symbolSupport: symbolValidation.isValid,
      tradingViewMapping: mapping,
      errors: [...configValidation.errors, ...symbolValidation.errors],
      warnings: [...configValidation.recommendations, ...symbolValidation.warnings]
    }
    
    setTestResults(results)
    
    console.log('📊 Test Results:', results)
    
    if (mapping) {
      console.log(`✅ ${selectedSymbol} maps to ${mapping.tradingViewSymbol}`)
      console.log(`📈 Exchange: ${mapping.exchange}, Asset Class: ${mapping.assetClass}`)
    }
  }

  const handleSymbolChange = (symbol: string) => {
    setSelectedSymbol(symbol)
    
    // Update selected trade to match symbol if available
    const matchingTrade = MOCK_TRADES.find(trade => trade.symbol === symbol)
    if (matchingTrade) {
      setSelectedTrade(matchingTrade)
    }
  }

  const config = getTradingViewConfig()
  const configSummary = getConfigSummary()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🔧 TradingView Subscription Integration Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test real-time TradingView charts with your subscription data and precise trade correlation
          </p>
        </div>

        {/* Configuration Status */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              Subscription Status
            </div>
            <div className={`text-lg font-bold ${configSummary.enabled ? 'text-green-600' : 'text-red-600'}`}>
              {configSummary.enabled ? '✅ Enabled' : '❌ Disabled'}
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              Features
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {configSummary.features.join(', ') || 'None'}
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              Data Providers
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {configSummary.dataProviders.join(' → ')}
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              Performance
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {configSummary.performance}
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Test Configuration
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Symbol Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Symbol
              </label>
              <select
                value={selectedSymbol}
                onChange={(e) => handleSymbolChange(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {TEST_SYMBOLS.map(symbol => (
                  <option key={symbol} value={symbol}>
                    {symbol}
                  </option>
                ))}
              </select>
            </div>

            {/* Interval Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Interval
              </label>
              <select
                value={selectedInterval}
                onChange={(e) => setSelectedInterval(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {TEST_INTERVALS.map(interval => (
                  <option key={interval} value={interval}>
                    {interval.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Trade Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Test Trade
              </label>
              <select
                value={selectedTrade.id}
                onChange={(e) => {
                  const trade = MOCK_TRADES.find(t => t.id === e.target.value)
                  if (trade) {
                    setSelectedTrade(trade)
                    setSelectedSymbol(trade.symbol)
                  }
                }}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {MOCK_TRADES.map(trade => (
                  <option key={trade.id} value={trade.id}>
                    {trade.symbol} {trade.side} ${trade.entryPrice}
                  </option>
                ))}
              </select>
            </div>

            {/* Options */}
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showTradeMarkers}
                  onChange={(e) => setShowTradeMarkers(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Trade Markers
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Test Results */}
        {testResults && (
          <div className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              🧪 Test Results for {selectedSymbol}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Configuration Tests */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Configuration Tests
                </h3>
                <div className={`p-3 rounded ${testResults.configValid ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                  <div className={`font-medium ${testResults.configValid ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'}`}>
                    {testResults.configValid ? '✅ Configuration Valid' : '❌ Configuration Issues'}
                  </div>
                  {testResults.errors.length > 0 && (
                    <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                      Errors: {testResults.errors.join(', ')}
                    </div>
                  )}
                  {testResults.warnings.length > 0 && (
                    <div className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
                      Warnings: {testResults.warnings.join(', ')}
                    </div>
                  )}
                </div>
              </div>

              {/* Symbol Support Tests */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Symbol Support Tests
                </h3>
                <div className={`p-3 rounded ${testResults.symbolSupport ? 'bg-green-50 dark:bg-green-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'}`}>
                  <div className={`font-medium ${testResults.symbolSupport ? 'text-green-800 dark:text-green-400' : 'text-yellow-800 dark:text-yellow-400'}`}>
                    {testResults.symbolSupport ? '✅ TradingView Support' : '⚠️ Limited Support'}
                  </div>
                  {testResults.tradingViewMapping && (
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Maps to: {testResults.tradingViewMapping.tradingViewSymbol}<br/>
                      Exchange: {testResults.tradingViewMapping.exchange}<br/>
                      Type: {testResults.tradingViewMapping.assetClass}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live Chart Tests */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            📈 Live Chart Tests
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Smart Chart Selector Test */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                🎯 Smart Chart Selector
              </h3>
              <SmartChartSelector
                symbol={selectedSymbol}
                trade={selectedTrade}
                width={600}
                height={400}
                interval={selectedInterval}
                showTradeMarkers={showTradeMarkers}
                preferRealData={true}
                autoFallback={true}
                showProviderInfo={true}
              />
            </div>

            {/* Direct TradingView Test */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                📊 Direct TradingView Widget
              </h3>
              <TradingViewSubscriptionChart
                symbol={selectedSymbol}
                trade={selectedTrade}
                width={600}
                height={400}
                interval={selectedInterval}
                showTradeMarkers={showTradeMarkers}
              />
            </div>
          </div>
        </div>

        {/* Trade Correlation Test */}
        <div className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            🎯 Trade Correlation Test
          </h2>
          
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
            <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              Selected Trade Details
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-blue-700 dark:text-blue-300">
                  <strong>Symbol:</strong> {selectedTrade.symbol}
                </div>
                <div className="text-blue-700 dark:text-blue-300">
                  <strong>Side:</strong> {selectedTrade.side}
                </div>
                <div className="text-blue-700 dark:text-blue-300">
                  <strong>Entry:</strong> ${selectedTrade.entryPrice} on {selectedTrade.entryDate.toLocaleString()}
                </div>
              </div>
              <div>
                {selectedTrade.exitPrice && selectedTrade.exitDate && (
                  <div className="text-blue-700 dark:text-blue-300">
                    <strong>Exit:</strong> ${selectedTrade.exitPrice} on {selectedTrade.exitDate.toLocaleString()}
                  </div>
                )}
                <div className="text-blue-700 dark:text-blue-300">
                  <strong>Quantity:</strong> {selectedTrade.quantity}
                </div>
                {selectedTrade.netPnL !== undefined && (
                  <div className={`${selectedTrade.netPnL >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                    <strong>P&L:</strong> {selectedTrade.netPnL >= 0 ? '+' : ''}${selectedTrade.netPnL.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Advanced Chart with Trade Markers */}
          <TradingViewWithTradeMarkers
            symbol={selectedSymbol}
            trade={selectedTrade}
            width={800}
            height={500}
            interval={selectedInterval}
            showTradeMarkers={showTradeMarkers}
            allowSymbolChange={false}
            hideTopToolbar={false}
            hideSideToolbar={false}
            onLoad={() => console.log('Advanced chart loaded')}
            onTradeMarkersReady={() => console.log('Trade markers ready for correlation test')}
          />
        </div>

        {/* Supported Symbols */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            📋 Supported Symbols
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 text-sm">
            {getSupportedSymbols().slice(0, 48).map(symbol => {
              const mapping = getTradingViewSymbol(symbol)
              return (
                <div 
                  key={symbol}
                  className={`p-2 rounded border cursor-pointer transition-colors ${
                    selectedSymbol === symbol
                      ? 'bg-blue-100 border-blue-300 text-blue-900 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-400'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                  onClick={() => handleSymbolChange(symbol)}
                >
                  <div className="font-medium">{symbol}</div>
                  <div className="text-xs opacity-75">
                    {mapping?.exchange || 'N/A'}
                  </div>
                </div>
              )
            })}
          </div>
          
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
            Showing 48 of {getSupportedSymbols().length} supported symbols. 
            Click any symbol to test TradingView integration.
          </div>
        </div>

      </div>
    </div>
  )
}