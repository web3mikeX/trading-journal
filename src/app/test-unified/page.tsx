"use client"

import { useState } from "react"
import UnifiedChart from "@/components/UnifiedChart"

export default function TestUnifiedPage() {
  const [selectedSymbol, setSelectedSymbol] = useState("NQ")
  
  const testSymbols = [
    { symbol: "NQ", name: "NASDAQ 100 Futures" },
    { symbol: "MNQ", name: "Micro NASDAQ 100 Futures" },
    { symbol: "ES", name: "S&P 500 Futures" },
    { symbol: "QQQ", name: "QQQ ETF" },
    { symbol: "EURUSD", name: "EUR/USD" },
    { symbol: "BTCUSD", name: "Bitcoin" }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Unified Chart Provider Test
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Symbol Selection
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {testSymbols.map((item) => (
              <button
                key={item.symbol}
                onClick={() => setSelectedSymbol(item.symbol)}
                className={`p-3 rounded-lg border transition-colors text-left ${
                  selectedSymbol === item.symbol
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-white">
                  {item.symbol}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {item.name}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Chart for {testSymbols.find(s => s.symbol === selectedSymbol)?.name}
          </h2>
          
          <div className="flex justify-center">
            <UnifiedChart
              symbol={selectedSymbol}
              width={800}
              height={400}
              interval="D"
              preferredProvider="tradingview"
              allowFallback={true}
              onProviderChange={(provider) => {
                console.log(`Switched to provider: ${provider}`)
              }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow mt-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            How it works
          </h3>
          
          <div className="space-y-4 text-gray-600 dark:text-gray-400">
            <div>
              <strong className="text-gray-900 dark:text-white">Automatic Fallbacks:</strong> 
              <span className="ml-2">
                Starts with TradingView → Falls back to Lightweight Charts → Falls back to Yahoo Finance
              </span>
            </div>
            
            <div>
              <strong className="text-gray-900 dark:text-white">Symbol Mapping:</strong> 
              <span className="ml-2">
                Automatically converts symbols for each provider (e.g., NQ → CME_MINI:NQ1! for TradingView, NQ=F for Yahoo)
              </span>
            </div>
            
            <div>
              <strong className="text-gray-900 dark:text-white">Manual Override:</strong> 
              <span className="ml-2">
                Use the provider buttons to manually switch between chart providers
              </span>
            </div>
            
            <div>
              <strong className="text-gray-900 dark:text-white">Error Handling:</strong> 
              <span className="ml-2">
                Failed providers are marked and avoided for subsequent charts
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}