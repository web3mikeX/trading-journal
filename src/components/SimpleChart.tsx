"use client"

import { useEffect, useRef, useState } from "react"

interface SimpleChartProps {
  symbol: string
  width?: number
  height?: number
}

export default function SimpleChart({ symbol, width = 400, height = 300 }: SimpleChartProps) {
  const [status, setStatus] = useState('Loading...')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadChart = async () => {
      try {
        setStatus('Loading library...')
        
        // Quick test with minimal library load
        const charts = await import('lightweight-charts')
        setStatus('Creating chart...')
        
        if (containerRef.current) {
          const chart = charts.createChart(containerRef.current, {
            width,
            height,
            layout: {
              background: { type: 'solid', color: '#ffffff' },
              textColor: '#333'
            }
          })

          setStatus('Adding data...')
          
          // Quick synthetic data
          const series = chart.addSeries(charts.CandlestickSeries, {
            upColor: '#00ff00',
            downColor: '#ff0000'
          })

          const data = []
          const basePrice = 100
          for (let i = 0; i < 20; i++) {
            const time = Math.floor((Date.now() - (20-i) * 24 * 60 * 60 * 1000) / 1000)
            const change = (Math.random() - 0.5) * 10
            data.push({
              time,
              open: basePrice + change,
              high: basePrice + change + Math.random() * 5,
              low: basePrice + change - Math.random() * 5,
              close: basePrice + change + (Math.random() - 0.5) * 3
            })
          }

          series.setData(data)
          chart.timeScale().fitContent()
          
          setStatus('✅ Ready!')
        }
      } catch (error) {
        setStatus(`❌ Error: ${error}`)
        // Chart initialization failed
      }
    }

    loadChart()
  }, [symbol, width, height])

  return (
    <div className="p-4 border rounded">
      <div className="mb-2 text-sm text-gray-600">
        Simple Chart Test - {symbol}: {status}
      </div>
      <div 
        ref={containerRef} 
        className="bg-white border"
        style={{ width: `${width}px`, height: `${height}px` }}
      />
    </div>
  )
}