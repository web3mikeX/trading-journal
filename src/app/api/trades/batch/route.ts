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

const BatchTradeSchema = z.object({
  trades: z.array(z.object({
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
    dataSource: z.string().default('csv'),
    
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
  })),
  options: z.object({
    duplicateHandling: z.enum(['skip', 'force', 'prompt']).default('prompt'),
    allowPartialImport: z.boolean().default(true),
    validateOnly: z.boolean().default(false) // Only validate and return duplicate info
  })
})

interface TradeWithDuplicateInfo {
  trade: any
  duplicateCheck?: {
    isDuplicate: boolean
    confidence?: 'exact' | 'high' | 'medium' | 'low'
    reason?: string
    existingTradeId?: string
    existingTrade?: any
  }
  hash: string
  checksum: string
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

  const contractMultiplier = getContractMultiplier(trade.symbol, trade.market)
  const contractType = getContractType(trade.symbol, trade.market)

  const pointsDifference = trade.side === 'LONG' 
    ? (trade.exitPrice - trade.entryPrice)
    : (trade.entryPrice - trade.exitPrice)

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

// Check for existing duplicates in batch
async function batchCheckForDuplicates(trades: any[]): Promise<TradeWithDuplicateInfo[]> {
  const results: TradeWithDuplicateInfo[] = []
  
  // Generate hashes for all trades first
  const tradeHashes = trades.map(trade => {
    const identifier: TradeIdentifier = {
      userId: trade.userId,
      symbol: trade.symbol,
      side: trade.side,
      entryDate: trade.entryDate,
      entryPrice: trade.entryPrice,
      quantity: trade.quantity,
      fillIds: trade.fillIds
    }
    return {
      trade,
      hash: generateTradeHash(identifier),
      checksum: generateContentChecksum(trade),
      identifier
    }
  })
  
  // Check for duplicates against existing trades in database
  const allHashes = tradeHashes.map(t => t.hash)
  const existingTrades = await prisma.trade.findMany({
    where: {
      OR: [
        { tradeHash: { in: allHashes } },
        // Also check by user for signature matching
        { userId: { in: [...new Set(trades.map(t => t.userId))] } }
      ]
    }
  })
  
  // Create lookup maps
  const existingByHash = new Map(existingTrades.map(t => [t.tradeHash, t]))
  const existingByUser = new Map<string, any[]>()
  existingTrades.forEach(trade => {
    if (!existingByUser.has(trade.userId)) {
      existingByUser.set(trade.userId, [])
    }
    existingByUser.get(trade.userId)!.push(trade)
  })
  
  // Check each trade for duplicates
  for (const { trade, hash, checksum, identifier } of tradeHashes) {
    let duplicateCheck: any = undefined
    
    // First check exact hash match
    const exactMatch = existingByHash.get(hash)
    if (exactMatch) {
      duplicateCheck = {
        isDuplicate: true,
        confidence: 'exact' as const,
        reason: 'Exact hash match',
        existingTradeId: exactMatch.id,
        existingTrade: exactMatch
      }
    } else {
      // Check for fuzzy matches within user's trades
      const userTrades = existingByUser.get(trade.userId) || []
      for (const existingTrade of userTrades) {
        const result = detectDuplicateLevel(identifier, {
          userId: existingTrade.userId,
          symbol: existingTrade.symbol,
          side: existingTrade.side,
          entryDate: existingTrade.entryDate,
          entryPrice: existingTrade.entryPrice,
          quantity: existingTrade.quantity,
          fillIds: existingTrade.fillIds || undefined
        })
        
        if (result.isDuplicate) {
          duplicateCheck = {
            isDuplicate: true,
            confidence: result.confidence,
            reason: result.duplicateReason,
            existingTradeId: existingTrade.id,
            existingTrade: existingTrade
          }
          break // Use first match found
        }
      }
    }
    
    results.push({
      trade,
      duplicateCheck,
      hash,
      checksum
    })
  }
  
  return results
}

// POST /api/trades/batch - Bulk import trades with duplicate detection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = BatchTradeSchema.parse(body)
    
