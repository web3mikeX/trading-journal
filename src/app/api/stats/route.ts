import { NextRequest, NextResponse } from 'next/server'

// GET /api/stats - Get trading statistics for dashboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Optimized demo data response with caching headers
    console.log(`Returning demo stats for userId: ${userId}`)
    
    const response = NextResponse.json({
      totalPnL: 1250.50,
      winRate: 65.5,
      totalTrades: 15,
      openTrades: 2,
      closedTrades: 13,
      profitFactor: 1.8,
      averageWin: 185.25,
      averageLoss: -125.75,
      currentMonthReturn: 12.5,
      performanceData: [
        { date: '2025-06', balance: 10500, pnl: 500, trades: 8 },
        { date: '2025-07', balance: 11250, pnl: 750, trades: 7 }
      ],
      recentTrades: [
        {
          id: 'demo-1',
          symbol: 'AAPL',
          side: 'LONG',
          entryDate: new Date('2025-07-06T10:00:00Z'),
          exitDate: new Date('2025-07-06T15:30:00Z'),
          netPnL: 250.00,
          status: 'CLOSED'
        },
        {
          id: 'demo-2',
          symbol: 'TSLA',
          side: 'SHORT',
          entryDate: new Date('2025-07-05T14:00:00Z'),
          netPnL: null,
          status: 'OPEN'
        }
      ],
      winningTrades: 9,
      losingTrades: 4
    })

    // Add caching headers for better performance
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    return response

  } catch (error) {
    console.error('Error fetching stats:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Detailed error:', errorMessage)
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: errorMessage
    }, { status: 500 })
  }
}