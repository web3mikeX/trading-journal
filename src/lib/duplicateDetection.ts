import crypto from 'crypto'

export interface TradeIdentifier {
  userId: string
  symbol: string
  side: 'LONG' | 'SHORT'
  entryDate: Date | string
  entryPrice: number
  quantity: number
  fillIds?: string // Optional broker-specific fill IDs
}

export interface DuplicateCheckResult {
  isDuplicate: boolean
  existingTradeId?: string
  duplicateReason?: string
  confidence: 'exact' | 'high' | 'medium' | 'low'
}

/**
 * Generate a unique hash for a trade based on key identifying fields
 */
export function generateTradeHash(trade: TradeIdentifier): string {
  // Normalize the entry date to remove time component for same-day detection
  const entryDate = new Date(trade.entryDate)
  const normalizedDate = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate())
  
  // Create a consistent string for hashing
  const hashInput = [
    trade.userId,
    trade.symbol.toUpperCase().trim(),
    trade.side,
    normalizedDate.toISOString().split('T')[0], // YYYY-MM-DD format
    trade.entryPrice.toFixed(4), // Normalize price to 4 decimal places
    trade.quantity.toFixed(4), // Normalize quantity to 4 decimal places
    trade.fillIds || '' // Include fill IDs if available
  ].join('|')
  
  return crypto.createHash('sha256').update(hashInput).digest('hex')
}

/**
 * Generate a content checksum for detecting exact duplicate content
 */
export function generateContentChecksum(tradeData: any): string {
  // Create a consistent JSON string (sorted keys)
  const sortedData = JSON.stringify(tradeData, Object.keys(tradeData).sort())
  return crypto.createHash('md5').update(sortedData).digest('hex')
}

/**
 * Check if a trade entry date falls on the same day as another
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate()
}

/**
 * Check if two prices are approximately equal (within tolerance)
 */
export function isPriceApproxEqual(price1: number, price2: number, tolerance: number = 0.01): boolean {
  return Math.abs(price1 - price2) <= tolerance
}

/**
 * Check if two quantities are approximately equal (within tolerance)
 */
export function isQuantityApproxEqual(qty1: number, qty2: number, tolerance: number = 0.001): boolean {
  return Math.abs(qty1 - qty2) <= tolerance
}

/**
 * Advanced duplicate detection with fuzzy matching
 */
export function detectDuplicateLevel(
  newTrade: TradeIdentifier,
  existingTrade: TradeIdentifier
): DuplicateCheckResult {
  // Check exact match first
  if (generateTradeHash(newTrade) === generateTradeHash(existingTrade)) {
    return {
      isDuplicate: true,
      duplicateReason: 'Exact match on all key fields',
      confidence: 'exact'
    }
  }
  
  // Check for high-confidence duplicates
  const sameSymbol = newTrade.symbol.toUpperCase() === existingTrade.symbol.toUpperCase()
  const sameSide = newTrade.side === existingTrade.side
  const sameDay = isSameDay(newTrade.entryDate, existingTrade.entryDate)
  const samePrice = isPriceApproxEqual(newTrade.entryPrice, existingTrade.entryPrice)
  const sameQuantity = isQuantityApproxEqual(newTrade.quantity, existingTrade.quantity)
  
  if (sameSymbol && sameSide && sameDay && samePrice && sameQuantity) {
    return {
      isDuplicate: true,
      duplicateReason: 'High confidence match (minor price/quantity differences)',
      confidence: 'high'
    }
  }
  
  // Check for medium-confidence duplicates (same symbol, side, day but different price/quantity)
  if (sameSymbol && sameSide && sameDay) {
    const priceDiff = Math.abs(newTrade.entryPrice - existingTrade.entryPrice) / newTrade.entryPrice * 100
    const qtyDiff = Math.abs(newTrade.quantity - existingTrade.quantity) / newTrade.quantity * 100
    
    if (priceDiff < 5 && qtyDiff < 10) { // 5% price diff, 10% quantity diff
      return {
        isDuplicate: true,
        duplicateReason: `Possible duplicate: ${priceDiff.toFixed(1)}% price diff, ${qtyDiff.toFixed(1)}% quantity diff`,
        confidence: 'medium'
      }
    }
  }
  
  // No duplicate detected
  return {
    isDuplicate: false,
    confidence: 'low'
  }
}

/**
 * Create trade signature for database queries
 */
export function createTradeSignature(trade: TradeIdentifier) {
  const entryDate = new Date(trade.entryDate)
  const startOfDay = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate())
  const endOfDay = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate(), 23, 59, 59, 999)
  
  return {
    userId: trade.userId,
    symbol: trade.symbol.toUpperCase().trim(),
    side: trade.side,
    entryDateRange: {
      gte: startOfDay,
      lte: endOfDay
    },
    entryPriceRange: {
      gte: trade.entryPrice * 0.99, // 1% tolerance
      lte: trade.entryPrice * 1.01
    },
    quantityRange: {
      gte: trade.quantity * 0.999, // 0.1% tolerance
      lte: trade.quantity * 1.001
    }
  }
}