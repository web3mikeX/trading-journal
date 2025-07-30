"use client"

import { useEffect, useState, memo, useMemo } from "react"
import dynamic from "next/dynamic"
import { useTheme } from "@/components/ThemeProvider"
import { detectAssetClass, getAssetClassName } from "@/lib/tradesvizUrl"

const Chart = dynamic(() => import("react-apexcharts"), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  )
})

interface Trade {
  id: string
  symbol: string
  side: 'LONG' | 'SHORT'
  entryDate: Date
  exitDate?: Date
  entryPrice: number
  exitPrice?: number
  quantity: number
  market?: string
  contractType?: string
  contractMultiplier?: number
}

interface ApexFinancialChartProps {
  trade: Trade
  width?: string | number
  height?: string | number
  className?: string
}

function ApexFinancialChart({
  trade,
  width = "100%",
  height = "400px",
  className = ""
}: ApexFinancialChartProps) {
  const { theme } = useTheme()
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usingFallbackData, setUsingFallbackData] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Generate sample OHLC data based on trade information
  const chartData = useMemo(() => {
    try {
      // console.log('Trade data received:', trade)
      
      if (!trade) {
        throw new Error('No trade data provided')
      }
      
      let needsFallback = false
      
      // Handle missing or zero entry price with a reasonable fallback
      if (!trade.entryPrice || trade.entryPrice <= 0) {
        console.warn(`Trade ${trade.id} has invalid entry price: ${trade.entryPrice}, using fallback`)
        // Use a fallback price based on symbol or default to a reasonable value
        const fallbackPrice = trade.symbol?.includes('NQ') ? 20000 :
                              trade.symbol?.includes('ES') ? 5000 :
                              trade.symbol?.includes('BTC') ? 50000 : 100
        trade = { ...trade, entryPrice: fallbackPrice }
        needsFallback = true
      }
      
      if (!trade.entryDate) {
        console.warn(`Trade ${trade.id} has no entry date, using current date`)
        trade = { ...trade, entryDate: new Date() }
        needsFallback = true
      }
      
      setUsingFallbackData(needsFallback)

      const entryPrice = trade.entryPrice
      const exitPrice = trade.exitPrice || entryPrice
      
      // Handle potential string dates
      const entryDate = trade.entryDate instanceof Date ? trade.entryDate : new Date(trade.entryDate)
      const exitDate = trade.exitDate ? 
        (trade.exitDate instanceof Date ? trade.exitDate : new Date(trade.exitDate)) : 
        null
      
      const entryTime = entryDate.getTime()
      const exitTime = exitDate?.getTime() || entryTime + (24 * 60 * 60 * 1000) // 1 day later if no exit
      
      // Generate 20 data points around the trade period
      const dataPoints = []
      const timeSpan = exitTime - entryTime
      const interval = Math.max(timeSpan / 20, 5 * 60 * 1000) // Minimum 5 minute intervals
      
      for (let i = 0; i < 20; i++) {
        const timestamp = entryTime - (10 * interval) + (i * interval)
        const basePrice = i <= 10 ? entryPrice : (entryPrice + exitPrice) / 2
        
        // Add some realistic price movement
        const volatility = entryPrice * 0.002 // 0.2% volatility
        const trend = (exitPrice - entryPrice) / 20 * (i - 10)
        const randomMove = (Math.random() - 0.5) * volatility
        
        const adjustedPrice = basePrice + trend + randomMove
        const high = adjustedPrice + Math.random() * volatility
        const low = adjustedPrice - Math.random() * volatility
        const close = adjustedPrice + (Math.random() - 0.5) * volatility * 0.5
        
        dataPoints.push({
          x: timestamp,
          y: [adjustedPrice, high, low, close] // OHLC format
        })
      }
      
      return dataPoints
    } catch (err) {
      console.error('Error generating chart data:', err)
      setError(err instanceof Error ? err.message : 'Chart data generation failed')
      return []
    }
  }, [trade?.entryPrice, trade?.exitPrice, trade?.entryDate, trade?.exitDate])

  // Chart configuration
  const chartOptions = useMemo(() => {
    if (!trade || chartData.length === 0) return {}
    
    // Handle date conversion for annotations
    const entryDate = trade.entryDate instanceof Date ? trade.entryDate : new Date(trade.entryDate)
    const exitDate = trade.exitDate ? 
      (trade.exitDate instanceof Date ? trade.exitDate : new Date(trade.exitDate)) : 
      null
    
    const entryTime = entryDate.getTime()
    const exitTime = exitDate?.getTime()
    
    return ({
    chart: {
      type: 'candlestick',
      background: 'transparent',
      fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
      toolbar: {
        show: true,
        offsetY: -10,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true
        },
        export: {
          csv: {
            filename: `${trade.symbol}_trade_chart`
          },
          svg: {
            filename: `${trade.symbol}_trade_chart`
          },
          png: {
            filename: `${trade.symbol}_trade_chart`
          }
        }
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 600,
        animateGradually: {
          enabled: true,
          delay: 150
        }
      },
      dropShadow: {
        enabled: false
      }
    },
    title: {
      text: `${trade.symbol} • ${trade.side} Position`,
      align: 'left',
      margin: 10,
      offsetX: 0,
      offsetY: 0,
      floating: false,
      style: {
        color: theme === 'dark' ? '#f9fafb' : '#1f2937',
        fontSize: '18px',
        fontWeight: '700',
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif'
      }
    },
    xaxis: {
      type: 'datetime',
      labels: {
        style: {
          colors: theme === 'dark' ? '#9ca3af' : '#6b7280'
        }
      },
      axisBorder: {
        color: theme === 'dark' ? '#374151' : '#e5e7eb'
      },
      axisTicks: {
        color: theme === 'dark' ? '#374151' : '#e5e7eb'
      }
    },
    yaxis: {
      tooltip: {
        enabled: true
      },
      labels: {
        style: {
          colors: theme === 'dark' ? '#9ca3af' : '#6b7280'
        },
        formatter: (value: number) => `$${value.toFixed(2)}`
      }
    },
    grid: {
      show: true,
      borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
      strokeDashArray: 2,
      position: 'back',
      xaxis: {
        lines: {
          show: true
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      },
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      }
    },
    plotOptions: {
      candlestick: {
        colors: {
          upward: '#22c55e', // Modern green for bullish candles
          downward: '#ef4444' // Professional red for bearish candles
        },
        wick: {
          useFillColor: true
        }
      }
    },
    stroke: {
      show: true,
      width: 1,
      colors: [theme === 'dark' ? '#374151' : '#d1d5db']
    },
    annotations: {
      points: [
        {
          x: entryTime,
          y: trade.entryPrice,
          marker: {
            size: 10,
            fillColor: trade.side === 'LONG' ? '#22c55e' : '#3b82f6',
            strokeColor: '#ffffff',
            strokeWidth: 3,
            shape: 'circle',
            hover: {
              size: 12
            }
          },
          label: {
            borderColor: trade.side === 'LONG' ? '#22c55e' : '#3b82f6',
            borderWidth: 2,
            borderRadius: 6,
            textAnchor: 'middle',
            style: {
              color: '#ffffff',
              background: trade.side === 'LONG' ? '#22c55e' : '#3b82f6',
              fontSize: '11px',
              fontWeight: '600',
              fontFamily: 'Inter, sans-serif'
            },
            text: `Entry: $${trade.entryPrice.toFixed(2)}`,
            offsetY: -15
          }
        },
        ...(exitDate && trade.exitPrice ? [{
          x: exitTime,
          y: trade.exitPrice,
          marker: {
            size: 10,
            fillColor: trade.side === 'LONG' ? 
              (trade.exitPrice > trade.entryPrice ? '#22c55e' : '#ef4444') :
              (trade.exitPrice < trade.entryPrice ? '#22c55e' : '#ef4444'),
            strokeColor: '#ffffff',
            strokeWidth: 3,
            shape: 'square',
            hover: {
              size: 12
            }
          },
          label: {
            borderColor: trade.side === 'LONG' ? 
              (trade.exitPrice > trade.entryPrice ? '#22c55e' : '#ef4444') :
              (trade.exitPrice < trade.entryPrice ? '#22c55e' : '#ef4444'),
            borderWidth: 2,
            borderRadius: 6,
            textAnchor: 'middle',
            style: {
              color: '#ffffff',
              background: trade.side === 'LONG' ? 
                (trade.exitPrice > trade.entryPrice ? '#22c55e' : '#ef4444') :
                (trade.exitPrice < trade.entryPrice ? '#22c55e' : '#ef4444'),
              fontSize: '11px',
              fontWeight: '600',
              fontFamily: 'Inter, sans-serif'
            },
            text: `Exit: $${trade.exitPrice.toFixed(2)}`,
            offsetY: -15
          }
        }] : [])
      ]
    },
    tooltip: {
      enabled: true,
      theme: theme === 'dark' ? 'dark' : 'light',
      style: {
        fontSize: '12px',
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif'
      },
      x: {
        format: 'dd MMM yyyy HH:mm'
      },
      y: {
        formatter: function(value: number) {
          return `$${value.toFixed(2)}`
        }
      },
      custom: function({series, seriesIndex, dataPointIndex, w}: any) {
        const data = w.globals.initialSeries[seriesIndex].data[dataPointIndex]
        if (data && data.y && Array.isArray(data.y)) {
          const [open, high, low, close] = data.y
          return `
            <div class="px-3 py-2 text-sm">
              <div class="font-semibold mb-1">${trade.symbol}</div>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div>Open: <span class="font-medium">$${open.toFixed(2)}</span></div>
                <div>High: <span class="font-medium text-green-600">$${high.toFixed(2)}</span></div>
                <div>Low: <span class="font-medium text-red-600">$${low.toFixed(2)}</span></div>
                <div>Close: <span class="font-medium">$${close.toFixed(2)}</span></div>
              </div>
            </div>
          `
        }
        return ''
      }
    },
    legend: {
      show: false
    }
  })}, [theme, trade, chartData])

  const series = [{
    name: trade?.symbol || 'Unknown',
    data: chartData || []
  }]

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  if (!isMounted || isLoading) {
    return (
      <div className={`apex-chart-container ${className}`}>
        <div
          style={{
            width: typeof width === 'number' ? `${width}px` : width,
            height: typeof height === 'number' ? `${height}px` : height,
            minHeight: '400px'
          }}
          className="flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <div className="text-gray-600 dark:text-gray-400">
              Loading chart for {trade.symbol}...
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {getAssetClassName(detectAssetClass(trade))} • {trade.side}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`apex-chart-container ${className}`}>
      <div
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          minHeight: '400px'
        }}
        className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
      >
        {isMounted && !error && chartData.length > 0 ? (
          <Chart
            options={chartOptions}
            series={series}
            type="candlestick"
            width="100%"
            height="100%"
          />
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-gray-400 dark:text-gray-500 mb-2">⚠️</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Chart Error: {error}
              </div>
            </div>
          </div>
        ) : null}
      </div>
      
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
        <span className="font-medium">
          {trade.symbol} • {getAssetClassName(detectAssetClass(trade))}
        </span>
        <span className="mx-2">•</span>
        <span>Professional Trading Analytics</span>
        {usingFallbackData && (
          <>
            <span className="mx-2">•</span>
            <span className="text-orange-500 dark:text-orange-400">Using sample data</span>
          </>
        )}
      </div>
    </div>
  )
}

export default memo(ApexFinancialChart)