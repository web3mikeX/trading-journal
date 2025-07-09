import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, parseISO } from 'date-fns'

interface CalendarDayData {
  date: string
  pnl: number
  tradesCount: number
  winRate: number
  hasNotes: boolean
  hasImages: boolean
  mood?: number
}

// GET /api/calendar/month/[year-month] - Get calendar data for an entire month
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ 'year-month': string }> }
) {
  try {
    const { 'year-month': yearMonth } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Parse year-month format (YYYY-MM)
    const dateMatch = yearMonth.match(/^(\d{4})-(\d{2})$/)
    if (!dateMatch) {
      return NextResponse.json({ error: 'Invalid year-month format. Use YYYY-MM' }, { status: 400 })
    }

    const [, year, month] = dateMatch
    const targetDate = parseISO(`${year}-${month}-01`)
    
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
    }

    const monthStart = startOfMonth(targetDate)
    const monthEnd = endOfMonth(targetDate)

    // Get all trades for the month
    const trades = await prisma.trade.findMany({
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
        side: true,
        entryPrice: true,
        exitPrice: true,
        quantity: true,
        netPnL: true,
        status: true,
        entryDate: true,
        exitDate: true
      },
      orderBy: { entryDate: 'asc' }
    })

    // Get all calendar entries for the month
    const calendarEntries = await prisma.calendarEntry.findMany({
      where: {
        userId,
        date: {
          gte: monthStart,
          lte: monthEnd
        }
      }
    })

    // Group trades by date
    const tradesByDate: { [date: string]: typeof trades } = {}
    trades.forEach(trade => {
      const dateKey = trade.entryDate.toISOString().split('T')[0]
      if (!tradesByDate[dateKey]) {
        tradesByDate[dateKey] = []
      }
      tradesByDate[dateKey].push(trade)
    })

    // Create calendar data object
    const calendarData: { [date: string]: CalendarDayData } = {}
    
    // Process each day with trades
    Object.entries(tradesByDate).forEach(([date, dayTrades]) => {
      const dailyPnL = dayTrades.reduce((sum, trade) => sum + (trade.netPnL || 0), 0)
      const closedTrades = dayTrades.filter(trade => trade.status === 'CLOSED')
      const winningTrades = closedTrades.filter(trade => (trade.netPnL || 0) > 0)
      const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0

      // Find corresponding calendar entry
      const calendarEntry = calendarEntries.find(entry => 
        entry.date.toISOString().split('T')[0] === date
      )

      // Parse images from JSON if they exist
      let images: string[] = []
      if (calendarEntry?.images) {
        try {
          images = JSON.parse(calendarEntry.images)
        } catch {
          images = []
        }
      }

      calendarData[date] = {
        date,
        pnl: dailyPnL,
        tradesCount: dayTrades.length,
        winRate,
        hasNotes: !!calendarEntry?.notes,
        hasImages: images.length > 0,
        mood: calendarEntry?.mood || undefined
      }
    })

    // Add calendar entries that don't have trades but have notes/images
    calendarEntries.forEach(entry => {
      const date = entry.date.toISOString().split('T')[0]
      if (!calendarData[date]) {
        // Parse images from JSON if they exist
        let images: string[] = []
        if (entry.images) {
          try {
            images = JSON.parse(entry.images)
          } catch {
            images = []
          }
        }

        calendarData[date] = {
          date,
          pnl: entry.dailyPnL || 0,
          tradesCount: entry.tradesCount || 0,
          winRate: entry.winRate || 0,
          hasNotes: !!entry.notes,
          hasImages: images.length > 0,
          mood: entry.mood || undefined
        }
      }
    })

    // Calculate monthly P&L
    const monthlyPnL = trades.reduce((sum, trade) => sum + (trade.netPnL || 0), 0)

    return NextResponse.json({
      yearMonth,
      monthlyPnL,
      calendarData,
      totalTrades: trades.length,
      tradingDays: Object.keys(calendarData).length
    })


  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: errorMessage 
    }, { status: 500 })
  }
}