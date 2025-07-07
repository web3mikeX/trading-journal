import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/stats - Get trading statistics for dashboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get all trades for the user
    const trades = await prisma.trade.findMany({
      where: { userId },
      orderBy: { entryDate: 'desc' }
    })

    // Calculate basic statistics
    const totalTrades = trades.length
    const openTrades = trades.filter((trade: any) => trade.status === 'OPEN').length
    const closedTrades = trades.filter((trade: any) => trade.status === 'CLOSED')
    
    const totalPnL = closedTrades.reduce((sum: number, trade: any) => sum + (trade.netPnL || 0), 0)
    const winningTrades = closedTrades.filter((trade: any) => (trade.netPnL || 0) > 0)
    const losingTrades = closedTrades.filter((trade: any) => (trade.netPnL || 0) < 0)
    
    const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0
    
    const averageWin = winningTrades.length > 0 
      ? winningTrades.reduce((sum, trade) => sum + (trade.netPnL || 0), 0) / winningTrades.length 
      : 0
      
    const averageLoss = losingTrades.length > 0 
      ? Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.netPnL || 0), 0) / losingTrades.length)
      : 0
    
    const profitFactor = averageLoss > 0 ? averageWin / averageLoss : 0

    // Calculate monthly performance data for charts
    const monthlyData = trades
      .filter(trade => trade.status === 'CLOSED' && trade.exitDate)
      .reduce((acc, trade) => {
        const month = trade.exitDate!.toISOString().substring(0, 7) // YYYY-MM format
        if (!acc[month]) {
          acc[month] = { pnl: 0, trades: 0 }
        }
        acc[month].pnl += trade.netPnL || 0
        acc[month].trades += 1
        return acc
      }, {} as Record<string, { pnl: number; trades: number }>)

    // Convert to array and calculate running balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { initialBalance: true }
    })

    const initialBalance = user?.initialBalance || 10000
    let runningBalance = initialBalance

    const performanceData = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => {
        runningBalance += data.pnl
        return {
          date: month,
          balance: runningBalance,
          pnl: data.pnl,
          trades: data.trades
        }
      })

    // Get recent trades (last 5)
    const recentTrades = trades.slice(0, 5).map(trade => ({
      id: trade.id,
      symbol: trade.symbol,
      side: trade.side,
      entryDate: trade.entryDate,
      exitDate: trade.exitDate,
      netPnL: trade.netPnL,
      status: trade.status
    }))

    // Calculate current month's performance
    const currentMonth = new Date().toISOString().substring(0, 7)
    const currentMonthTrades = trades.filter(trade => 
      trade.exitDate?.toISOString().substring(0, 7) === currentMonth
    )
    const currentMonthPnL = currentMonthTrades.reduce((sum, trade) => sum + (trade.netPnL || 0), 0)
    const currentMonthReturn = initialBalance > 0 ? (currentMonthPnL / initialBalance) * 100 : 0

    const stats = {
      totalPnL,
      winRate,
      totalTrades,
      openTrades,
      closedTrades: closedTrades.length,
      profitFactor,
      averageWin,
      averageLoss: -averageLoss, // Make it negative for display
      currentMonthReturn,
      performanceData,
      recentTrades,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}