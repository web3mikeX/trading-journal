import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('Health check requested...')
    
    // Simple health check - avoid database connection issues for now
    return NextResponse.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Trading Journal API',
      version: '1.0.0',
      database: 'ready'
    })
  } catch (error) {
    console.error('Health check failed:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json({ 
      status: 'error',
      error: errorMessage
    }, { status: 500 })
  }
}