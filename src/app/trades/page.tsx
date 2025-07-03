"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/SimpleAuth"
import { motion } from "framer-motion"
import { 
  PlusIcon, 
  DownloadIcon,
  SearchIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  TrendingUpIcon,
  TrendingDownIcon
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import SimpleHeader from "@/components/SimpleHeader"
import { formatCurrency, formatDate } from "@/lib/utils"

interface Trade {
  id: string
  symbol: string
  side: "LONG" | "SHORT"
  entryDate: Date
  exitDate?: Date
  entryPrice: number
  exitPrice?: number
  quantity: number
  netPnL?: number
  status: "OPEN" | "CLOSED" | "CANCELLED"
  strategy?: string
  notes?: string
}

function TradesContent() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"ALL" | "OPEN" | "CLOSED">("ALL")

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/signin")
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-lg text-white">Loading...</div>
      </div>
    )
  }

  // Mock data
  const mockTrades: Trade[] = [
    {
      id: "1",
      symbol: "AAPL",
      side: "LONG",
      entryDate: new Date("2024-01-15T09:30:00"),
      exitDate: new Date("2024-01-15T15:45:00"),
      entryPrice: 150.25,
      exitPrice: 152.80,
      quantity: 100,
      netPnL: 255,
      status: "CLOSED",
      strategy: "Momentum",
      notes: "Strong breakout above resistance"
    },
    {
      id: "2",
      symbol: "MSFT",
      side: "SHORT",
      entryDate: new Date("2024-01-14T10:15:00"),
      exitDate: new Date("2024-01-14T14:30:00"),
      entryPrice: 380.50,
      exitPrice: 378.25,
      quantity: 50,
      netPnL: 112.50,
      status: "CLOSED",
      strategy: "Mean Reversion"
    },
    {
      id: "3",
      symbol: "GOOGL",
      side: "LONG",
      entryDate: new Date("2024-01-13T11:00:00"),
      entryPrice: 2850.00,
      quantity: 10,
      status: "OPEN",
      strategy: "Swing Trading"
    }
  ]

  const filteredTrades = mockTrades
    .filter(trade => 
      (filterStatus === "ALL" || trade.status === filterStatus) &&
      (searchTerm === "" || trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => b.entryDate.getTime() - a.entryDate.getTime())

  const totalPnL = mockTrades.reduce((sum, trade) => sum + (trade.netPnL || 0), 0)
  const winningTrades = mockTrades.filter(trade => (trade.netPnL || 0) > 0).length
  const totalClosedTrades = mockTrades.filter(trade => trade.status === "CLOSED").length
  const winRate = totalClosedTrades > 0 ? (winningTrades / totalClosedTrades) * 100 : 0

  return (
    <>
      <SimpleHeader />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(120,219,226,0.4),rgba(255,255,255,0))]" />
      
      <div className="relative z-10 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Trades</h1>
                <p className="text-gray-300">Manage and analyze your trading activity</p>
              </div>
              <div className="mt-4 sm:mt-0 flex items-center space-x-3">
                <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                  <PlusIcon className="w-4 h-4" />
                  <span>Add Trade</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  <DownloadIcon className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Summary Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <Card className="border-white/20 bg-white/10 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-300">Total P&L</p>
                    <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(totalPnL)}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${totalPnL >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    {totalPnL >= 0 ? (
                      <TrendingUpIcon className="w-6 h-6 text-green-400" />
                    ) : (
                      <TrendingDownIcon className="w-6 h-6 text-red-400" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/20 bg-white/10 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-300">Win Rate</p>
                    <p className="text-2xl font-bold text-white">{winRate.toFixed(1)}%</p>
                  </div>
                  <div className="text-gray-400">
                    <span className="text-sm">{winningTrades}/{totalClosedTrades}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/20 bg-white/10 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-300">Total Trades</p>
                    <p className="text-2xl font-bold text-white">{mockTrades.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/20 bg-white/10 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-300">Open Positions</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {mockTrades.filter(t => t.status === "OPEN").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Filters and Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-6"
          >
            <Card className="border-white/20 bg-white/10 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search trades..."
                      className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select
                    className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as "ALL" | "OPEN" | "CLOSED")}
                  >
                    <option value="ALL">All Trades</option>
                    <option value="OPEN">Open</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Trades Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="border-white/20 bg-white/10 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">Trade History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Symbol</th>
                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Side</th>
                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Entry Date</th>
                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Entry Price</th>
                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Quantity</th>
                        <th className="text-left py-3 px-4 text-gray-300 font-medium">P&L</th>
                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTrades.map((trade, index) => (
                        <motion.tr
                          key={trade.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="border-b border-white/10 hover:bg-white/5 transition-colors"
                        >
                          <td className="py-4 px-4 text-white font-medium">{trade.symbol}</td>
                          <td className="py-4 px-4">
                            <div className={`flex items-center space-x-1 ${
                              trade.side === "LONG" ? "text-green-400" : "text-red-400"
                            }`}>
                              {trade.side === "LONG" ? (
                                <ArrowUpIcon className="w-4 h-4" />
                              ) : (
                                <ArrowDownIcon className="w-4 h-4" />
                              )}
                              <span>{trade.side}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-gray-300">
                            {formatDate(trade.entryDate)}
                          </td>
                          <td className="py-4 px-4 text-white">
                            {formatCurrency(trade.entryPrice)}
                          </td>
                          <td className="py-4 px-4 text-white">{trade.quantity}</td>
                          <td className="py-4 px-4">
                            {trade.netPnL !== undefined ? (
                              <span className={trade.netPnL >= 0 ? "text-green-400" : "text-red-400"}>
                                {formatCurrency(trade.netPnL)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              trade.status === "OPEN" 
                                ? "bg-blue-500/20 text-blue-400"
                                : trade.status === "CLOSED"
                                ? "bg-gray-500/20 text-gray-400"
                                : "bg-red-500/20 text-red-400"
                            }`}>
                              {trade.status.toLowerCase()}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        </div>
      </div>
    </>
  )
}

export default function TradesPage() {
  return <TradesContent />
}