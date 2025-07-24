import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount)
}

export function formatPercentage(value: number, decimals = 2) {
  return `${value.toFixed(decimals)}%`
}

// Note: P&L calculations are handled in API routes using contract multipliers
// and comprehensive fee calculations. See /api/trades/route.ts for implementation.

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

// ============================================================================
// SHARED CHART DATA CALCULATION UTILITIES
// ============================================================================

export interface TradeForChartCalculation {
  netPnL: number | null
  grossPnL?: number | null
  entryDate: Date
  exitDate?: Date | null
  status: 'OPEN' | 'CLOSED' | 'CANCELLED'
  commission?: number | null
  entryFees?: number | null
  exitFees?: number | null
}

export interface PreciseBalancePoint {
  date: string
  balance: number
  realizedPnL: number
  unrealizedPnL: number
  totalPnL: number
  totalFees: number
  tradeCount: number
  netBalance: number // balance including fees
}

/**
 * Calculate precise balance for a specific date including fees and open positions
 */
export function calculatePreciseBalanceAtDate(
  startingBalance: number,
  trades: TradeForChartCalculation[],
  targetDate: Date,
  includeUnrealized: boolean = false
): PreciseBalancePoint {
  const targetTime = targetDate.getTime()
  
  // Filter trades that affect balance at this date
  const realizedTrades = trades.filter(trade => 
    trade.status === 'CLOSED' && 
    trade.exitDate && 
    new Date(trade.exitDate).getTime() <= targetTime
  )
  
  const openTrades = includeUnrealized ? trades.filter(trade => 
    trade.status === 'OPEN' && 
    new Date(trade.entryDate).getTime() <= targetTime
  ) : []
  
  // Calculate realized P&L and fees
  const realizedPnL = realizedTrades.reduce((sum, trade) => sum + (trade.netPnL || 0), 0)
  const totalFees = realizedTrades.reduce((sum, trade) => {
    const commission = trade.commission || 0
    const entryFees = trade.entryFees || 0
    const exitFees = trade.exitFees || 0
    return sum + commission + entryFees + exitFees
  }, 0)
  
  // Calculate unrealized P&L (simplified - would need current prices in real implementation)
  const unrealizedPnL = openTrades.reduce((sum, trade) => {
    // For chart purposes, we'll use 0 for unrealized since we don't have real-time prices
    // In a real implementation, this would calculate based on current market prices
    return sum + 0
  }, 0)
  
  const totalPnL = realizedPnL + unrealizedPnL
  const balance = startingBalance + realizedPnL
  const netBalance = balance - totalFees // Balance after accounting for fees separately
  
  return {
    date: targetDate.toISOString().split('T')[0],
    balance,
    realizedPnL,
    unrealizedPnL,
    totalPnL,
    totalFees,
    tradeCount: realizedTrades.length,
    netBalance
  }
}

/**
 * Generate precise performance data for charts with daily granularity option
 */
export function generatePrecisePerformanceData(
  startingBalance: number,
  trades: TradeForChartCalculation[],
  startDate: Date,
  endDate: Date = new Date(),
  granularity: 'daily' | 'weekly' | 'monthly' = 'monthly',
  includeUnrealized: boolean = false
): PreciseBalancePoint[] {
  const result: PreciseBalancePoint[] = []
  const current = new Date(startDate)
  
  while (current <= endDate) {
    const balancePoint = calculatePreciseBalanceAtDate(
      startingBalance,
      trades,
      new Date(current),
      includeUnrealized
    )
    
    result.push(balancePoint)
    
    // Advance date based on granularity
    switch (granularity) {
      case 'daily':
        current.setDate(current.getDate() + 1)
        break
      case 'weekly':
        current.setDate(current.getDate() + 7)
        break
      case 'monthly':
        current.setMonth(current.getMonth() + 1)
        break
    }
  }
  
  return result
}

/**
 * Generate monthly performance data (backwards compatible with existing charts)
 */
export function generateMonthlyPerformanceData(
  startingBalance: number,
  trades: TradeForChartCalculation[],
  monthsBack: number = 6,
  includeUnrealized: boolean = false
): Array<{date: string, balance: number, pnl: number, trades: number}> {
  const result = []
  const currentMonth = new Date()
  
  for (let i = monthsBack - 1; i >= 0; i--) {
    const monthDate = new Date(currentMonth)
    monthDate.setMonth(monthDate.getMonth() - i)
    monthDate.setDate(1) // Start of month
    
    const monthEnd = new Date(monthDate)
    monthEnd.setMonth(monthEnd.getMonth() + 1)
    monthEnd.setDate(0) // End of month
    
    const balancePoint = calculatePreciseBalanceAtDate(
      startingBalance,
      trades,
      monthEnd,
      includeUnrealized
    )
    
    // Calculate monthly P&L
    const prevMonthEnd = new Date(monthDate)
    prevMonthEnd.setDate(0) // Previous month end
    
    const prevBalancePoint = calculatePreciseBalanceAtDate(
      startingBalance,
      trades,
      prevMonthEnd,
      includeUnrealized
    )
    
    const monthlyPnL = balancePoint.realizedPnL - prevBalancePoint.realizedPnL
    
    result.push({
      date: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`,
      balance: balancePoint.balance,
      pnl: monthlyPnL,
      trades: balancePoint.tradeCount - prevBalancePoint.tradeCount
    })
  }
  
  return result
}

/**
 * Validate balance data consistency
 */
export function validateBalanceConsistency(
  calculatedBalance: number,
  expectedBalance: number,
  tolerance: number = 0.01
): { isValid: boolean; difference: number; withinTolerance: boolean } {
  const difference = Math.abs(calculatedBalance - expectedBalance)
  const withinTolerance = difference <= tolerance
  
  return {
    isValid: withinTolerance,
    difference,
    withinTolerance
  }
}