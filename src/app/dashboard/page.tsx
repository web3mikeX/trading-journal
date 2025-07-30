"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, useMemo, useCallback } from "react"
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
import AccountReport from "@/components/Dashboard/AccountReport"
import TradingCalendar from "@/components/TradingCalendar"
import CalendarDayModal from "@/components/CalendarDayModal"
import TradeDetailModal from "@/components/TradeDetailModal"
import Header from "@/components/Header"
import ErrorBoundary from "@/components/ErrorBoundary"
import AIChat from "@/components/AIChat"
import EconomicCalendar from "@/components/EconomicCalendar"
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
  const [mounted, setMounted] = useState(false)
  
  // All hooks must be called consistently - moved to top level
  const { stats, loading: statsLoading, error: statsError, refetchStats } = useStats(user?.id || '')
  
  // Calendar modal state - always declared
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedDayData, setSelectedDayData] = useState<CalendarDayData | undefined>()
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false)
  
  // Trade detail modal state - always declared
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null)
  const [isTradeDetailModalOpen, setIsTradeDetailModalOpen] = useState(false)

  // Always call useCallback hooks
  const handleDayClick = useCallback((date: string, dayData?: CalendarDayData) => {
    setSelectedDate(date)
    setSelectedDayData(dayData)
    setIsCalendarModalOpen(true)
  }, [])

  const closeCalendarModal = useCallback(() => {
    setIsCalendarModalOpen(false)
    setSelectedDate('')
    setSelectedDayData(undefined)
  }, [])

  const handleTradeClick = useCallback((tradeId: string) => {
    try {
      console.log('Dashboard: Handling trade click for ID:', tradeId)
      if (!tradeId) {
        console.error('Dashboard: No tradeId provided')
        return
      }
      setSelectedTradeId(tradeId)
      setIsTradeDetailModalOpen(true)
    } catch (error) {
      console.error('Dashboard: Error handling trade click:', error)
    }
  }, [])

  const closeTradeDetailModal = useCallback(() => {
    setIsTradeDetailModalOpen(false)
    setSelectedTradeId(null)
  }, [])

  const onSaveSuccess = useCallback(() => {
    console.log('📅 Calendar save success - refreshing data without page reload')
    // Close modal
    setIsCalendarModalOpen(false)
    setSelectedDate('')
    setSelectedDayData(undefined)
    
    // Refresh calendar data without page reload
    if (window.refreshTradingCalendar) {
      window.refreshTradingCalendar()
    }
    
    // Refresh stats to reflect any changes
    refetchStats()
  }, [refetchStats])

  // Always call useMemo hooks
  const memoizedSelectedDayData = useMemo(() => selectedDayData, [selectedDayData])

  // Fix hydration mismatch by waiting for component to mount
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      router.push("/auth/register")
    }
  }, [mounted, isAuthenticated, isLoading, router])

  // Always render the same content on server and client initially
  if (!mounted) {
    return (
      <div className={`min-h-screen ${themeClasses.background}`}>
        <Header />
        <div className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className={`text-4xl font-bold ${themeClasses.text} mb-2`}>
                DetaWise
              </h1>
              <p className={themeClasses.textSecondary}>
                Loading your dashboard...
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

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

  if (statsLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${themeClasses.background}`}>
        <div className={`text-lg ${themeClasses.text}`}>Loading dashboard...</div>
      </div>
    )
  }

  if (statsError) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${themeClasses.background}`}>
        <div className="text-lg text-red-400 mb-4">Error loading dashboard: {statsError}</div>
        <div className="text-sm text-gray-500 mb-4">
          It looks like you need to create an account first.
        </div>
        <button 
          onClick={() => router.push("/auth/register")}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Create Account
        </button>
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
                value={`${(stats.winRate ?? 0).toFixed(1)}%`}
                icon={TargetIcon}
                valueColor={(stats.winRate ?? 0) >= 50 ? "success" : "warning"}
              />
              <MetricCard
                title="Total Trades"
                value={(stats.totalTrades ?? 0).toString()}
                icon={BarChart3Icon}
              />
              <MetricCard
                title="Profit Factor"
                value={(stats.profitFactor ?? 0).toFixed(2)}
                icon={TrophyIcon}
                valueColor={(stats.profitFactor ?? 0) >= 1 ? "success" : "danger"}
              />
            </div>
          </div>
        </div>


        {/* Trading Calendar */}
        <div className="px-6 mb-8">
          <div className="max-w-7xl mx-auto">
            <ErrorBoundary fallback={
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
                <p className="text-red-600 dark:text-red-400">Calendar temporarily unavailable</p>
              </div>
            }>
              <TradingCalendar 
                onDayClick={handleDayClick}
                userId={user?.id || ''}
                onRefreshNeeded={() => {}} // Enable refresh capability
              />
            </ErrorBoundary>
          </div>
        </div>

        {/* Charts and Recent Trades */}
        <div className="px-6 mb-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-2">
                <PerformanceChart 
                  data={stats.performanceData}
                  balanceValidation={stats.balanceValidation}
                  accountMetricsAvailable={stats.accountMetricsAvailable}
                  currentBalance={stats.currentBalance}
                />
              </div>
              <div className="h-[430px]">
                <ErrorBoundary>
                  <AccountReport 
                    trades={stats.recentTrades} 
                  />
                </ErrorBoundary>
              </div>
            </div>
          </div>
        </div>

        {/* Economic Calendar */}
        <div className="px-6 mb-8">
          <div className="max-w-7xl mx-auto">
            <h2 className={`text-2xl font-bold ${themeClasses.text} mb-4`}>Economic Calendar</h2>
            <div className={`p-6 rounded-lg ${themeClasses.surface} border ${themeClasses.border}`}>
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Track key economic events and announcements that may impact your trading
                </div>
              </div>
              <EconomicCalendar
                width="100%"
                height={600}
                importanceFilter="-1,0,1"
                countryFilter="us,eu,gb,jp,ca,au,nz,ch"
                className="rounded-lg overflow-hidden"
                isTransparent={false}
              />
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
                value={`${(stats.currentMonthReturn ?? 0).toFixed(1)}%`}
                icon={CalendarIcon}
                valueColor={(stats.currentMonthReturn ?? 0) >= 0 ? "success" : "danger"}
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
        userId={user?.id || ''}
        initialData={memoizedSelectedDayData}
        onSaveSuccess={onSaveSuccess}
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
          console.log('🗑️ Trade deleted - refreshing data without page reload')
          closeTradeDetailModal()
          // Refresh calendar data to reflect the deleted trade
          if (window.refreshTradingCalendar) {
            window.refreshTradingCalendar()
          }
          // Refresh stats to reflect the deleted trade
          refetchStats()
        }}
      />

      {/* AI Chat Assistant */}
      <AIChat />
    </>
  )
}

export default function Dashboard() {
  return <DashboardContent />
}