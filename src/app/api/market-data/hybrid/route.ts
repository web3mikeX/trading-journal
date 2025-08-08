import { NextRequest, NextResponse } from 'next/server'
import { hybridMarketDataService } from '@/services/hybridMarketData'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const symbol = searchParams.get('symbol')
    const timeframe = searchParams.get('timeframe') || '1d'
    const period = searchParams.get('period') || '1M'

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      )
    }

    const data = await hybridMarketDataService.getMarketData(symbol, timeframe, period)
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Hybrid market data error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch market data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { symbol, timeframe = '1d', period = '1M' } = body

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      )
    }

    const data = await hybridMarketDataService.getMarketData(symbol, timeframe, period)
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Hybrid market data POST error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch market data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Test endpoint
export async function OPTIONS(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const symbol = searchParams.get('symbol')

  if (!symbol) {
    return NextResponse.json(
      { error: 'Symbol parameter is required' },
      { status: 400 }
    )
  }

  try {
    const testResults = await hybridMarketDataService.testSymbol(symbol)
    return NextResponse.json(testResults)
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to test symbol',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
