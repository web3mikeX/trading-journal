"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { motion } from "framer-motion"
import { 
  TrendingUpIcon, 
  DollarSignIcon, 
  TargetIcon, 
  BarChart3Icon,
  CalendarIcon,
  TrophyIcon
} from "lucide-react"

import MetricCard from "@/components/Dashboard/MetricCard"
import PerformanceChart from "@/components/Dashboard/PerformanceChart"
import RecentTrades from "@/components/Dashboard/RecentTrades"
import TradingCalendar from "@/components/TradingCalendar"
import CalendarDayModal from "@/components/CalendarDayModal"
import TradeDetailModal from "@/components/TradeDetailModal"
import Header from "@/components/Header"
import { formatCurrency } from "@/lib/utils"
import { useStats } from "@/hooks/useStats"
import { useTheme } from "@/components/ThemeProvider"
import { getThemeClasses } from "@/lib/theme"

interface CalendarDayData {
  date: string
  pnl: number
  tradesCount: number
  winRate: number
  hasNotes: boolean
  hasImages: boolean
  mood?: number
}

function DashboardContent() {
  const { theme } = useTheme()
  const themeClasses = getThemeClasses(theme)
  const { isAuthenticated, user, isLoading } = useAuth()
  const router = useRouter()
  const { stats, loading, error: statsError } = useStats(user?.id || 'demo-demo-example-com')
  
  // Calendar modal state
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedDayData, setSelectedDayData] = useState<CalendarDayData | undefined>()
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false)
  
  // Trade detail modal state
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null)
  const [isTradeDetailModalOpen, setIsTradeDetailModalOpen] = useState(false)

  const handleDayClick = (date: string, dayData?: CalendarDayData) => {
    setSelectedDate(date)
    setSelectedDayData(dayData)
    setIsCalendarModalOpen(true)
  }

  const closeCalendarModal = () => {
    setIsCalendarModalOpen(false)
    setSelectedDate('')
    setSelectedDayData(undefined)
  }

  const handleTradeClick = (tradeId: string) => {
    setSelectedTradeId(tradeId)
    setIsTradeDetailModalOpen(true)
  }

  const closeTradeDetailModal = () => {
    setIsTradeDetailModalOpen(false)
    setSelectedTradeId(null)
  }

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
        <div className={`text-lg ${themeClasses.text}`}>Loading dashboard...</div>
      </div>
    )
  }

  if (statsError) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${themeClasses.background}`}>
        <div className="text-lg text-red-400">Error loading dashboard: {statsError}</div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${themeClasses.background}`}>
        <div className={`text-lg ${themeClasses.text}`}>No data available</div>
      </div>
    )
  }

  return (
    <>
      <Header />
      <div className={`min-h-screen ${themeClasses.background}`}>
        <div>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="px-6 py-8"
        >
          <div className="max-w-7xl mx-auto">
            <h1 className={`text-4xl font-bold ${themeClasses.text} mb-2`}>
              Welcome back, {user?.name || "Trader"}
            </h1>
            <p className={themeClasses.textSecondary}>
              Here&apos;s your trading performance overview
            </p>
          </div>
        </motion.div>

        {/* Metrics Grid */}
        <div className="px-6 mb-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total P&L"
                value={formatCurrency(stats.totalPnL)}
                change={stats.currentMonthReturn}
                changeLabel="this month"
                icon={DollarSignIcon}
                valueColor={stats.totalPnL >= 0 ? "success" : "danger"}
              />
              <MetricCard
                title="Win Rate"
                value={`${stats.winRate.toFixed(1)}%`}
                icon={TargetIcon}
                valueColor={stats.winRate >= 50 ? "success" : "warning"}
              />
              <MetricCard
                title="Total Trades"
                value={stats.totalTrades.toString()}
                icon={BarChart3Icon}
              />
              <MetricCard
                title="Profit Factor"
                value={stats.profitFactor.toFixed(2)}
                icon={TrophyIcon}
                valueColor={stats.profitFactor >= 1 ? "success" : "danger"}
              />
            </div>
          </div>
        </div>

        {/* Trading Calendar */}
        <div className="px-6 mb-8">
          <div className="max-w-7xl mx-auto">
            <TradingCalendar 
              onDayClick={handleDayClick}
              userId={user?.id || 'demo-demo-example-com'}
            />
          </div>
        </div>

        {/* Charts and Recent Trades */}
        <div className="px-6 mb-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-2">
                <PerformanceChart data={stats.performanceData} />
              </div>
              <div className="h-[430px]">
                <RecentTrades 
                  trades={stats.recentTrades} 
                  weekMetadata={stats.weekMetadata}
                  onTradeClick={handleTradeClick}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="px-6 mb-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                title="Average Win"
                value={formatCurrency(stats.averageWin)}
                icon={TrendingUpIcon}
                valueColor="success"
              />
              <MetricCard
                title="Average Loss"
                value={formatCurrency(stats.averageLoss)}
                icon={TrendingUpIcon}
                valueColor="danger"
              />
              <MetricCard
                title="Monthly Return"
                value={`${stats.currentMonthReturn.toFixed(1)}%`}
                icon={CalendarIcon}
                valueColor={stats.currentMonthReturn >= 0 ? "success" : "danger"}
              />
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Calendar Day Modal */}
      <CalendarDayModal
        isOpen={isCalendarModalOpen}
        onClose={closeCalendarModal}
        date={selectedDate}
        userId={user?.id || 'demo-demo-example-com'}
        initialData={selectedDayData}
        onSaveSuccess={() => {
          // Refresh the page after successful save
          window.location.reload()
        }}
      />

      {/* Trade Detail Modal */}
      <TradeDetailModal
        isOpen={isTradeDetailModalOpen}
        onClose={closeTradeDetailModal}
        tradeId={selectedTradeId}
        onEdit={(tradeId) => {
          closeTradeDetailModal()
          router.push(`/trades?edit=${tradeId}`)
        }}
        onDelete={() => {
          closeTradeDetailModal()
          window.location.reload()
        }}
      />
    </>
  )
}

export default function Dashboard() {
  return <DashboardContent />
}