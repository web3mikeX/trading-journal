"use client"

import { useState } from "react"
import FastLightweightChart from "@/components/FastLightweightChart"

export default function FastTest() {
  const [showChart, setShowChart] = useState(false)
  const [symbol, setSymbol] = useState('NQ')

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Fast Chart Test</h1>
      
      <div className="mb-4 space-x-2">
        <button 
          onClick={() => setShowChart(!showChart)}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
        >
          {showChart ? 'Hide' : 'Show'} Chart
        </button>
        
        <select 
          value={symbol} 
          onChange={(e) => setSymbol(e.target.value)}
          className="px-2 py-1 border rounded text-sm"
        >
          <option value="NQ">NQ</option>
          <option value="ES">ES</option>
        </select>
      </div>

      {showChart && (
        <div className="border p-2">
          <FastLightweightChart
            symbol={symbol}
            width={500}
            height={300}
            preferReal={true}
            showTradeMarkers={false}
          />
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500">
        Status: Chart {showChart ? 'visible' : 'hidden'} - Symbol: {symbol}
      </div>
    </div>
  )
}