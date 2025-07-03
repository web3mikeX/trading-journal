"use client"

import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PerformanceData {
  date: string
  balance: number
  pnl: number
}

interface PerformanceChartProps {
  data: PerformanceData[]
  title?: string
  height?: number
}

export default function PerformanceChart({ 
  data, 
  title = "Account Performance", 
  height = 350 
}: PerformanceChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <Card className="border-white/20 bg-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="date" 
                stroke="rgba(255,255,255,0.6)"
                fontSize={12}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.6)"
                fontSize={12}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  color: 'white'
                }}
                formatter={(value: number, name: string) => [
                  `$${value.toLocaleString()}`,
                  name === 'balance' ? 'Balance' : 'P&L'
                ]}
              />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="#10B981"
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