"use client"

import { useState, useEffect } from "react"

export default function MinimalTest() {
  const [status, setStatus] = useState('Starting...')
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [step, setStep] = useState(1)

  useEffect(() => {
    const test = async () => {
      try {
        // Step 1: Test API
        setStep(1)
        setStatus('Testing API...')
        
        const response = await fetch('/api/enhanced-market-data?symbol=NQ&days=7&preferReal=true')
        const apiData = await response.json()
        
        if (apiData.error) throw new Error(apiData.error)
        
        setData(apiData)
        setStatus(`✅ API Works! Got ${apiData.data.length} points`)
        
        // Step 2: Test lightweight-charts import
        setStep(2)
        setStatus('Testing chart library import...')
        
        const charts = await import('lightweight-charts')
        setStatus('✅ Library imported!')
        
        // Step 3: Test chart creation
        setStep(3)
        setStatus('Testing chart creation...')
        
        // Create a temporary div for testing
        const tempDiv = document.createElement('div')
        tempDiv.style.width = '400px'
        tempDiv.style.height = '300px'
        document.body.appendChild(tempDiv)
        
        const chart = charts.createChart(tempDiv, {
          width: 400,
          height: 300,
        })
        
        setStatus('✅ Chart created!')
        
        // Step 4: Test adding series
        setStep(4)
        setStatus('Testing series creation...')
        
        const series = chart.addCandlestickSeries({
          upColor: '#22c55e',
          downColor: '#ef4444',
        })
        
        setStatus('✅ Series created!')
        
        // Step 5: Test data format
        setStep(5)
        setStatus('Testing data conversion...')
        
        const chartData = apiData.data.slice(0, 3).map((item: any) => ({
          time: Math.floor(item.timestamp / 1000),
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
        }))
        
        setStatus(`✅ Data converted! Sample: ${JSON.stringify(chartData[0])}`)
        
        // Step 6: Test setting data
        setStep(6)
        setStatus('Testing data setting...')
        
        series.setData(chartData)
        setStatus('✅ Data set successfully!')
        
        // Cleanup
        chart.remove()
        document.body.removeChild(tempDiv)
        
        setStep(7)
        setStatus('🎉 All tests passed! Chart library is working.')
        
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        setError(`Step ${step} failed: ${msg}`)
        setStatus('❌ Test failed')
      }
    }
    
    test()
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Minimal Chart Test</h1>
      
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded mb-4">
        <h3 className="font-semibold mb-2">Current Step: {step}/7</h3>
        <p className={error ? 'text-red-600' : 'text-blue-600'}>{status}</p>
        {error && (
          <div className="mt-2 text-red-600 bg-red-100 p-2 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      {data && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded mb-4">
          <h3 className="font-semibold mb-2">API Data Sample:</h3>
          <div className="text-sm">
            <p>Symbol: {data.symbol}</p>
            <p>Source: {data.dataSource}</p>
            <p>Points: {data.data.length}</p>
            <p>Latest Price: ${data.data[data.data.length - 1]?.close}</p>
          </div>
        </div>
      )}

      <div className="text-sm text-gray-600">
        <h3 className="font-semibold mb-2">Test Steps:</h3>
        <ol className="list-decimal pl-5 space-y-1">
          <li className={step >= 1 ? 'text-green-600' : ''}>Test API connection</li>
          <li className={step >= 2 ? 'text-green-600' : ''}>Import lightweight-charts library</li>
          <li className={step >= 3 ? 'text-green-600' : ''}>Create chart instance</li>
          <li className={step >= 4 ? 'text-green-600' : ''}>Add candlestick series</li>
          <li className={step >= 5 ? 'text-green-600' : ''}>Convert data format</li>
          <li className={step >= 6 ? 'text-green-600' : ''}>Set chart data</li>
          <li className={step >= 7 ? 'text-green-600' : ''}>Complete success</li>
        </ol>
      </div>
    </div>
  )
}