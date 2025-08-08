"use client"

import { useEffect, useRef, useState } from "react"

interface SimpleTestChartProps {
  width?: number
  height?: number
}

export default function SimpleTestChart({ 
  width = 600, 
  height = 400 
}: SimpleTestChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<any>(null)
  const [status, setStatus] = useState('Initializing...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const createSimpleChart = async () => {
      try {
        if (!chartRef.current) {
          setStatus('Waiting for container...')
          setTimeout(() => {
            if (mounted) createSimpleChart()
          }, 100)
          return
        }

        setStatus('Loading chart library...')
        
        // Import the library
        const LightweightCharts = await import('lightweight-charts')
        const { createChart } = LightweightCharts

        if (!mounted || !chartRef.current) return

        setStatus('Creating chart...')

        // Clear any existing chart
        if (chartInstanceRef.current) {
          try {
            chartInstanceRef.current.remove()
          } catch (e) {
            console.warn('Error removing previous chart:', e)
          }
        }

        // Create chart
        const chart = createChart(chartRef.current, {
          width,
          height,
          layout: {
            backgroundColor: '#ffffff',
            textColor: '#333333',
          },
          grid: {
            vertLines: { color: '#f0f0f0' },
            horzLines: { color: '#f0f0f0' },
          },
          rightPriceScale: {
            borderColor: '#cccccc',
          },
          timeScale: {
            borderColor: '#cccccc',
          },
        })

        chartInstanceRef.current = chart

        // Add candlestick series
        const candlestickSeries = chart.addCandlestickSeries({
          upColor: '#4caf50',
          downColor: '#f44336',
          borderDownColor: '#f44336',
          borderUpColor: '#4caf50',
          wickDownColor: '#f44336',
          wickUpColor: '#4caf50',
        })

        // Add simple test data
        const testData = [
          { time: '2025-07-25', open: 23400, high: 23450, low: 23350, close: 23420 },
          { time: '2025-07-26', open: 23420, high: 23480, low: 23380, close: 23460 },
          { time: '2025-07-27', open: 23460, high: 23520, low: 23440, close: 23500 },
          { time: '2025-07-28', open: 23500, high: 23550, low: 23470, close: 23520 },
          { time: '2025-07-29', open: 23520, high: 23580, low: 23490, close: 23540 },
          { time: '2025-07-30', open: 23540, high: 23590, low: 23520, close: 23570 },
          { time: '2025-07-31', open: 23570, high: 23620, low: 23550, close: 23600 }
        ]

        candlestickSeries.setData(testData)
        chart.timeScale().fitContent()

        setStatus('✅ Chart loaded successfully!')

      } catch (error) {
        console.error('Chart creation failed:', error)
        setError(error instanceof Error ? error.message : 'Unknown error')
        setStatus('❌ Chart creation failed')
      }
    }

    createSimpleChart()

    return () => {
      mounted = false
      if (chartInstanceRef.current) {
        try {
          chartInstanceRef.current.remove()
        } catch (e) {
          console.warn('Error removing chart:', e)
        }
        chartInstanceRef.current = null
      }
    }
  }, [width, height])

  return (
    <div>
      <div className="mb-2 text-sm text-gray-600">
        Status: {status}
        {error && <span className="text-red-600 ml-2">Error: {error}</span>}
      </div>
      <div 
        ref={chartRef}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          border: '1px solid #ddd',
          borderRadius: '4px',
          backgroundColor: '#ffffff'
        }}
      />
    </div>
  )
}