"use client"

import { useEffect, useRef, useState } from "react"

export default function SimpleChartDebugPage() {
  const chartRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState('Starting...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const testChart = async () => {
      try {
        setStatus('Testing TradingView library import...')
        console.log('🔍 Testing TradingView library import')
        
        const LightweightCharts = await import('lightweight-charts')
        console.log('✅ Library imported successfully:', LightweightCharts)
        
        setStatus('Creating simple chart...')
        
        if (!chartRef.current) {
          setError('Chart container not available')
          return
        }

        const { createChart } = LightweightCharts
        console.log('🎨 Creating chart with createChart function')
        
        const chart = createChart(chartRef.current, {
          width: 400,
          height: 300,
          layout: {
            backgroundColor: '#ffffff',
            textColor: '#000000'
          }
        })
        
        console.log('📊 Chart created successfully:', chart)
        
        const candlestickSeries = chart.addCandlestickSeries()
        
        // Add simple test data
        const testData = [
          { time: '2025-07-28', open: 100, high: 105, low: 95, close: 102 },
          { time: '2025-07-29', open: 102, high: 108, low: 98, close: 106 },
          { time: '2025-07-30', open: 106, high: 110, low: 104, close: 108 },
          { time: '2025-07-31', open: 108, high: 112, low: 106, close: 110 }
        ]
        
        candlestickSeries.setData(testData)
        console.log('✅ Test data added successfully')
        
        setStatus('✅ Chart created successfully!')
        
      } catch (error) {
        console.error('❌ Chart creation failed:', error)
        setError(error instanceof Error ? error.message : 'Unknown error')
        setStatus('❌ Chart creation failed')
      }
    }

    if (mounted) {
      testChart()
    }

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Simple Chart Debug</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Status</h2>
          <p className="mb-2">
            <strong>Status:</strong> {status}
          </p>
          {error && (
            <p className="text-red-600">
              <strong>Error:</strong> {error}
            </p>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Chart Container</h2>
          <div 
            ref={chartRef}
            style={{
              width: '400px',
              height: '300px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>
        
        <div className="bg-gray-100 rounded-lg p-4 mt-6">
          <h3 className="font-semibold mb-2">Debug Steps:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Import TradingView Lightweight Charts library</li>
            <li>Create chart container reference</li>
            <li>Call createChart function</li>
            <li>Add candlestick series</li>
            <li>Set simple test data</li>
          </ol>
        </div>
      </div>
    </div>
  )
}