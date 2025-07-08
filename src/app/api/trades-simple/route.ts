import { NextRequest, NextResponse } from 'next/server'

// GET /api/trades-simple - Get demo trades for testing
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    console.log(`Returning demo trades for userId: ${userId}`)
    
    const demoTrades = [
      {
        id: 'demo-trade-1',
        userId: userId,
        symbol: 'AAPL',
        side: 'LONG',
        strategy: 'Breakout',
        entryDate: '2025-07-06T10:15:00Z',
        entryPrice: 150.25,
        quantity: 100,
        exitDate: '2025-07-06T15:30:00Z',
        exitPrice: 155.75,
        netPnL: 546.02,
        status: 'CLOSED',
        notes: 'Clean breakout pattern',
        createdAt: '2025-07-06T10:15:00Z'
      },
      {
        id: 'demo-trade-2',
        userId: userId,
        symbol: 'TSLA',
        side: 'SHORT',
        strategy: 'Reversal',
        entryDate: '2025-07-05T14:20:00Z',
        entryPrice: 300.50,
        quantity: 50,
        exitDate: '2025-07-05T16:45:00Z',
        exitPrice: 295.25,
        netPnL: 258.52,
        status: 'CLOSED',
        notes: 'Perfect bear flag setup',
        createdAt: '2025-07-05T14:20:00Z'
      },
      {
        id: 'demo-trade-3',
        userId: userId,
        symbol: 'GOOGL',
        side: 'LONG',
        strategy: 'Swing Trade',
        entryDate: '2025-07-03T11:30:00Z',
        entryPrice: 2800.00,
        quantity: 10,
        exitDate: null,
        exitPrice: null,
        netPnL: null,
        status: 'OPEN',
        notes: 'Strong support level hold',
        createdAt: '2025-07-03T11:30:00Z'
      }
    ]

    return NextResponse.json(demoTrades)
  } catch (error) {
    console.error('Error in trades-simple:', error)
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}