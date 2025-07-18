"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowUpIcon, ArrowDownIcon, Eye, Calendar, Brain, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useTheme } from "@/components/ThemeProvider"
import { getThemeClasses } from "@/lib/theme"

interface Trade {
  id: string
  symbol: string
  side: "LONG" | "SHORT"
  entryDate: Date
  exitDate?: Date
  netPnL?: number
  status: "OPEN" | "CLOSED" | "CANCELLED"
  aiSummary?: string
  notes?: string
}

interface WeekMetadata {
  weekStart: Date
  weekEnd: Date
  weekLabel: string
  tradeCount: number
}

interface RecentTradesProps {
  trades: Trade[]
  weekMetadata?: WeekMetadata
  onTradeClick?: (tradeId: string) => void
}

export default function RecentTrades({ trades, weekMetadata, onTradeClick }: RecentTradesProps) {
  const { theme } = useTheme()
  const themeClasses = getThemeClasses(theme)
  const isDark = theme === 'dark'
  const [showSummary, setShowSummary] = useState(true)
  
  const handleTradeClick = (tradeId: string) => {
    try {
      console.log('RecentTrades: Clicking trade with ID:', tradeId)
      if (onTradeClick && tradeId) {
        onTradeClick(tradeId)
      } else {
        console.warn('RecentTrades: Missing onTradeClick handler or tradeId')
      }
    } catch (error) {
      console.error('RecentTrades: Error handling trade click:', error)
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="h-full"
    >
      <Card className={`${themeClasses.surface} h-full flex flex-col`}>
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 
              className={`font-semibold leading-none tracking-tight ${isDark ? "text-white" : "text-black"}`}
              style={!isDark ? { color: '#000000 !important', fontWeight: 'bold' } : { color: 'white' }}
            >
              This Week's Trades
            </h3>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowSummary(!showSummary)}
                className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  showSummary 
                    ? 'bg-blue-500/20 text-blue-400' 
                    : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                }`}
              >
                {showSummary ? (
                  <>
                    <Brain className="w-3 h-3" />
                    <span>AI Summary</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-3 h-3" />
                    <span>Notes</span>
                  </>
                )}
              </button>
              {weekMetadata && (
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className={`text-sm ${themeClasses.textSecondary}`}>
                    {weekMetadata.weekLabel}
                  </span>
                </div>
              )}
            </div>
          </div>
          {weekMetadata && (
            <p className={`text-sm ${themeClasses.textSecondary} mt-1`}>
              {weekMetadata.tradeCount} {weekMetadata.tradeCount === 1 ? 'trade' : 'trades'} this week
            </p>
          )}
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-4">
              {trades.length === 0 ? (
                <p className={`${themeClasses.textSecondary} text-center py-8`}>
                  No trades this week. Start by adding your first trade!
                </p>
              ) : (
                trades.map((trade, index) => (
                <motion.div
                  key={trade.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`group flex items-start justify-between p-4 rounded-lg transition-all cursor-pointer ${
                    isDark 
                      ? "bg-white/5 hover:bg-white/10 hover:shadow-md" 
                      : "bg-gray-100/50 hover:bg-gray-100 hover:shadow-md"
                  }`}
                  onClick={() => handleTradeClick(trade.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      trade.side === "LONG" 
                        ? "bg-green-500/20 text-green-400" 
                        : "bg-red-500/20 text-red-400"
                    }`}>
                      {trade.side === "LONG" ? (
                        <ArrowUpIcon className="w-4 h-4" />
                      ) : (
                        <ArrowDownIcon className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${themeClasses.text}`}>{trade.symbol}</p>
                      <p className={`text-sm ${themeClasses.textSecondary}`}>
                        {formatDate(trade.entryDate)}
                      </p>
                      {/* AI Summary or Notes */}
                      {showSummary && trade.aiSummary && (
                        <div className="mt-1 flex items-center space-x-1">
                          <Brain className="w-3 h-3 text-blue-400 flex-shrink-0" />
                          <p className={`text-xs ${themeClasses.textSecondary} truncate`}>
                            {trade.aiSummary}
                          </p>
                        </div>
                      )}
                      {!showSummary && trade.notes && (
                        <div className="mt-1 flex items-center space-x-1">
                          <FileText className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <p className={`text-xs ${themeClasses.textSecondary} truncate`}>
                            {trade.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        trade.status === "OPEN" 
                          ? "bg-blue-500/20 text-blue-400"
                          : trade.status === "CLOSED"
                          ? "bg-gray-500/20 text-gray-400"
                          : "bg-red-500/20 text-red-400"
                      }`}>
                        {trade.status.toLowerCase()}
                      </div>
                      {trade.netPnL !== undefined && trade.netPnL !== null && (
                        <p className={`text-sm font-medium mt-1 ${
                          trade.netPnL >= 0 ? "text-green-400" : "text-red-400"
                        }`}>
                          {formatCurrency(trade.netPnL)}
                        </p>
                      )}
                    </div>
                    <div className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}>
                      <Eye className="w-4 h-4" />
                    </div>
                  </div>
                </motion.div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}