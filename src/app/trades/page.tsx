"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { motion } from "framer-motion"
import { 
  PlusIcon, 
  DownloadIcon,
  SearchIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  EditIcon,
  TrashIcon
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Header from "@/components/Header"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useTrades } from "@/hooks/useTrades"
import AddTradeModal from "@/components/AddTradeModal"
import EditTradeModal from "@/components/EditTradeModal"
import { useTheme } from "@/components/ThemeProvider"
import { getThemeClasses } from "@/lib/theme"

function TradesContent() {
  const { theme } = useTheme()
  const themeClasses = getThemeClasses(theme)
  
  const { isAuthenticated, user, isLoading } = useAuth()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"ALL" | "OPEN" | "CLOSED">("ALL")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedTrade, setSelectedTrade] = useState<any>(null)
  const { trades, loading, error, addTrade, updateTrade, deleteTrade } = useTrades(user?.id || '')

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/signin")
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${themeClasses.background}`}>
        <div className={`text-lg ${themeClasses.text}`}>Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${themeClasses.background}`}>
        <div className={`text-lg ${themeClasses.text}`}>Redirecting to sign in...</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${themeClasses.background}`}>
        <div className={`text-lg ${themeClasses.text}`}>Loading trades...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${themeClasses.background}`}>
        <div className="text-lg text-red-400">Error loading trades: {error}</div>
      </div>
    )
  }

  const filteredTrades = trades
    .filter(trade => 
      (filterStatus === "ALL" || trade.status === filterStatus) &&
      (searchTerm === "" || trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => b.entryDate.getTime() - a.entryDate.getTime())

  const totalPnL = trades.reduce((sum, trade) => sum + (trade.netPnL || 0), 0)
  const winningTrades = trades.filter(trade => (trade.netPnL || 0) > 0).length
  const totalClosedTrades = trades.filter(trade => trade.status === "CLOSED").length
  const winRate = totalClosedTrades > 0 ? (winningTrades / totalClosedTrades) * 100 : 0

  const handleAddTrade = async (tradeData: any) => {
    try {
      await addTrade(tradeData)
    } catch (error) {
      console.error('Failed to add trade:', error)
      throw error
    }
  }

  const handleEditTrade = (trade: any) => {
    setSelectedTrade(trade)
    setIsEditModalOpen(true)
  }

  const handleUpdateTrade = async (tradeId: string, updates: any) => {
    try {
      await updateTrade(tradeId, updates)
      setIsEditModalOpen(false)
      setSelectedTrade(null)
    } catch (error) {
      console.error('Failed to update trade:', error)
      throw error
    }
  }

  const handleDeleteTrade = async (tradeId: string) => {
    if (window.confirm('Are you sure you want to delete this trade? This action cannot be undone.')) {
      try {
        await deleteTrade(tradeId)
      } catch (error) {
        console.error('Failed to delete trade:', error)
        alert('Failed to delete trade. Please try again.')
      }
    }
  }

  return (
    <>
      <Header />
      <div className={`min-h-screen ${themeClasses.background}`}>
        {/* Background Effects - only show in dark mode */}
        {theme === 'dark' && (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(120,219,226,0.4),rgba(255,255,255,0))]" />
          </>
        )}
      
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
                <h1 className={`text-4xl font-bold ${themeClasses.text} mb-2`}>Trades</h1>
                <p className={themeClasses.textSecondary}>Manage and analyze your trading activity</p>
              </div>
              <div className="mt-4 sm:mt-0 flex items-center space-x-3">
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
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
            <Card className={themeClasses.surface}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${themeClasses.textSecondary}`}>Total P&L</p>
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

            <Card className={themeClasses.surface}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${themeClasses.textSecondary}`}>Win Rate</p>
                    <p className={`text-2xl font-bold ${themeClasses.text}`}>{winRate.toFixed(1)}%</p>
                  </div>
                  <div className={themeClasses.textMuted}>
                    <span className="text-sm">{winningTrades}/{totalClosedTrades}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={themeClasses.surface}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${themeClasses.textSecondary}`}>Total Trades</p>
                    <p className={`text-2xl font-bold ${themeClasses.text}`}>{trades.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={themeClasses.surface}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${themeClasses.textSecondary}`}>Open Positions</p>
                    <p className={`text-2xl font-bold ${themeClasses.accent}`}>
                      {trades.filter(t => t.status === "OPEN").length}
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
            <Card className={themeClasses.surface}>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <SearchIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${themeClasses.textMuted} w-4 h-4`} />
                    <input
                      type="text"
                      placeholder="Search trades..."
                      className={`w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 ${themeClasses.input}`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select
                    className={`px-4 py-2 rounded-lg focus:outline-none focus:ring-2 ${themeClasses.input} ${themeClasses.select}`}
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
            <Card className={themeClasses.surface}>
              <CardHeader>
                <CardTitle className={themeClasses.text}>Trade History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`border-b ${theme === 'dark' ? 'border-white/20' : 'border-gray-200'}`}>
                        <th className={`text-left py-3 px-4 ${themeClasses.textSecondary} font-medium`}>Symbol</th>
                        <th className={`text-left py-3 px-4 ${themeClasses.textSecondary} font-medium`}>Side</th>
                        <th className={`text-left py-3 px-4 ${themeClasses.textSecondary} font-medium`}>Entry Date</th>
                        <th className={`text-left py-3 px-4 ${themeClasses.textSecondary} font-medium`}>Entry Price</th>
                        <th className={`text-left py-3 px-4 ${themeClasses.textSecondary} font-medium`}>Quantity</th>
                        <th className={`text-left py-3 px-4 ${themeClasses.textSecondary} font-medium`}>P&L</th>
                        <th className={`text-left py-3 px-4 ${themeClasses.textSecondary} font-medium`}>Status</th>
                        <th className={`text-left py-3 px-4 ${themeClasses.textSecondary} font-medium`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTrades.map((trade, index) => (
                        <motion.tr
                          key={trade.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className={`border-b ${theme === 'dark' ? 'border-white/10 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'} transition-colors`}
                        >
                          <td className={`py-4 px-4 ${themeClasses.text} font-medium`}>{trade.symbol}</td>
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
                          <td className={`py-4 px-4 ${themeClasses.textSecondary}`}>
                            {formatDate(trade.entryDate)}
                          </td>
                          <td className={`py-4 px-4 ${themeClasses.text}`}>
                            {formatCurrency(trade.entryPrice)}
                          </td>
                          <td className={`py-4 px-4 ${themeClasses.text}`}>{trade.quantity}</td>
                          <td className="py-4 px-4">
                            {trade.netPnL !== undefined ? (
                              <span className={trade.netPnL >= 0 ? "text-green-400" : "text-red-400"}>
                                {formatCurrency(trade.netPnL)}
                              </span>
                            ) : (
                              <span className={themeClasses.textMuted}>-</span>
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
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleEditTrade(trade)}
                                className={`p-1 ${themeClasses.textMuted} hover:text-blue-400 transition-colors`}
                                title="Edit trade"
                              >
                                <EditIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTrade(trade.id)}
                                className={`p-1 ${themeClasses.textMuted} hover:text-red-400 transition-colors`}
                                title="Delete trade"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
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

      <AddTradeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddTrade}
      />

      <EditTradeModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedTrade(null)
        }}
        onSubmit={handleUpdateTrade}
        trade={selectedTrade}
      />
    </>
  )
}

export default function TradesPage() {
  return <TradesContent />
}