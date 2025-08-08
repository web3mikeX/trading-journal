"use client"

import { useEffect, useRef, useState } from "react"

export default function SimpleChartTest() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<string>('Initializing...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const testChart = async () => {
      try {
        setStatus('Loading TradingView library...')
        
        // Dynamic import
        const LightweightCharts = await import('lightweight-charts')
        setStatus('Library loaded, checking exports...')
        
        console.log('Library exports:', Object.keys(LightweightCharts))
        console.log('createChart type:', typeof LightweightCharts.createChart)
        console.log('createChart function:', LightweightCharts.createChart.toString().substring(0, 100))
        
        if (!containerRef.current) {
          throw new Error('Container not available')
        }
        
        setStatus('Creating chart...')
        
        // Try to create chart
        const chart = LightweightCharts.createChart(containerRef.current, {
          width: 400,
          height: 300,
          layout: {
            background: { type: 'solid', color: '#ffffff' },
            textColor: '#000000',
          }
        })
        
        setStatus('Chart created, checking methods...')
        
        console.log('Chart object:', {
          type: typeof chart,
          constructor: chart?.constructor?.name,
          methods: Object.getOwnPropertyNames(chart).filter(prop => typeof chart[prop] === 'function'),
          hasAddCandlestickSeries: 'addCandlestickSeries' in chart,
          addCandlestickSeriesType: typeof chart.addCandlestickSeries
        })
        
        // Check if addCandlestickSeries exists
        if (typeof chart.addCandlestickSeries === 'function') {
          setStatus('✅ addCandlestickSeries available - creating series...')
          
          const series = chart.addCandlestickSeries({
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
          })
          
          // Set some sample data
          series.setData([
            { time: '2024-01-01', open: 100, high: 105, low: 95, close: 102 },
            { time: '2024-01-02', open: 102, high: 108, low: 100, close: 106 },
          ])
          
          setStatus('✅ Chart created successfully with candlestick series!')
          
        } else {
          setError(`❌ addCandlestickSeries not available. Available methods: ${Object.getOwnPropertyNames(chart).filter(prop => typeof chart[prop] === 'function').join(', ')}`)
        }
        
      } catch (err) {
        setError(`❌ Error: ${err instanceof Error ? err.message : String(err)}`)
        console.error('Chart test error:', err)
      }
    }
    
    testChart()
  }, [])

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-bold mb-4">Chart Library Test</h3>
      <div className="mb-4">
        <p className="text-sm">Status: {status}</p>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
      <div 
        ref={containerRef}
        style={{ 
          width: '400px', 
          height: '300px', 
          border: '1px solid #ccc',
          backgroundColor: '#f9f9f9'
        }}
      />
    </div>
  )
}