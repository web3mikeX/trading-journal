"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAuth } from "@/components/SimpleAuth"
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
import SimpleHeader from "@/components/SimpleHeader"
import { formatCurrency } from "@/lib/utils"

function DashboardContent() {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()

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

  // Mock data for demonstration
  const performanceData = [
    { date: "Jan", balance: 10000, pnl: 0 },
    { date: "Feb", balance: 10250, pnl: 250 },
    { date: "Mar", balance: 10100, pnl: -150 },
    { date: "Apr", balance: 10450, pnl: 350 },
    { date: "May", balance: 10800, pnl: 350 },
    { date: "Jun", balance: 11200, pnl: 400 },
  ]

  const recentTrades = [
    {
      id: "1",
      symbol: "AAPL",
      side: "LONG" as const,
      entryDate: new Date("2024-01-15"),
      exitDate: new Date("2024-01-16"),
      netPnL: 250.50,
      status: "CLOSED" as const
    },
    {
      id: "2",
      symbol: "MSFT",
      side: "SHORT" as const,
      entryDate: new Date("2024-01-14"),
      netPnL: -125.75,
      status: "CLOSED" as const
    },
    {
      id: "3",
      symbol: "GOOGL",
      side: "LONG" as const,
      entryDate: new Date("2024-01-13"),
      status: "OPEN" as const
    }
  ]

  return (
    <>
      <SimpleHeader />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(120,219,226,0.4),rgba(255,255,255,0))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,119,198,0.3),rgba(255,255,255,0))]" />
        
        <div className="relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="px-6 py-8"
        >
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold text-white mb-2">
              Welcome back, {user?.name || "Trader"}
            </h1>
            <p className="text-gray-300">
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
                value={formatCurrency(1200.50)}
                change={12.5}
                changeLabel="this month"
                icon={DollarSignIcon}
                valueColor="success"
              />
              <MetricCard
                title="Win Rate"
                value="68.5%"
                change={5.2}
                changeLabel="vs last month"
                icon={TargetIcon}
                valueColor="success"
              />
              <MetricCard
                title="Total Trades"
                value="47"
                change={8.3}
                changeLabel="this month"
                icon={BarChart3Icon}
              />
              <MetricCard
                title="Profit Factor"
                value="1.82"
                change={-2.1}
                changeLabel="vs last month"
                icon={TrophyIcon}
                valueColor="warning"
              />
            </div>
          </div>
        </div>

        {/* Charts and Recent Trades */}
        <div className="px-6 mb-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <PerformanceChart data={performanceData} />
              </div>
              <div>
                <RecentTrades trades={recentTrades} />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="px-6 pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                title="Average Win"
                value={formatCurrency(425.80)}
                icon={TrendingUpIcon}
                valueColor="success"
              />
              <MetricCard
                title="Average Loss"
                value={formatCurrency(-234.20)}
                icon={TrendingUpIcon}
                valueColor="danger"
              />
              <MetricCard
                title="Monthly Return"
                value="12.5%"
                change={3.2}
                changeLabel="vs last month"
                icon={CalendarIcon}
                valueColor="success"
              />
            </div>
          </div>
        </div>
        </div>
      </div>
    </>
  )
}

export default function Dashboard() {
  return <DashboardContent />
}