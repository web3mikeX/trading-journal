"use client"

import { useState, useEffect } from "react"
import SimpleCanvasChart from "@/components/SimpleCanvasChart"

export default function ChartDiagnostic() {
  const [apiStatus, setApiStatus] = useState<'testing' | 'success' | 'error'>('testing')
  const [apiData, setApiData] = useState<any>(null)
  const [apiError, setApiError] = useState<string>('')
  const [chartStatus, setChartStatus] = useState<'waiting' | 'loading' | 'success' | 'error'>('waiting')
  const [chartError, setChartError] = useState<string>('')
  const [logs, setLogs] = useState<string[]>([])

  const symbol = 'NQ'

  // Capture console logs
  useEffect(() => {
    const originalLog = console.log
    const originalError = console.error
    
    console.log = (...args) => {
      setLogs(prev => [...prev, `LOG: ${args.join(' ')}`])
      originalLog(...args)
    }
    
    console.error = (...args) => {
      setLogs(prev => [...prev, `ERROR: ${args.join(' ')}`])
      originalError(...args)
    }
    
    return () => {
      console.log = originalLog
      console.error = originalError
    }
  }, [])

  // Test API first
  useEffect(() => {
    const testApi = async () => {
      try {
        setApiStatus('testing')
        const response = await fetch(`/api/enhanced-market-data?symbol=${symbol}&days=7&preferReal=true`)
        const data = await response.json()
        
        if (data.error) {
          throw new Error(data.error)
        }
        
        setApiData(data)
        setApiStatus('success')
        console.log('✅ API test successful')
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'API failed'
        setApiError(msg)
        setApiStatus('error')
        console.error('❌ API test failed:', err)
      }
    }
    
    testApi()
  }, [])

  const handleChartLoad = () => {
    setChartStatus('success')
    console.log('✅ Chart load callback triggered')
  }

  const startChartTest = () => {
    setChartStatus('loading')
    setChartError('')
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔍 Chart Diagnostic Tool</h1>
      
      {/* API Status */}
      <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">1. API Test</h2>
        <div className={`text-sm ${
          apiStatus === 'success' ? 'text-green-600' : 
          apiStatus === 'error' ? 'text-red-600' : 'text-blue-600'
        }`}>
          Status: {apiStatus.toUpperCase()}
        </div>
        {apiError && <div className="text-red-600 text-sm mt-1">Error: {apiError}</div>}
        {apiData && (
          <div className="mt-2 text-sm">
            <div>Symbol: {apiData.symbol}</div>
            <div>Data points: {apiData.data?.length || 0}</div>
            <div>Source: {apiData.dataSource}</div>
          </div>
        )}
      </div>

      {/* Chart Test */}
      <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">2. Chart Test</h2>
        <div className="mb-3">
          <button
            onClick={startChartTest}
            disabled={apiStatus !== 'success'}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            Test Canvas Chart
          </button>
        </div>
        
        <div className={`text-sm mb-3 ${
          chartStatus === 'success' ? 'text-green-600' : 
          chartStatus === 'error' ? 'text-red-600' : 'text-blue-600'
        }`}>
          Chart Status: {chartStatus.toUpperCase()}
        </div>
        
        {chartError && <div className="text-red-600 text-sm mb-3">Error: {chartError}</div>}
        
        {chartStatus === 'loading' && (
          <div className="border p-2 rounded">
            <SimpleCanvasChart
              key={Date.now()} // Force remount
              symbol={symbol}
              width={400}
              height={250}
              onLoad={handleChartLoad}
            />
          </div>
        )}
      </div>

      {/* Console Logs */}
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">3. Console Logs</h2>
        <div className="bg-black text-green-400 p-3 rounded text-xs font-mono max-h-60 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-gray-500">No logs yet...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">{log}</div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Instructions:</strong></p>
        <ol className="list-decimal pl-5 mt-2 space-y-1">
          <li>Wait for API test to complete</li>
          <li>Click "Test Canvas Chart" button</li>
          <li>Watch the status indicators and console logs</li>
          <li>If chart fails, check the error messages</li>
        </ol>
      </div>
    </div>
  )
}