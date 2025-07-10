import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, startOfMonth, endOfMonth, parseISO } from 'date-fns'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const date = searchParams.get('date') || '2025-07-07'
  
  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 })
  }

  // Parse the date
  const targetDate = new Date(date)
  const dayStart = startOfDay(targetDate)
  const dayEnd = endOfDay(targetDate)

  // Get trades for the specific day
  const dayTrades = await prisma.trade.findMany({
    where: {
      userId,
      entryDate: {
        gte: dayStart,
        lte: dayEnd
      }
    },
    select: {
      id: true,
      symbol: true,
      entryDate: true,
      netPnL: true,
      status: true
    },
    orderBy: { entryDate: 'asc' }
  })

  // Get trades using UTC date range
  const utcTrades = await prisma.trade.findMany({
    where: {
      userId,
      entryDate: {
        gte: new Date(date + 'T00:00:00.000Z'),
        lte: new Date(date + 'T23:59:59.999Z')
      }
    },
    select: {
      id: true,
      symbol: true,
      entryDate: true,
      netPnL: true,
      status: true
    },
    orderBy: { entryDate: 'asc' }
  })

  // Get all trades for the month to see grouping
  const monthStart = startOfMonth(targetDate)
  const monthEnd = endOfMonth(targetDate)
  
  const monthTrades = await prisma.trade.findMany({
    where: {
      userId,
      entryDate: {
        gte: monthStart,
        lte: monthEnd
      }
    },
    select: {
      id: true,
      symbol: true,
      entryDate: true,
      netPnL: true,
      status: true
    },
    orderBy: { entryDate: 'asc' }
  })

  // Group month trades by date (same logic as calendar month API)
  const tradesByDate: { [date: string]: typeof monthTrades } = {}
  monthTrades.forEach(trade => {
    const dateKey = trade.entryDate.toISOString().split('T')[0]
    if (!tradesByDate[dateKey]) {
      tradesByDate[dateKey] = []
    }
    tradesByDate[dateKey].push(trade)
  })

  return NextResponse.json({
    debug: {
      requestedDate: date,
      userId,
      targetDate: targetDate.toISOString(),
      dayStart: dayStart.toISOString(),
      dayEnd: dayEnd.toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    dayTrades: {
      count: dayTrades.length,
      trades: dayTrades.map(t => ({
        id: t.id,
        symbol: t.symbol,
        entryDate: t.entryDate.toISOString(),
        netPnL: t.netPnL
      }))
    },
    utcTrades: {
      count: utcTrades.length,
      trades: utcTrades.map(t => ({
        id: t.id,
        symbol: t.symbol,
        entryDate: t.entryDate.toISOString(),
        netPnL: t.netPnL
      }))
    },
    monthCalendarData: Object.keys(tradesByDate).map(date => ({
      date,
      count: tradesByDate[date].length,
      totalPnL: tradesByDate[date].reduce((sum, t) => sum + (t.netPnL || 0), 0),
      trades: tradesByDate[date].map(t => ({
        id: t.id,
        symbol: t.symbol,
        entryDate: t.entryDate.toISOString()
      }))
    }))
  })
}