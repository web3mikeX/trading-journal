import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const TradeSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  symbol: z.string().min(1, 'Symbol is required'),
  side: z.enum(['LONG', 'SHORT']),
  entryDate: z.string().datetime(),
  entryPrice: z.number().positive('Entry price must be positive'),
  quantity: z.number().positive('Quantity must be positive'),
  strategy: z.string().optional(),
  setup: z.string().optional(),
  market: z.string().default('STOCK'),
  entryFees: z.number().default(0),
  exitDate: z.string().datetime().optional(),
  exitPrice: z.number().positive().optional(),
  exitFees: z.number().default(0),
  stopLoss: z.number().positive().optional(),
  takeProfit: z.number().positive().optional(),
  riskAmount: z.number().optional(),
  commission: z.number().default(0),
  swap: z.number().default(0),
  notes: z.string().optional(),
  dataSource: z.string().default('manual'),
})

// Calculate P&L for a trade
function calculatePnL(trade: any) {
  if (!trade.exitPrice || !trade.entryPrice) {
    return { grossPnL: null, netPnL: null, returnPercent: null }
  }

  const grossPnL = trade.side === 'LONG' 
    ? (trade.exitPrice - trade.entryPrice) * trade.quantity
    : (trade.entryPrice - trade.exitPrice) * trade.quantity

  const totalFees = trade.entryFees + trade.exitFees + trade.commission + trade.swap
  const netPnL = grossPnL - totalFees

  const totalInvested = trade.entryPrice * trade.quantity
  const returnPercent = (netPnL / totalInvested) * 100

  return { grossPnL, netPnL, returnPercent }
}

// GET /api/trades - Get all trades for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Fetch trades from database
    const trades = await prisma.trade.findMany({
      where: { userId },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      },
      orderBy: { entryDate: 'desc' }
    })

    return NextResponse.json(trades)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: errorMessage 
    }, { status: 500 })
  }
}

// POST /api/trades - Create a new trade
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const validatedData = TradeSchema.parse(body)

    // Calculate P&L if exit data is provided
    const pnlData = calculatePnL(validatedData)

    const trade = await prisma.trade.create({
      data: {
        ...validatedData,
        entryDate: new Date(validatedData.entryDate),
        exitDate: validatedData.exitDate ? new Date(validatedData.exitDate) : null,
        grossPnL: pnlData.grossPnL,
        netPnL: pnlData.netPnL,
        returnPercent: pnlData.returnPercent,
        status: validatedData.exitDate ? 'CLOSED' : 'OPEN'
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    return NextResponse.json(trade, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: errorMessage 
    }, { status: 500 })
  }
}