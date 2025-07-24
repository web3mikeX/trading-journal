"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { TrendingUpIcon, BarChart3Icon, DollarSignIcon, CalendarIcon, TrendingDownIcon, ActivityIcon, TargetIcon, FileTextIcon, CheckCircleIcon, InfoIcon, AlertTriangleIcon } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts"
import Header from "@/components/Header"
import ExportButton from "@/components/ExportButton"
import HabitAnalysis from "@/components/HabitAnalysis"
import { useTheme } from "@/components/ThemeProvider"
import { getThemeClasses } from "@/lib/theme"
import { useAuth } from "@/hooks/useAuth"
import { exportPerformanceReport } from "@/lib/exports"
import { useTrades } from "@/hooks/useTrades"

interface StatsData {
  totalPnL: number
  winRate: number
  totalTrades: number
  openTrades: number
  closedTrades: number
  profitFactor: number
  averageWin: number
  averageLoss: number
  currentMonthReturn: number
  performanceData: Array<{
    date: string
    balance: number
    pnl: number
    trades: number
  }>
  recentTrades: Array<{
    id: string
    symbol: string
    side: string
    entryDate: string
    exitDate: string | null
    netPnL: number | null
    status: string
  }>
  winningTrades: number
  losingTrades: number
}

export default function Analytics() {
  const { theme } = useTheme()
  const themeClasses = getThemeClasses(theme)
  const { user } = useAuth()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const { trades } = useTrades(user?.id || '')

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return
      
      try {
        const response = await fetch(`/api/stats?userId=${user.id}`)
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user?.id])

  if (loading) {
    return (
      <div className={`min-h-screen ${themeClasses.background} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className={`min-h-screen ${themeClasses.background}`}>
        <Header />
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
          <h1 className={`text-3xl font-bold ${themeClasses.text} mb-8`}>Trading Analytics</h1>
          <div className={`${themeClasses.surface} rounded-xl p-8 text-center`}>
            <p className={themeClasses.textSecondary}>No trading data available yet. Start by adding some trades!</p>
          </div>
        </div>
      </div>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const averageTrade = stats.closedTrades > 0 ? stats.totalPnL / stats.closedTrades : 0

  const mainStats = [
    { 
      label: "Total P&L", 
      value: formatCurrency(stats.totalPnL), 
      change: formatPercent(stats.currentMonthReturn), 
      icon: DollarSignIcon,
      changeColor: stats.totalPnL >= 0 ? "text-green-400" : "text-red-400"
    },
    { 
      label: "Win Rate", 
      value: formatPercent(stats.winRate), 
      change: `${stats.winningTrades}W/${stats.losingTrades}L`, 
      icon: TrendingUpIcon,
      changeColor: "text-blue-400"
    },
    { 
      label: "Total Trades", 
      value: stats.totalTrades.toString(), 
      change: `${stats.openTrades} open`, 
      icon: BarChart3Icon,
      changeColor: "text-orange-400"
    },
    { 
      label: "Avg. Trade", 
      value: formatCurrency(averageTrade), 
      change: `PF: ${stats.profitFactor.toFixed(2)}`, 
      icon: CalendarIcon,
      changeColor: stats.profitFactor >= 1 ? "text-green-400" : "text-red-400"
    },
  ]

  const riskStats = [
    { 
      label: "Avg. Win", 
      value: formatCurrency(stats.averageWin), 
      icon: TrendingUpIcon,
      color: "text-green-400"
    },
    { 
      label: "Avg. Loss", 
      value: formatCurrency(stats.averageLoss), 
      icon: TrendingDownIcon,
      color: "text-red-400"
    },
    { 
      label: "Profit Factor", 
      value: stats.profitFactor.toFixed(2), 
      icon: ActivityIcon,
      color: stats.profitFactor >= 1 ? "text-green-400" : "text-red-400"
    },
    { 
      label: "Monthly Return", 
      value: formatPercent(stats.currentMonthReturn), 
      icon: TargetIcon,
      color: stats.currentMonthReturn >= 0 ? "text-green-400" : "text-red-400"
    },
  ]

  // Prepare chart data
  const performanceChartData = stats.performanceData.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    balance: item.balance,
    pnl: item.pnl
  }))

  const winLossData = [
    { name: 'Winning Trades', value: stats.winningTrades, color: '#10B981' },
    { name: 'Losing Trades', value: stats.losingTrades, color: '#EF4444' },
  ]

  const monthlyPnLData = stats.performanceData.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    pnl: item.pnl,
    trades: item.trades
  }))

  return (
    <div className={`min-h-screen ${themeClasses.background}`}>
      
      <Header />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-8">
            <h1 className={`text-3xl font-bold ${themeClasses.text}`}>Trading Analytics</h1>
            <ExportButton
              options={[
                {
                  id: 'performance-report',
                  label: 'Performance Report',
                  icon: FileTextIcon,
                  action: () => stats && exportPerformanceReport(trades, stats, stats.performanceData)
                }
              ]}
              disabled={!stats || trades.length === 0}
            />
          </div>
          
          {/* Main Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {mainStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`${themeClasses.surface} rounded-xl p-6`}
              >
                <div className="flex items-center justify-between mb-4">
                  <stat.icon className={`w-8 h-8 ${themeClasses.accent}`} />
                  <span className={`text-sm ${stat.changeColor}`}>{stat.change}</span>
                </div>
                <h3 className={`text-2xl font-bold ${themeClasses.text} mb-1`}>{stat.value}</h3>
                <p className={`${themeClasses.textSecondary} text-sm`}>{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Risk Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {riskStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 + 0.4 }}
                className={`${themeClasses.surface} rounded-xl p-6`}
              >
                <div className="flex items-center justify-between mb-4">
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <h3 className={`text-xl font-bold ${themeClasses.text} mb-1`}>{stat.value}</h3>
                <p className={`${themeClasses.textSecondary} text-sm`}>{stat.label}</p>
              </motion.div>
            ))}
          </div>
          
          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Performance Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className={`${themeClasses.surface} rounded-xl p-8`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-semibold ${themeClasses.text}`}>Account Balance Over Time</h2>
                
                <div className="flex items-center space-x-2">
                  {/* Data validation indicator */}
                  {stats.balanceValidation && (
                    <div className="flex items-center space-x-1">
                      {stats.balanceValidation.isValid ? (
                        <CheckCircleIcon className="w-4 h-4 text-green-500" title="Data validated" />
                      ) : (
                        <AlertTriangleIcon 
                          className="w-4 h-4 text-yellow-500" 
                          title={`Balance difference: $${stats.balanceValidation.difference.toFixed(2)}`} 
                        />
                      )}
                    </div>
                  )}
                  
                  {stats.accountMetricsAvailable && (
                    <InfoIcon 
                      className="w-4 h-4 text-blue-500" 
                      title="Enhanced with account metrics" 
                    />
                  )}
                </div>
              </div>
              
              {/* Balance validation warning */}
              {stats.balanceValidation && !stats.balanceValidation.isValid && (
                <div className="mb-4 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                  <div className="flex items-center space-x-2">
                    <AlertTriangleIcon className="w-3 h-3 text-yellow-500" />
                    <span className={`text-xs ${themeClasses.textSecondary}`}>
                      Chart balance differs from account metrics by ${stats.balanceValidation.difference.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
              
              {performanceChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
                    <XAxis dataKey="date" stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                    <YAxis stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                        border: theme === 'dark' ? '1px solid #374151' : '1px solid #E5E7EB',
                        borderRadius: '8px',
                        color: theme === 'dark' ? '#F9FAFB' : '#111827'
                      }}
                      formatter={(value: number) => [formatCurrency(value), 'Balance']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="balance" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: '#3B82F6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className={themeClasses.textSecondary}>No performance data available</p>
                </div>
              )}
            </motion.div>

            {/* Win/Loss Pie Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              className={`${themeClasses.surface} rounded-xl p-8`}
            >
              <h2 className={`text-xl font-semibold ${themeClasses.text} mb-6`}>Win/Loss Distribution</h2>
              {stats.closedTrades > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={winLossData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {winLossData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                        border: theme === 'dark' ? '1px solid #374151' : '1px solid #E5E7EB',
                        borderRadius: '8px',
                        color: theme === 'dark' ? '#F9FAFB' : '#111827'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className={themeClasses.textSecondary}>No closed trades to display</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Monthly P&L Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className={`${themeClasses.surface} rounded-xl p-8 mb-8`}
          >
            <h2 className={`text-xl font-semibold ${themeClasses.text} mb-6`}>Monthly P&L Performance</h2>
            {monthlyPnLData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyPnLData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
                  <XAxis dataKey="date" stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                  <YAxis stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                      border: theme === 'dark' ? '1px solid #374151' : '1px solid #E5E7EB',
                      borderRadius: '8px',
                      color: theme === 'dark' ? '#F9FAFB' : '#111827'
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'pnl' ? formatCurrency(value) : value,
                      name === 'pnl' ? 'P&L' : 'Trades'
                    ]}
                  />
                  <Bar 
                    dataKey="pnl" 
                    fill="#3B82F6"
                    name="pnl"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <p className={themeClasses.textSecondary}>No monthly data available</p>
              </div>
            )}
          </motion.div>

          {/* AI Habit Analysis Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.4 }}
          >
            <HabitAnalysis />
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}