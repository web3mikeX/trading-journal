"use client"

import { useState } from "react"
import FastChart from "@/components/FastChart"

export default function FastChartTest() {
  const [symbol, setSymbol] = useState('NQ')
  const [loadTime, setLoadTime] = useState<number | null>(null)
  const [startTime, setStartTime] = useState<number>(0)

  const symbols = ['NQ', 'ES', 'GC', 'CL']

  const handleSymbolChange = (newSymbol: string) => {
    setStartTime(performance.now())
    setLoadTime(null)
    setSymbol(newSymbol)
  }

  const handleChartLoad = () => {
    if (startTime > 0) {
      const duration = performance.now() - startTime
      setLoadTime(duration)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">⚡ Fast Chart Test</h1>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Symbol Selection</h3>
        <div className="flex gap-2">
          {symbols.map(s => (
            <button
              key={s}
              onClick={() => handleSymbolChange(s)}
              className={`px-4 py-2 rounded transition-colors ${
                symbol === s 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        
        {loadTime && (
          <div className="mt-2 text-green-600 font-medium">
            ✅ Loaded in {Math.round(loadTime)}ms
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">
          Chart: {symbol}
        </h3>
        
        <FastChart
          key={symbol} // Force remount for timing
          symbol={symbol}
          width={700}
          height={400}
          onLoad={handleChartLoad}
        />
      </div>

      <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
        <h3 className="font-medium mb-2">FastChart Optimizations:</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Parallel data fetching and library loading</li>
          <li>Immediate chart creation after data load</li>
          <li>Simplified component lifecycle</li>
          <li>No complex state management</li>
          <li>Direct chart rendering without delays</li>
        </ul>
      </div>
    </div>
  )
}