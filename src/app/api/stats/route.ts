import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'
import { 
  generateMonthlyPerformanceData, 
  generatePrecisePerformanceData,
  validateBalanceConsistency,
  type TradeForChartCalculation 
} from '@/lib/utils'
import { getAccountMetrics } from '@/lib/trailingDrawdown'
// GET /api/stats - Get trading statistics for dashboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const granularity = searchParams.get('granularity') as 'daily' | 'weekly' | 'monthly' || 'monthly'
    const monthsBack = parseInt(searchParams.get('monthsBack') || '6')
    const includeUnrealized = searchParams.get('includeUnrealized') === 'true'

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get comprehensive account metrics for precise balance calculations
    const accountMetrics = await getAccountMetrics(userId)
    
    // Get all trades for the user with extended data for chart calculations
    const allTrades = await prisma.trade.findMany({
      where: { userId },
      select: {
        id: true,
        symbol: true,
        side: true,
        entryDate: true,
        exitDate: true,
        netPnL: true,
        grossPnL: true,
        status: true,
        entryPrice: true,
        quantity: true,
        commission: true,
        entryFees: true,
        exitFees: true
      },
      orderBy: { entryDate: 'desc' }
    })

    // Calculate basic stats
    const totalTrades = allTrades.length
    const closedTrades = allTrades.filter(trade => trade.status === 'CLOSED')
    const openTrades = allTrades.filter(trade => trade.status === 'OPEN')
    const totalPnL = closedTrades.reduce((sum, trade) => sum + (trade.netPnL || 0), 0)
    
    // Win rate calculations
    const winningTrades = closedTrades.filter(trade => (trade.netPnL || 0) > 0)
    const losingTrades = closedTrades.filter(trade => (trade.netPnL || 0) < 0)
    const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0

    // Average win/loss calculations
    const totalWins = winningTrades.reduce((sum, trade) => sum + (trade.netPnL || 0), 0)
    const totalLosses = Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.netPnL || 0), 0))
    const averageWin = winningTrades.length > 0 ? totalWins / winningTrades.length : 0
    const averageLoss = losingTrades.length > 0 ? -totalLosses / losingTrades.length : 0

    // Profit factor
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? 999 : 0

    // Current month return calculation
    const currentMonth = new Date()
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    
    const currentMonthTrades = closedTrades.filter(trade => 
      trade.exitDate && trade.exitDate >= monthStart && trade.exitDate <= monthEnd
    )
    const currentMonthPnL = currentMonthTrades.reduce((sum, trade) => sum + (trade.netPnL || 0), 0)
    
    // Get user's account configuration for precise calculations
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        initialBalance: true,
        startingBalance: true,
        accountStartDate: true
      }
    })
    
    // Use startingBalance from account metrics if available, fallback to initialBalance
    const startingBalance = user?.startingBalance || user?.initialBalance || 10000
    const currentMonthReturn = (currentMonthPnL / startingBalance) * 100

    // Generate precise performance data using the new shared utility
    const tradesForCalculation: TradeForChartCalculation[] = allTrades.map(trade => ({
      netPnL: trade.netPnL,
      grossPnL: trade.grossPnL,
      entryDate: trade.entryDate,
      exitDate: trade.exitDate,
      status: trade.status as 'OPEN' | 'CLOSED' | 'CANCELLED',
      commission: trade.commission,
      entryFees: trade.entryFees,
      exitFees: trade.exitFees
    }))

    // Generate performance data with requested granularity
    let performanceData
    if (granularity === 'daily' || granularity === 'weekly') {
      // For daily/weekly, use the enhanced function
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - monthsBack)
      
      const preciseData = generatePrecisePerformanceData(
        startingBalance,
        tradesForCalculation,
        startDate,
        new Date(),
        granularity,
        includeUnrealized
      )
      
      // Convert to format expected by charts
      performanceData = preciseData.map(point => ({
        date: granularity === 'daily' 
          ? new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        balance: point.balance,
        pnl: point.realizedPnL - (preciseData[preciseData.indexOf(point) - 1]?.realizedPnL || 0),
        trades: point.tradeCount - (preciseData[preciseData.indexOf(point) - 1]?.tradeCount || 0)
      }))
    } else {
      // Use monthly data (backward compatible)
      performanceData = generateMonthlyPerformanceData(
        startingBalance,
        tradesForCalculation,
        monthsBack,
        includeUnrealized
      )
    }

    // Validate consistency with account metrics if available
    let balanceValidation = null
    if (accountMetrics) {
      const latestPerformanceBalance = performanceData[performanceData.length - 1]?.balance || startingBalance
      balanceValidation = validateBalanceConsistency(
        latestPerformanceBalance,
        accountMetrics.currentBalance,
        1.0 // Allow $1 tolerance for minor calculation differences
      )
    }

    // Recent trades (latest 10 trades)
    const recentTrades = allTrades.slice(0, 10).map(trade => ({
      id: trade.id,
      symbol: trade.symbol,
      side: trade.side,
      entryDate: trade.entryDate,
      exitDate: trade.exitDate,
      netPnL: trade.netPnL,
      status: trade.status
    }))

    const response = NextResponse.json({
      totalPnL: Number(totalPnL.toFixed(2)),
      winRate: Number(winRate.toFixed(1)),
      totalTrades,
      openTrades: openTrades.length,
      closedTrades: closedTrades.length,
      profitFactor: Number(profitFactor.toFixed(2)),
      averageWin: Number(averageWin.toFixed(2)),
      averageLoss: Number(averageLoss.toFixed(2)),
      currentMonthReturn: Number(currentMonthReturn.toFixed(1)),
      performanceData,
      recentTrades,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      // Enhanced data for chart precision
      balanceValidation,
      accountMetricsAvailable: !!accountMetrics,
      currentBalance: accountMetrics?.currentBalance,
      startingBalance,
      granularity,
      monthsBack,
      includeUnrealized
    })

    // Add caching headers for better performance
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60')
    return response

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: errorMessage
    }, { status: 500 })
  }
}