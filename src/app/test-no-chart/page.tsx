"use client"

import { useState } from "react"

export default function TestNoChart() {
  const [symbol, setSymbol] = useState('NQ')
  const [loading, setLoading] = useState(false)

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 1000)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Without Chart Component</h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Symbol</label>
            <select 
              value={symbol} 
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="NQ">NQ</option>
              <option value="ES">ES</option>
              <option value="SPY">SPY</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <div className={`px-3 py-2 rounded ${loading ? 'bg-yellow-100' : 'bg-green-100'}`}>
              {loading ? 'Loading...' : 'Ready'}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Action</label>
            <button 
              onClick={handleRefresh}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      <div className="border border-dashed border-gray-300 p-8 text-center">
        <h3 className="text-lg font-medium mb-2">Chart Area (Disabled)</h3>
        <p className="text-gray-600">
          This would normally show a chart for {symbol}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          If this page loads quickly, the issue is in the chart component.
        </p>
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded">
        <h4 className="font-medium">Debug Info:</h4>
        <ul className="text-sm mt-2 space-y-1">
          <li>Symbol: {symbol}</li>
          <li>Loading: {loading ? 'Yes' : 'No'}</li>
          <li>Timestamp: {new Date().toLocaleTimeString()}</li>
          <li>Page rendered successfully without chart component</li>
        </ul>
      </div>
    </div>
  )
}