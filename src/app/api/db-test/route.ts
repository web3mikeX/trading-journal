import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Test environment variables
    const databaseUrl = process.env.DATABASE_URL
    
    // Test Prisma import
    let prismaStatus = 'unknown'
    try {
      const { prisma } = await import('@/lib/prisma')
      prismaStatus = 'imported successfully'
      
      // Test database connection
      const result = await prisma.$queryRaw`SELECT 1 as test`
      prismaStatus = 'connected successfully'
    } catch (dbError) {
      prismaStatus = `connection failed: ${dbError instanceof Error ? dbError.message : 'unknown error'}`
    }
    
    return NextResponse.json({ 
      message: 'Database test endpoint',
      databaseUrl: databaseUrl ? 'set' : 'not set',
      prismaStatus,
      env: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Test endpoint failed',
      details: error instanceof Error ? error.message : 'unknown error'
    }, { status: 500 })
  }
}