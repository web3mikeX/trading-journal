"use client"

import { useAuth } from "@/hooks/useAuth"
import { useStats } from "@/hooks/useStats"

export default function DebugStats() {
  const { user } = useAuth()
  const { stats, loading, error } = useStats(user?.id || 'demo-demo-example-com')

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl mb-4">Stats Debug Page</h1>
      
      <div className="mb-4">
        <h2 className="text-lg">User ID: {user?.id || 'demo-demo-example-com'}</h2>
      </div>

      <div className="mb-4">
        <h2 className="text-lg">Loading: {loading ? 'YES' : 'NO'}</h2>
      </div>

      <div className="mb-4">
        <h2 className="text-lg">Error: {error || 'None'}</h2>
      </div>

      <div className="mb-4">
        <h2 className="text-lg">Stats Object:</h2>
        <pre className="bg-gray-800 p-4 rounded overflow-auto text-sm">
          {JSON.stringify(stats, null, 2)}
        </pre>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 p-4 rounded">
            <h3 className="text-sm text-gray-400">Total P&L</h3>
            <p className="text-xl">${stats.totalPnL}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded">
            <h3 className="text-sm text-gray-400">Win Rate</h3>
            <p className="text-xl">{stats.winRate}%</p>
          </div>
          <div className="bg-gray-800 p-4 rounded">
            <h3 className="text-sm text-gray-400">Total Trades</h3>
            <p className="text-xl">{stats.totalTrades}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded">
            <h3 className="text-sm text-gray-400">Profit Factor</h3>
            <p className="text-xl">{stats.profitFactor}</p>
          </div>
        </div>
      )}
    </div>
  )
}