    const { trades, options } = validatedData
    
    if (trades.length === 0) {
      return NextResponse.json({ error: 'No trades provided' }, { status: 400 })
    }
    
    // Perform duplicate checking
    const tradesWithDuplicateInfo = await batchCheckForDuplicates(trades)
    
    // Separate duplicates from new trades
    const duplicates = tradesWithDuplicateInfo.filter(t => t.duplicateCheck?.isDuplicate)
    const newTrades = tradesWithDuplicateInfo.filter(t => !t.duplicateCheck?.isDuplicate)
    
    // If validation only, return the analysis
    if (options.validateOnly) {
      return NextResponse.json({
        totalTrades: trades.length,
        newTrades: newTrades.length,
        duplicates: duplicates.length,
        duplicateDetails: duplicates.map(d => ({
          trade: {
            symbol: d.trade.symbol,
            side: d.trade.side,
            entryDate: d.trade.entryDate,
            entryPrice: d.trade.entryPrice,
            quantity: d.trade.quantity
          },
          duplicateInfo: d.duplicateCheck
        })),
        summary: {
          canImport: newTrades.length,
          needsResolution: duplicates.length
        }
      })
    }
    
    // Handle duplicate resolution based on options
    let tradesToImport = newTrades
    
    if (options.duplicateHandling === 'force') {
      // Import all trades, mark duplicates
      tradesToImport = tradesWithDuplicateInfo
    } else if (options.duplicateHandling === 'skip') {
      // Only import new trades
      tradesToImport = newTrades
    } else if (options.duplicateHandling === 'prompt') {
      // Return duplicate info for user decision
      if (duplicates.length > 0) {
        return NextResponse.json({
          error: 'Duplicates detected',
          needsResolution: true,
          duplicates: duplicates.map(d => ({
            trade: d.trade,
            duplicateInfo: d.duplicateCheck
          })),
          newTrades: newTrades.length,
          options: {
            forceAll: 'Import all trades including duplicates',
            skipDuplicates: 'Import only new trades',
            selectiveImport: 'Choose individual trades to import'
          }
        }, { status: 409 })
      }
    }
    
    // Import the trades
    const importResults = []
    const errors = []
    
    for (const { trade, hash, checksum, duplicateCheck } of tradesToImport) {
      try {
        const pnlData = calculatePnL(trade)
        
        const tradeData = {
          ...trade,
          entryDate: new Date(trade.entryDate),
          exitDate: trade.exitDate ? new Date(trade.exitDate) : null,
          grossPnL: pnlData.grossPnL,
          netPnL: pnlData.netPnL,
          returnPercent: pnlData.returnPercent,
          contractMultiplier: pnlData.contractMultiplier,
          contractType: pnlData.contractType,
          status: trade.exitDate ? 'CLOSED' : 'OPEN',
          tradeHash: hash,
          duplicateChecksum: checksum,
          isDuplicate: duplicateCheck?.isDuplicate || false,
          originalTradeId: duplicateCheck?.existingTradeId
        }
        
        const createdTrade = await prisma.trade.create({
          data: tradeData
        })
        
        importResults.push({
          success: true,
          trade: createdTrade,
          wasDuplicate: duplicateCheck?.isDuplicate || false
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        errors.push({
          trade: {
            symbol: trade.symbol,
            entryDate: trade.entryDate
          },
          error: errorMessage
        })
        
        if (!options.allowPartialImport) {
          throw error // Fail entire import
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      imported: importResults.length,
      skipped: duplicates.length,
      errors: errors.length,
      details: {
        imported: importResults,
        skipped: duplicates.map(d => ({
          trade: {
            symbol: d.trade.symbol,
            entryDate: d.trade.entryDate
          },
          reason: d.duplicateCheck?.reason
        })),
        errors
      }
    }, { status: 201 })
    
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