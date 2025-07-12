import { createHash } from 'crypto'
import { prisma } from '@/lib/prisma'

export type DuplicateLevel = 'EXACT' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'

export interface DuplicateCheck {
  level: DuplicateLevel
  confidence: number
  existingTrade?: any
  reason: string
}

export interface TradeData {
  userId: string
  symbol: string
  side: 'LONG' | 'SHORT'
  entryDate: string | Date
  entryPrice: number
  quantity: number
  exitDate?: string | Date | null
  exitPrice?: number | null
}

export function generateTradeHash(trade: TradeData): string {
  const entryDate = new Date(trade.entryDate).toISOString().split('T')[0] // YYYY-MM-DD
  const hashInput = [
    trade.userId,
    trade.symbol.toUpperCase(),
    trade.side,
    entryDate,
    trade.entryPrice.toFixed(2),
    trade.quantity.toString()
  ].join('|')
  
  return createHash('sha256').update(hashInput).digest('hex')
}

export async function detectDuplicateTrade(trade: TradeData): Promise<DuplicateCheck> {
  const tradeHash = generateTradeHash(trade)
  
  // Check for exact duplicate first
  const exactDuplicate = await prisma.trade.findFirst({
    where: {
      userId: trade.userId,
      tradeHash: tradeHash
    }
  })
  
  if (exactDuplicate) {
    return {
      level: 'EXACT',
      confidence: 1.0,
      existingTrade: exactDuplicate,
      reason: 'Identical trade found (same symbol, side, date, price, quantity)'
    }
  }
  
  // Check for fuzzy matches
  const entryDate = new Date(trade.entryDate)
  const dateStart = new Date(entryDate.getTime() - 5 * 60 * 1000) // 5 minutes before
  const dateEnd = new Date(entryDate.getTime() + 5 * 60 * 1000)   // 5 minutes after
  
  const priceRange = trade.entryPrice * 0.001 // 0.1% price tolerance
  const minPrice = trade.entryPrice - priceRange
  const maxPrice = trade.entryPrice + priceRange
  
  const similarTrades = await prisma.trade.findMany({
    where: {
      userId: trade.userId,
      symbol: trade.symbol.toUpperCase(),
      side: trade.side,
      entryDate: {
        gte: dateStart,
        lte: dateEnd
      },
      entryPrice: {
        gte: minPrice,
        lte: maxPrice
      },
      quantity: trade.quantity
    },
    orderBy: {
      entryDate: 'desc'
    },
    take: 5
  })
  
  if (similarTrades.length > 0) {
    const closestTrade = similarTrades[0]
    const timeDiff = Math.abs(entryDate.getTime() - new Date(closestTrade.entryDate).getTime())
    const priceDiff = Math.abs(trade.entryPrice - closestTrade.entryPrice) / trade.entryPrice
    
    if (timeDiff <= 60000 && priceDiff <= 0.0001) { // 1 minute, 0.01%
      return {
        level: 'HIGH',
        confidence: 0.9,
        existingTrade: closestTrade,
        reason: 'Very similar trade found (same symbol, side, quantity, within 1 minute and 0.01% price)'
      }
    } else if (timeDiff <= 300000 && priceDiff <= 0.001) { // 5 minutes, 0.1%
      return {
        level: 'MEDIUM',
        confidence: 0.7,
        existingTrade: closestTrade,
        reason: 'Similar trade found (same symbol, side, quantity, within 5 minutes and 0.1% price)'
      }
    } else {
      return {
        level: 'LOW',
        confidence: 0.3,
        existingTrade: closestTrade,
        reason: 'Potentially similar trade found'
      }
    }
  }
  
  return {
    level: 'NONE',
    confidence: 0,
    reason: 'No similar trades found'
  }
}

export async function createTradeWithDuplicateCheck(
  trade: TradeData, 
  forceCreate: boolean = false
): Promise<{ success: boolean; trade?: any; duplicate?: DuplicateCheck; error?: string }> {
  try {
    // Check for duplicates unless forcing creation
    if (!forceCreate) {
      const duplicateCheck = await detectDuplicateTrade(trade)
      
      if (duplicateCheck.level === 'EXACT') {
        return {
          success: false,
          duplicate: duplicateCheck,
          error: 'Exact duplicate trade found'
        }
      }
      
      if (duplicateCheck.level === 'HIGH') {
        return {
          success: false,
          duplicate: duplicateCheck,
          error: 'Very similar trade found'
        }
      }
    }
    
    // Generate hash for the new trade
    const tradeHash = generateTradeHash(trade)
    
    // Create the trade with hash
    const newTrade = await prisma.trade.create({
      data: {
        ...trade,
        entryDate: new Date(trade.entryDate),
        exitDate: trade.exitDate ? new Date(trade.exitDate) : null,
        tradeHash,
        isDuplicate: false
      }
    })
    
    return {
      success: true,
      trade: newTrade
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}