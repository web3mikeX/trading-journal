"use client"

import { useState, useEffect } from "react"
import ChartWrapper from "@/components/ChartWrapper"

export default function PerformanceTest() {
  const [loadTimes, setLoadTimes] = useState<Record<string, number>>({})
  const [currentSymbol, setCurrentSymbol] = useState('NQ')
  const [startTime, setStartTime] = useState<number>(0)
  
  const symbols = ['NQ', 'ES', 'GC', 'CL']

  const measureLoadTime = (symbol: string) => {
    const start = performance.now()
    setStartTime(start)
    setCurrentSymbol(symbol)
  }

  const handleChartLoad = (symbol: string) => {
    if (startTime > 0) {
      const loadTime = performance.now() - startTime
      setLoadTimes(prev => ({ ...prev, [symbol]: loadTime }))
      console.log(`✅ Chart loaded for ${symbol} in ${loadTime.toFixed(0)}ms`)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Chart Loading Performance Test</h1>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Load Time Results</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {symbols.map(symbol => (
            <div key={symbol} className="p-3 bg-gray-100 dark:bg-gray-800 rounded">
              <div className="font-medium">{symbol}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {loadTimes[symbol] ? `${loadTimes[symbol].toFixed(0)}ms` : 'Not tested'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Test Different Symbols</h2>
        <div className="flex gap-2 mb-4">
          {symbols.map(symbol => (
            <button
              key={symbol}
              onClick={() => measureLoadTime(symbol)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Load {symbol}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">
          Current Chart: {currentSymbol}
          {loadTimes[currentSymbol] && (
            <span className="ml-2 text-sm text-green-600">
              (Loaded in {loadTimes[currentSymbol].toFixed(0)}ms)
            </span>
          )}
        </h3>
        
        <ChartWrapper
          key={currentSymbol} // Force remount for accurate timing
          symbol={currentSymbol}
          width={700}
          height={400}
          onLoad={() => handleChartLoad(currentSymbol)}
        />
      </div>

      <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
        <h3 className="font-medium mb-2">Performance Optimizations Applied:</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Reduced data from 30 days to 7 days for faster loading</li>
          <li>Optimized cache durations (5min for Yahoo Finance)</li>
          <li>Added 5-second timeout for API requests</li>
          <li>Streamlined loading states and UI</li>
          <li>Immediate chart rendering after data load</li>
        </ul>
      </div>
    </div>
  )
}