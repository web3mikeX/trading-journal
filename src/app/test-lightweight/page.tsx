"use client"

import { useState } from "react"

export default function TestLightweightPage() {
  const [status, setStatus] = useState("Loading...")

  // Test dynamic import to avoid SSR issues
  const testLightweightCharts = async () => {
    try {
      const { createChart } = await import('lightweight-charts')
      setStatus("✅ Lightweight Charts imported successfully")
    } catch (error) {
      setStatus(`❌ Error importing: ${error}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Lightweight Charts Test
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Import Test
          </h2>
          
          <div className="space-y-4">
            <button 
              onClick={testLightweightCharts}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Test Import
            </button>
            
            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded">
              Status: {status}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}