"use client"

import { useEffect, useRef, useState } from "react"
import SimpleTestChart from "@/components/SimpleTestChart"

export default function ChartRenderTestPage() {
  const chartRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const log = (message: string) => {
    console.log(message)
    setStatus(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    let mounted = true

    const testChart = async () => {
      try {
        log("🚀 Starting chart render test")
        
        if (!chartRef.current) {
          log("❌ Chart container not found")
          return
        }
        
        log("✅ Chart container found")
        log(`📐 Container dimensions: ${chartRef.current.offsetWidth}x${chartRef.current.offsetHeight}`)
        
        log("📦 Importing TradingView library...")
        const LightweightCharts = await import('lightweight-charts')
        log("✅ TradingView library imported successfully")
        
        const { createChart } = LightweightCharts
        log("🎨 Creating chart...")
        
        const chart = createChart(chartRef.current, {
          width: 600,
          height: 400,
          layout: {
            backgroundColor: '#ffffff',
            textColor: '#000000',
          },
        })
        
        log("✅ Chart created successfully")
        
        const candlestickSeries = chart.addCandlestickSeries({
          upColor: '#4caf50',
          downColor: '#f44336',
          borderDownColor: '#f44336',
          borderUpColor: '#4caf50',
          wickDownColor: '#f44336',
          wickUpColor: '#4caf50',
        })
        
        log("📊 Candlestick series added")
        
        // Add simple test data
        const testData = [
          { time: '2025-07-27', open: 23500, high: 23550, low: 23450, close: 23520 },
          { time: '2025-07-28', open: 23520, high: 23580, low: 23480, close: 23560 },
          { time: '2025-07-29', open: 23560, high: 23600, low: 23500, close: 23540 },
          { time: '2025-07-30', open: 23540, high: 23590, low: 23510, close: 23570 },
          { time: '2025-07-31', open: 23570, high: 23620, low: 23550, close: 23600 }
        ]
        
        candlestickSeries.setData(testData)
        log("📈 Test data added")
        
        chart.timeScale().fitContent()
        log("🎯 Chart fitted to content")
        
        log("🎉 Chart render test completed successfully!")
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        log(`❌ Error: ${errorMessage}`)
        setError(errorMessage)
        console.error('Chart creation error:', error)
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
        <h1 className="text-3xl font-bold mb-8">Chart Render Test</h1>
        
        {/* Status Log */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Debug Log</h2>
          <div className="bg-gray-100 p-4 rounded text-sm font-mono max-h-64 overflow-y-auto">
            {status.map((msg, i) => (
              <div key={i} className="mb-1">{msg}</div>
            ))}
            {error && (
              <div className="text-red-600 font-bold">ERROR: {error}</div>
            )}
          </div>
        </div>
        
        {/* Manual Chart Container */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Manual Chart Test</h2>
          <div 
            ref={chartRef}
            className="border border-gray-300 rounded"
            style={{
              width: '600px',
              height: '400px',
              backgroundColor: '#ffffff'
            }}
          />
        </div>

        {/* Simple Chart Component */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Simple Chart Component</h2>
          <SimpleTestChart width={600} height={400} />
        </div>
        
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h3 className="font-semibold text-blue-800 mb-2">Debug Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
            <li>Check the debug log above for any errors</li>
            <li>Open browser developer tools (F12)</li>
            <li>Look at the Console tab for additional errors</li>
            <li>Check if the chart container shows a border but no chart content</li>
            <li>Verify the TradingView library is loading correctly</li>
          </ol>
        </div>
      </div>
    </div>
  )
}