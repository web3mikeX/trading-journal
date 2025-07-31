"use client"

import { useState, useEffect } from "react"
import ChartWrapper from "@/components/ChartWrapper"

export default function SimpleChartTest() {
  const [showChart, setShowChart] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiData, setApiData] = useState<any>(null)

  // Test API first
  useEffect(() => {
    const testApi = async () => {
      try {
        const response = await fetch('/api/enhanced-market-data?symbol=NQ&days=7&preferReal=true')
        const data = await response.json()
        setApiData(data)
        console.log('API Response:', data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'API failed')
      }
    }
    testApi()
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Simple Chart Test</h1>
      
      <div className="mb-4">
        <h3 className="font-semibold">API Status:</h3>
        {error ? (
          <p className="text-red-600">Error: {error}</p>
        ) : apiData ? (
          <div className="text-green-600">
            <p>✅ API Working</p>
            <p>Data points: {apiData.data?.length || 0}</p>
            <p>Source: {apiData.dataSource}</p>
          </div>
        ) : (
          <p>Loading API...</p>
        )}
      </div>

      <div className="mb-4">
        <button 
          onClick={() => {
            console.log('Showing chart...')
            setShowChart(true)
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={!apiData}
        >
          Show Chart
        </button>
        
        {showChart && (
          <button 
            onClick={() => setShowChart(false)}
            className="ml-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Hide Chart
          </button>
        )}
      </div>

      {showChart && (
        <div className="border p-4 rounded">
          <h3 className="mb-2">Chart Container:</h3>
          <div style={{ width: '600px', height: '400px', border: '1px solid #ccc' }}>
            <ChartWrapper 
              symbol="NQ" 
              width={600} 
              height={400}
              onLoad={() => {
                console.log('✅ Chart loaded successfully!')
              }}
            />
          </div>
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-600">
        <p>This page tests:</p>
        <ul className="list-disc pl-5">
          <li>API connectivity ✅</li>
          <li>Chart component loading</li>
          <li>Data display</li>
        </ul>
      </div>
    </div>
  )
}