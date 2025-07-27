import { NextRequest, NextResponse } from 'next/server'
import { getAccountMetrics, getAccountMetricsWithFees } from '@/lib/trailingDrawdown'
import { CachedCalculations } from '@/lib/calculationCache'

// GET /api/account-metrics - Get real-time account metrics including trailing drawdown
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Use cached calculation for better performance
    const forceRefresh = searchParams.get('refresh') === 'true'
    const metrics = await CachedCalculations.getAccountMetricsWithCache(userId, forceRefresh)

    if (!metrics) {
      return NextResponse.json({ 
        error: 'Unable to calculate account metrics. Please configure your account settings first.' 
      }, { status: 404 })
    }

    // No caching for now to ensure fresh data
    const response = NextResponse.json(metrics)
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    return response

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: errorMessage
    }, { status: 500 })
  }
}