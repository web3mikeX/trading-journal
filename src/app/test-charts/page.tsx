"use client"

import TradingViewChart from "@/components/TradingViewChart"
import InvestingChart from "@/components/InvestingChart"
import LightweightChart from "@/components/LightweightChart"

export default function TestChartsPage() {
  const testSymbols = [
    { symbol: "NASDAQ:QQQ", name: "QQQ ETF", yahooSymbol: "QQQ" },
    { symbol: "CME_MINI:NQ1!", name: "NQ Futures", yahooSymbol: "NQ=F" },
    { symbol: "CME_MINI:MNQ1!", name: "MNQ Micro Futures", yahooSymbol: "NQ=F" },
    { symbol: "CME_MINI:ES1!", name: "ES Futures", yahooSymbol: "ES=F" },
    { symbol: "FX:EURUSD", name: "EUR/USD", yahooSymbol: "EURUSD=X" },
    { symbol: "COINBASE:BTCUSD", name: "Bitcoin", yahooSymbol: "BTC-USD" }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Chart Provider Comparison Test
        </h1>
        
        <div className="space-y-12">
          {testSymbols.map((item, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                {item.name}
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* TradingView Chart */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
                    TradingView: {item.symbol}
                  </h3>
                  <TradingViewChart
                    symbol={item.symbol}
                    interval="D"
                    height={300}
                    allowSymbolChange={false}
                    hideTopToolbar={true}
                    hideSideToolbar={true}
                    className="rounded overflow-hidden"
                  />
                </div>

                {/* Yahoo Finance Chart */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
                    Yahoo Finance: {item.yahooSymbol}
                  </h3>
                  <InvestingChart
                    symbol={item.yahooSymbol}
                    width={350}
                    height={300}
                    interval="1D"
                    className="rounded overflow-hidden"
                  />
                </div>

                {/* Lightweight Chart */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
                    Lightweight: {item.yahooSymbol}
                  </h3>
                  <LightweightChart
                    symbol={item.yahooSymbol}
                    width={350}
                    height={300}
                    interval="1D"
                    className="rounded overflow-hidden"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}