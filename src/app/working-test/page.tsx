"use client"

import { useState } from "react"
import ChartWrapper from "@/components/ChartWrapper"

export default function WorkingTest() {
  const [symbol, setSymbol] = useState('NQ')
  const [showChart, setShowChart] = useState(true)
  const [timeframe, setTimeframe] = useState('1h')

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Working Chart Test</h1>
      
      <div className="mb-4 flex gap-4 items-center">
        <select 
          value={symbol} 
          onChange={(e) => setSymbol(e.target.value)}
          className="px-3 py-2 border rounded"
        >
          <option value="NQ">NQ</option>
          <option value="ES">ES</option>
          <option value="SPY">SPY</option>
        </select>
        
        <button 
          onClick={() => setShowChart(!showChart)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {showChart ? 'Hide' : 'Show'} Chart
        </button>
      </div>

      {showChart && (
        <div className="border p-4 rounded bg-gray-50">
          <ChartWrapper 
            symbol={symbol} 
            width={700} 
            height={400} 
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
          />
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-600">
        This should load a working TradingView chart instantly.
      </div>
    </div>
  )
}