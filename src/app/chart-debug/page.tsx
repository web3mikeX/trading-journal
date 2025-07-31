"use client"

import { useState, useEffect } from "react"

const SimpleChart = () => {
  const [status, setStatus] = useState('Starting...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const testChart = async () => {
      try {
        setStatus('Testing API...')
        
        // Test the API first
        const response = await fetch('/api/enhanced-market-data?symbol=NQ&days=7&preferReal=true')
        const data = await response.json()
        
        if (data.error) {
          throw new Error(data.error)
        }
        
        setStatus(`API works! Got ${data.data.length} data points`)
        
        // Test lightweight-charts import
        setStatus('Loading chart library...')
        const charts = await import('lightweight-charts')
        setStatus('Chart library loaded successfully!')
        
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        setError(errorMsg)
        setStatus('Failed')
      }
    }
    
    testChart()
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Chart Debug Test</h1>
      
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded mb-4">
        <h3 className="font-semibold mb-2">Status:</h3>
        <p className={error ? 'text-red-600' : 'text-green-600'}>{status}</p>
        {error && (
          <div className="mt-2 text-red-600">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded">
        <h3 className="font-semibold mb-2">Test Steps:</h3>
        <ol className="list-decimal pl-5 space-y-1 text-sm">
          <li>Test enhanced market data API</li>
          <li>Test lightweight-charts library import</li>
          <li>Report results</li>
        </ol>
      </div>
    </div>
  )
}

export default function ChartDebugPage() {
  return <SimpleChart />
}