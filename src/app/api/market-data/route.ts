import { NextRequest, NextResponse } from 'next/server'
import { getMarketDataServer, hasRealDataProxy, getSymbolExplanation } from '@/services/marketDataServer'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    const days = parseInt(searchParams.get('days') || '30')
    const preferReal = searchParams.get('preferReal') !== 'false'
    
    if (!symbol) {
      return NextResponse.json({ 
        error: 'Symbol parameter is required' 
      }, { status: 400 })
    }
    
    // Validate parameters
    if (days < 1 || days > 365) {
      return NextResponse.json({ 
        error: 'Days parameter must be between 1 and 365' 
      }, { status: 400 })
    }
    
    console.log(`Market data request: ${symbol}, ${days} days, preferReal: ${preferReal}`)
    
    // Get market data using server-side service (no CORS issues)
    const marketData = await getMarketDataServer(symbol, days, preferReal)
    
    // Add additional metadata
    const response = {
      ...marketData,
      hasRealDataProxy: hasRealDataProxy(symbol),
      symbolExplanation: getSymbolExplanation(symbol),
      requestParams: {
        symbol,
        days,
        preferReal
      },
      dataStats: {
        dataPoints: marketData.data.length,
        dateRange: marketData.data.length > 0 ? {
          start: new Date(marketData.data[0].timestamp).toISOString(),
          end: new Date(marketData.data[marketData.data.length - 1].timestamp).toISOString()
        } : null,
        priceRange: marketData.data.length > 0 ? {
          high: Math.max(...marketData.data.map(d => d.high)),
          low: Math.min(...marketData.data.map(d => d.low)),
          latest: marketData.data[marketData.data.length - 1].close
        } : null
      }
    }
    
    console.log(`✅ Returning ${marketData.data.length} data points for ${symbol} (source: ${marketData.dataSource})`)
    
    return NextResponse.json(response, { 
      status: 200,
      headers: {
        'Cache-Control': marketData.dataSource === 'yahoo_finance' ? 'public, max-age=300' : 'public, max-age=60'
      }
    })
    
  } catch (error) {
    console.error('Market data API error:', error)
    
    return NextResponse.json({
      error: 'Failed to fetch market data',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// OPTIONS handler for CORS if needed
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}