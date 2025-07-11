import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getContractMultiplier, getContractType } from '@/lib/contractSpecs'
import { 
  generateTradeHash, 
  generateContentChecksum, 
  detectDuplicateLevel, 
  createTradeSignature,
  type TradeIdentifier,
  type DuplicateCheckResult
} from '@/lib/duplicateDetection'

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
  
  // Duplicate detection options
  force: z.boolean().default(false), // Force import even if duplicate detected
  skipDuplicateCheck: z.boolean().default(false), // Skip duplicate checking entirely
  
  // Enhanced CSV and execution data
  rawCsvData: z.string().optional(),
  fillIds: z.string().optional(),
  executionMetadata: z.string().optional(),
  timingData: z.string().optional(),
  slippage: z.number().optional(),
  orderDetails: z.string().optional(),
  
  // Advanced performance metrics
  maxAdverseExcursion: z.number().optional(),
  maxFavorableExcursion: z.number().optional(),
  commissionPerUnit: z.number().optional(),
  executionDuration: z.number().optional(),
})

// Check for existing duplicates
async function checkForDuplicates(trade: TradeIdentifier): Promise<{
  duplicates: any[]
  bestMatch?: { trade: any, result: DuplicateCheckResult }
}> {
  // First check by exact hash
  const tradeHash = generateTradeHash(trade)
  const exactMatch = await prisma.trade.findFirst({
    where: { tradeHash }
  })
  
  if (exactMatch) {
    return {
      duplicates: [exactMatch],
      bestMatch: {
        trade: exactMatch,
        result: { isDuplicate: true, existingTradeId: exactMatch.id, confidence: 'exact', duplicateReason: 'Exact hash match' }
      }
    }
  }
  
  // Check by signature (same day, similar values)
  const signature = createTradeSignature(trade)
  const potentialDuplicates = await prisma.trade.findMany({
    where: {
      userId: signature.userId,
      symbol: signature.symbol,
      side: signature.side,
      entryDate: signature.entryDateRange,
      entryPrice: signature.entryPriceRange,
      quantity: signature.quantityRange
    },
    orderBy: { createdAt: 'desc' }
  })
  
  if (potentialDuplicates.length === 0) {
    return { duplicates: [] }
  }
  
  // Analyze each potential duplicate
  let bestMatch: { trade: any, result: DuplicateCheckResult } | undefined
  let highestConfidence = 'low'
  
  for (const existingTrade of potentialDuplicates) {
    const result = detectDuplicateLevel(trade, {
      userId: existingTrade.userId,
      symbol: existingTrade.symbol,
      side: existingTrade.side,
      entryDate: existingTrade.entryDate,
      entryPrice: existingTrade.entryPrice,
      quantity: existingTrade.quantity,
      fillIds: existingTrade.fillIds || undefined
    })
    
    if (result.isDuplicate && (!bestMatch || result.confidence === 'exact' || 
        (result.confidence === 'high' && highestConfidence !== 'exact'))) {
      bestMatch = { trade: existingTrade, result: { ...result, existingTradeId: existingTrade.id } }
      highestConfidence = result.confidence
    }
  }
  
  return {
    duplicates: potentialDuplicates,
    bestMatch
  }
}

// Calculate P&L for a trade
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

  const totalFees = trade.entryFees + trade.exitFees + trade.commission + trade.swap
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

    // Generate trade identifiers for duplicate checking
    const tradeIdentifier: TradeIdentifier = {
      userId: validatedData.userId,
      symbol: validatedData.symbol,
      side: validatedData.side,
      entryDate: validatedData.entryDate,
      entryPrice: validatedData.entryPrice,
      quantity: validatedData.quantity,
      fillIds: validatedData.fillIds
    }

    // Check for duplicates unless explicitly skipped
    if (!validatedData.skipDuplicateCheck) {
      const duplicateCheck = await checkForDuplicates(tradeIdentifier)
      
      if (duplicateCheck.bestMatch && !validatedData.force) {
        const { trade: existingTrade, result } = duplicateCheck.bestMatch
        
        return NextResponse.json({
          error: 'Duplicate trade detected',
          isDuplicate: true,
          duplicateInfo: {
            existingTradeId: existingTrade.id,
            confidence: result.confidence,
            reason: result.duplicateReason,
            existingTrade: {
              id: existingTrade.id,
              symbol: existingTrade.symbol,
              side: existingTrade.side,
              entryDate: existingTrade.entryDate,
              entryPrice: existingTrade.entryPrice,
              quantity: existingTrade.quantity,
              createdAt: existingTrade.createdAt
            }
          },
          options: {
            force: 'Import anyway (set force: true)',
            skip: 'Skip this trade',
            update: 'Update existing trade with new data'
          }
        }, { status: 409 }) // 409 Conflict
      }
    }

    // Generate hash and checksum for the new trade
    const tradeHash = generateTradeHash(tradeIdentifier)
    const duplicateChecksum = generateContentChecksum(validatedData)

    // Calculate P&L if exit data is provided
    const pnlData = calculatePnL(validatedData)

    // Prepare trade data with duplicate detection fields
    const tradeData = {
      ...validatedData,
      entryDate: new Date(validatedData.entryDate),
      exitDate: validatedData.exitDate ? new Date(validatedData.exitDate) : null,
      grossPnL: pnlData.grossPnL,
      netPnL: pnlData.netPnL,
      returnPercent: pnlData.returnPercent,
      contractMultiplier: pnlData.contractMultiplier,
      contractType: pnlData.contractType,
      status: validatedData.exitDate ? 'CLOSED' : 'OPEN',
      tradeHash,
      duplicateChecksum,
      isDuplicate: validatedData.force, // Mark as duplicate if forced
      // Remove duplicate detection control fields from stored data
      force: undefined,
      skipDuplicateCheck: undefined
    }

    const trade = await prisma.trade.create({
      data: tradeData,
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