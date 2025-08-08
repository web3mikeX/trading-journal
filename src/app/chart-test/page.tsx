"use client"

import SimpleChartTest from "@/components/SimpleChartTest"
import WorkingChartNew from "@/components/WorkingChartNew"

export default function ChartTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-8">TradingView Chart Debug</h1>
      
      <div className="space-y-8">
        <SimpleChartTest />
        
        <WorkingChartNew symbol="MNQU5" width={600} height={400} />
        
        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Debug Information:</h3>
          <p className="text-sm text-blue-700">
            • TradingView library version: 4.2.0 (downgraded from 5.0.8)<br/>
            • Testing both detailed debugging and simple implementation<br/>
            • Check browser console for detailed logs
          </p>
        </div>
      </div>
    </div>
  )
}