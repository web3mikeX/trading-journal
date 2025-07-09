import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { startOfDay, endOfDay } from 'date-fns'

const calendarEntrySchema = z.object({
  userId: z.string(),
  notes: z.string().optional(),
  mood: z.number().min(1).max(5).optional(),
  images: z.array(z.string()).optional()
})

// GET /api/calendar/[date] - Get calendar data for a specific date
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Parse and validate date
    const targetDate = new Date(date)
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    const dayStart = startOfDay(targetDate)
    const dayEnd = endOfDay(targetDate)

    // Get trades for this date
    const trades = await prisma.trade.findMany({
      where: {
        userId,
        entryDate: {
          gte: dayStart,
          lte: dayEnd
        }
      },
      orderBy: { entryDate: 'asc' },
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
      }
    })

    // Calculate daily stats
    const dailyPnL = trades.reduce((sum, trade) => sum + (trade.netPnL || 0), 0)
    const closedTrades = trades.filter(trade => trade.status === 'CLOSED')
    const winningTrades = closedTrades.filter(trade => (trade.netPnL || 0) > 0)
    const tradesCount = trades.length
    const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0

    // Get calendar entry (diary notes, mood, images)
    const calendarEntry = await prisma.calendarEntry.findUnique({
      where: {
        userId_date: {
          userId,
          date: targetDate
        }
      }
    })

    // Parse images from JSON if they exist
    let images: string[] = []
    if (calendarEntry?.images) {
      try {
        images = JSON.parse(calendarEntry.images)
      } catch {
        images = []
      }
    }

    return NextResponse.json({
      date,
      pnl: dailyPnL,
      tradesCount,
      winRate,
      hasNotes: !!calendarEntry?.notes,
      hasImages: images.length > 0,
      notes: calendarEntry?.notes,
      mood: calendarEntry?.mood,
      images,
      trades
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: errorMessage 
    }, { status: 500 })
  }
}

// POST /api/calendar/[date] - Save calendar entry for a specific date
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params
    const body = await request.json()
    
    // Validate request body
    const validatedData = calendarEntrySchema.parse(body)
    
    // Parse and validate date
    const targetDate = new Date(date)
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    const dayStart = startOfDay(targetDate)
    const dayEnd = endOfDay(targetDate)

    // Calculate fresh daily stats from trades
    const trades = await prisma.trade.findMany({
      where: {
        userId: validatedData.userId,
        entryDate: {
          gte: dayStart,
          lte: dayEnd
        }
      }
    })

    const dailyPnL = trades.reduce((sum, trade) => sum + (trade.netPnL || 0), 0)
    const closedTrades = trades.filter(trade => trade.status === 'CLOSED')
    const winningTrades = closedTrades.filter(trade => (trade.netPnL || 0) > 0)
    const losingTrades = closedTrades.filter(trade => (trade.netPnL || 0) < 0)
    const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0

    // Upsert calendar entry
    const calendarEntry = await prisma.calendarEntry.upsert({
      where: {
        userId_date: {
          userId: validatedData.userId,
          date: targetDate
        }
      },
      update: {
        notes: validatedData.notes,
        mood: validatedData.mood,
        images: validatedData.images ? JSON.stringify(validatedData.images) : null,
        dailyPnL,
        tradesCount: trades.length,
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        winRate,
        updatedAt: new Date()
      },
      create: {
        userId: validatedData.userId,
        date: targetDate,
        notes: validatedData.notes,
        mood: validatedData.mood,
        images: validatedData.images ? JSON.stringify(validatedData.images) : null,
        dailyPnL,
        tradesCount: trades.length,
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        winRate
      }
    })

    // Parse images back to array for response
    let images: string[] = []
    if (calendarEntry.images) {
      try {
        images = JSON.parse(calendarEntry.images)
      } catch {
        images = []
      }
    }

    return NextResponse.json({
      date,
      pnl: dailyPnL,
      tradesCount: trades.length,
      winRate,
      hasNotes: !!calendarEntry.notes,
      hasImages: images.length > 0,
      notes: calendarEntry.notes,
      mood: calendarEntry.mood,
      images
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: errorMessage 
    }, { status: 500 })
  }
}