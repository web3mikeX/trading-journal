"use client"

import { useState, useEffect } from "react"
import WorkingChartNew from "@/components/WorkingChartNew"

export default function DebugChartsPage() {
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    async function testAPI() {
      try {
        setDebugInfo(prev => ({ ...prev, status: 'Testing API...' }))
        
        const userId = 'cmcwu8b5m0001m17ilm0triy8'
        const response = await fetch(`/api/trades?userId=${userId}`)
        
        setDebugInfo(prev => ({ 
          ...prev, 
          apiStatus: response.ok ? 'Success' : 'Failed',
          apiStatusCode: response.status
        }))
        
        if (response.ok) {
          const data = await response.json()
          const closedTrades = data.filter((trade: any) => trade.exitDate && trade.exitPrice)
          
          setDebugInfo(prev => ({ 
            ...prev, 
            totalTrades: data.length,
            closedTrades: closedTrades.length,
            firstTrade: closedTrades[0] || null,
            status: 'API test complete'
          }))
        } else {
          const errorData = await response.json()
          setDebugInfo(prev => ({ 
            ...prev, 
            error: errorData,
            status: 'API failed'
          }))
        }
      } catch (error) {
        setDebugInfo(prev => ({ 
          ...prev, 
          error: error instanceof Error ? error.message : 'Unknown error',
          status: 'API error'
        }))
      }
    }
    
    testAPI()
  }, [])

  // Simple test trade data
  const testTrade = {
    id: 'test-1',
    symbol: 'MNQU5',
    side: 'SHORT' as const,
    entryDate: new Date('2025-07-29T16:02:28.000Z'),
    exitDate: new Date('2025-07-29T16:53:47.000Z'),
    entryPrice: 23502.5,
    exitPrice: 23486.75,
    quantity: 1,
    netPnL: 15.75
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
          Chart Debug Page
        </h1>
        
        {/* Debug Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
          <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
        
        {/* Simple Chart Test */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Simple Chart Test</h2>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            Testing with hardcoded trade data to isolate chart issues
          </p>
          
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <WorkingChartNew
              symbol="MNQU5"
              trade={testTrade}
              width={600}
              height={300}
              showTradeMarkers={true}
              preferReal={false}
            />
          </div>
        </div>
        
        {/* Chart with Real Data Preference */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Chart with Real Data</h2>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            Testing with real data preference enabled
          </p>
          
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <WorkingChartNew
              symbol="MNQU5"
              trade={testTrade}
              width={600}
              height={300}
              showTradeMarkers={true}
              preferReal={true}
            />
          </div>
        </div>
      </div>
    </div>
  )
}