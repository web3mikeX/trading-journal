"use client"

import { motion } from "framer-motion"
import { TrendingUpIcon, BarChart3Icon, DollarSignIcon, CalendarIcon } from "lucide-react"
import Header from "@/components/Header"
import { useTheme } from "@/components/ThemeProvider"
import { getThemeClasses } from "@/lib/theme"

export default function Analytics() {
  const { theme } = useTheme()
  const themeClasses = getThemeClasses(theme)
  const stats = [
    { label: "Total P&L", value: "$12,345", change: "+15.3%", icon: DollarSignIcon },
    { label: "Win Rate", value: "68%", change: "+2.1%", icon: TrendingUpIcon },
    { label: "Total Trades", value: "247", change: "+12", icon: BarChart3Icon },
    { label: "Avg. Trade", value: "$156", change: "+$23", icon: CalendarIcon },
  ]

  return (
    <div className={`min-h-screen ${themeClasses.background}`}>
      {theme === 'dark' && (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(120,219,226,0.4),rgba(255,255,255,0))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,119,198,0.3),rgba(255,255,255,0))]" />
        </>
      )}
      
      <Header />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className={`text-3xl font-bold ${themeClasses.text} mb-8`}>Trading Analytics</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`${themeClasses.surface} rounded-xl p-6`}
              >
                <div className="flex items-center justify-between mb-4">
                  <stat.icon className={`w-8 h-8 ${themeClasses.accent}`} />
                  <span className="text-sm text-green-400">{stat.change}</span>
                </div>
                <h3 className={`text-2xl font-bold ${themeClasses.text} mb-1`}>{stat.value}</h3>
                <p className={`${themeClasses.textSecondary} text-sm`}>{stat.label}</p>
              </motion.div>
            ))}
          </div>
          
          <div className={`${themeClasses.surface} rounded-xl p-8`}>
            <h2 className={`text-xl font-semibold ${themeClasses.text} mb-6`}>Performance Overview</h2>
            <div className="h-64 flex items-center justify-center">
              <p className={themeClasses.textSecondary}>Chart visualization coming soon...</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}