import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getContractMultiplier, getContractType } from '@/lib/contractSpecs'

const UpdateTradeSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required').optional(),
  side: z.enum(['LONG', 'SHORT']).optional(),
  entryDate: z.string().datetime().optional(),
  entryPrice: z.number().positive('Entry price must be positive').optional(),
  quantity: z.number().positive('Quantity must be positive').optional(),
  strategy: z.string().optional(),
  setup: z.string().optional(),
  market: z.string().optional(),
  entryFees: z.number().optional(),
  exitDate: z.string().datetime().optional(),
  exitPrice: z.number().positive().optional(),
  exitFees: z.number().optional(),
  stopLoss: z.number().positive().optional(),
  takeProfit: z.number().positive().optional(),
  riskAmount: z.number().optional(),
  commission: z.number().optional(),
  swap: z.number().optional(),
  notes: z.string().optional(),
})

// Calculate P&L for a trade - using same logic as main trade route
function calculatePnL(trade: any) {
  if (!trade.exitPrice || !trade.entryPrice) {
    return { 
      grossPnL: null, 
      netPnL: null, 
      returnPercent: null,
      contractMultiplier: getContractMultiplier(trade.symbol, trade.market),
      contractType: getContractType(trade.symbol, trade.market)
    }
  }

  // Get contract specifications
  const contractMultiplier = getContractMultiplier(trade.symbol, trade.market)
  const contractType = getContractType(trade.symbol, trade.market)

  // Calculate points difference
  const pointsDifference = trade.side === 'LONG' 
    ? (trade.exitPrice - trade.entryPrice)
    : (trade.entryPrice - trade.exitPrice)

  // Apply contract multiplier to calculate gross PnL
  const grossPnL = pointsDifference * trade.quantity * contractMultiplier

  const totalFees = (trade.entryFees || 0) + (trade.exitFees || 0) + (trade.commission || 0) + (trade.swap || 0)
  const netPnL = grossPnL - totalFees

  const totalInvested = trade.entryPrice * trade.quantity * contractMultiplier
  const returnPercent = totalInvested > 0 ? (netPnL / totalInvested) * 100 : 0

  return { 
    grossPnL, 
    netPnL, 
    returnPercent,
    contractMultiplier,
    contractType
  }
}

// GET /api/trades/[id] - Get a specific trade
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const trade = await prisma.trade.findUnique({
      where: { id },
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        journalEntries: true
      }
    })

    if (!trade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
    }

    return NextResponse.json(trade)
  } catch (error) {
    console.error('Error fetching trade:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// PUT /api/trades/[id] - Update a specific trade
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()
    const validatedData = UpdateTradeSchema.parse(body)

    // Get the existing trade first
    const existingTrade = await prisma.trade.findUnique({
      where: { id }
    })

    if (!existingTrade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
    }

    // Merge existing data with updates
    const mergedData = {
      ...existingTrade,
      ...validatedData,
      entryDate: validatedData.entryDate ? new Date(validatedData.entryDate) : existingTrade.entryDate,
      exitDate: validatedData.exitDate ? new Date(validatedData.exitDate) : existingTrade.exitDate,
    }

    // Calculate P&L with updated data
    const pnlData = calculatePnL(mergedData)

    const updatedTrade = await prisma.trade.update({
      where: { id },
      data: {
        ...validatedData,
        entryDate: mergedData.entryDate,
        exitDate: mergedData.exitDate,
        grossPnL: pnlData.grossPnL,
        netPnL: pnlData.netPnL,
        returnPercent: pnlData.returnPercent,
        contractMultiplier: pnlData.contractMultiplier,
        contractType: pnlData.contractType,
        status: mergedData.exitDate ? 'CLOSED' : 'OPEN'
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    return NextResponse.json(updatedTrade)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error updating trade:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE /api/trades/[id] - Delete a specific trade
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const trade = await prisma.trade.findUnique({
      where: { id }
    })

    if (!trade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
    }

    await prisma.trade.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Trade deleted successfully' })
  } catch (error) {
    console.error('Error deleting trade:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}