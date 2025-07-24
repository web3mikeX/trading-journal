"use client"

import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "@/components/ThemeProvider"
import { getThemeClasses } from "@/lib/theme"
import { AlertTriangleIcon, CheckCircleIcon, InfoIcon } from "lucide-react"

interface PerformanceData {
  date: string
  balance: number
  pnl: number
}

interface BalanceValidation {
  isValid: boolean
  difference: number
  withinTolerance: boolean
}

interface PerformanceChartProps {
  data: PerformanceData[]
  title?: string
  height?: number
  balanceValidation?: BalanceValidation | null
  accountMetricsAvailable?: boolean
  currentBalance?: number
}

export default function PerformanceChart({ 
  data, 
  title = "Account Performance", 
  height = 350,
  balanceValidation,
  accountMetricsAvailable,
  currentBalance
}: PerformanceChartProps) {
  const { theme } = useTheme()
  const themeClasses = getThemeClasses(theme)
  
  const isDark = theme === 'dark'
  
  // Theme-aware colors
  const chartColors = {
    stroke: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.8)',
    grid: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.3)',
    gradientColor: '#10B981',
    tooltipBg: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.95)',
    tooltipBorder: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.3)',
    tooltipText: isDark ? 'white' : '#1f2937'
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <Card className={themeClasses.surface}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 
              className={`font-semibold leading-none tracking-tight ${isDark ? "text-white" : "text-black"}`}
              style={!isDark ? { color: '#000000 !important', fontWeight: 'bold' } : { color: 'white' }}
            >
              {title}
            </h3>
            
            {/* Data validation indicator */}
            {balanceValidation && (
              <div className="flex items-center space-x-1">
                {balanceValidation.isValid ? (
                  <CheckCircleIcon className="w-4 h-4 text-green-500" title="Data validated" />
                ) : (
                  <AlertTriangleIcon 
                    className="w-4 h-4 text-yellow-500" 
                    title={`Balance difference: $${balanceValidation.difference.toFixed(2)}`} 
                  />
                )}
              </div>
            )}
            
            {accountMetricsAvailable && (
              <InfoIcon 
                className="w-4 h-4 text-blue-500" 
                title="Enhanced with account metrics" 
              />
            )}
          </div>
          
          {/* Balance validation warning */}
          {balanceValidation && !balanceValidation.isValid && (
            <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
              <div className="flex items-center space-x-2">
                <AlertTriangleIcon className="w-3 h-3 text-yellow-500" />
                <span className={`text-xs ${themeClasses.textSecondary}`}>
                  Chart balance differs from account metrics by ${balanceValidation.difference.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColors.gradientColor} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={chartColors.gradientColor} stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis 
                dataKey="date" 
                stroke={chartColors.stroke}
                fontSize={12}
              />
              <YAxis 
                stroke={chartColors.stroke}
                fontSize={12}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: chartColors.tooltipBg,
                  border: `1px solid ${chartColors.tooltipBorder}`,
                  borderRadius: '12px',
                  color: chartColors.tooltipText
                }}
                formatter={(value: number, name: string) => [
                  `$${value.toLocaleString()}`,
                  name === 'balance' ? 'Balance' : 'P&L'
                ]}
              />
              <Area
                type="monotone"
                dataKey="balance"
                stroke={chartColors.gradientColor}
                strokeWidth={2}
                fill="url(#balanceGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  )
}