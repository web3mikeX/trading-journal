import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'
import { getCurrentWeekRange, formatWeekRange, filterTradesByWeek } from '@/lib/dateUtils'

// GET /api/stats - Get trading statistics for dashboard (updated for week-based recent trades)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get all trades for the user
    const allTrades = await prisma.trade.findMany({
      where: { userId },
      select: {
        id: true,
        symbol: true,
        side: true,
        entryDate: true,
        exitDate: true,
        netPnL: true,
        status: true,
        entryPrice: true,
        quantity: true
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
    
    // Get user's initial balance for return percentage calculation
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { initialBalance: true }
    })
    const initialBalance = user?.initialBalance || 10000
    const currentMonthReturn = (currentMonthPnL / initialBalance) * 100

    // Performance data for the last 6 months
    const performanceData = []
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(currentMonth, i)
      const monthStart = startOfMonth(monthDate)
      const monthEnd = endOfMonth(monthDate)
      
      const monthTrades = closedTrades.filter(trade => 
        trade.exitDate && trade.exitDate >= monthStart && trade.exitDate <= monthEnd
      )
      
      const monthPnL = monthTrades.reduce((sum, trade) => sum + (trade.netPnL || 0), 0)
      const runningBalance = initialBalance + closedTrades
        .filter(trade => trade.exitDate && trade.exitDate <= monthEnd)
        .reduce((sum, trade) => sum + (trade.netPnL || 0), 0)
      
      performanceData.push({
        date: format(monthDate, 'yyyy-MM'),
        balance: runningBalance,
        pnl: monthPnL,
        trades: monthTrades.length
      })
    }

    // Recent trades (current week's trades)
    console.log('DEBUG: Getting current week range...')
    const { start: weekStart, end: weekEnd } = getCurrentWeekRange()
    console.log('DEBUG: Week range:', weekStart.toISOString(), 'to', weekEnd.toISOString())
    const currentWeekTrades = filterTradesByWeek(allTrades, weekStart, weekEnd)
    console.log('DEBUG: Current week trades:', currentWeekTrades.length)
    const weekLabel = formatWeekRange(weekStart, weekEnd)
    console.log('DEBUG: Week label:', weekLabel)
    
    const recentTrades = currentWeekTrades.map(trade => ({
      id: trade.id,
      symbol: trade.symbol,
      side: trade.side,
      entryDate: trade.entryDate,
      exitDate: trade.exitDate,
      netPnL: trade.netPnL,
      status: trade.status
    }))
    
    // Add week metadata
    const weekMetadata = {
      weekStart,
      weekEnd,
      weekLabel,
      tradeCount: currentWeekTrades.length
    }

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
      weekMetadata,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length
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