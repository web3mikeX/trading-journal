import { roundCurrency } from './utils'

export interface TradeValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  sanitizedData?: Partial<TradeData>
}

export interface TradeData {
  entryPrice: number
  exitPrice?: number | null
  quantity: number
  entryFees?: number
  exitFees?: number
  commission?: number
  swap?: number
  grossPnL?: number | null
  netPnL?: number | null
  returnPercent?: number | null
  contractMultiplier?: number
  stopLoss?: number | null
  takeProfit?: number | null
  riskAmount?: number | null
}

/**
 * Comprehensive validation for trade financial data
 * Ensures all monetary values are positive and properly formatted
 */
export function validateTradeData(data: TradeData): TradeValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const sanitizedData: Partial<TradeData> = {}

  // Required field validations
  if (!data.entryPrice || data.entryPrice <= 0) {
    errors.push('Entry price must be a positive number')
  } else {
    sanitizedData.entryPrice = roundCurrency(data.entryPrice)
  }

  if (!data.quantity || data.quantity <= 0) {
    errors.push('Quantity must be a positive number')
  } else {
    sanitizedData.quantity = roundCurrency(data.quantity)
  }

  // Optional price validations
  if (data.exitPrice !== undefined && data.exitPrice !== null) {
    if (data.exitPrice <= 0) {
      errors.push('Exit price must be positive if provided')
    } else {
      sanitizedData.exitPrice = roundCurrency(data.exitPrice)
    }
  }

  // Fee validations (must be non-negative)
  const feeFields = ['entryFees', 'exitFees', 'commission', 'swap'] as const
  for (const field of feeFields) {
    const value = data[field]
    if (value !== undefined && value !== null) {
      if (value < 0) {
        errors.push(`${field} cannot be negative`)
      } else {
        sanitizedData[field] = roundCurrency(value)
      }
    }
  }

  // P&L validations (can be negative)
  const pnlFields = ['grossPnL', 'netPnL', 'returnPercent'] as const
  for (const field of pnlFields) {
    const value = data[field]
    if (value !== undefined && value !== null) {
      if (!isFinite(value) || isNaN(value)) {
        errors.push(`${field} must be a valid number`)
      } else {
        sanitizedData[field] = field === 'returnPercent' 
          ? roundCurrency(value) // Return percent can have more precision
          : roundCurrency(value)
      }
    }
  }

  // Contract multiplier validation
  if (data.contractMultiplier !== undefined && data.contractMultiplier !== null) {
    if (data.contractMultiplier <= 0) {
      errors.push('Contract multiplier must be positive')
    } else {
      sanitizedData.contractMultiplier = data.contractMultiplier
    }
  }

  // Stop loss and take profit validations
  if (data.stopLoss !== undefined && data.stopLoss !== null) {
    if (data.stopLoss <= 0) {
      errors.push('Stop loss must be positive if provided')
    } else {
      sanitizedData.stopLoss = roundCurrency(data.stopLoss)
    }
  }

  if (data.takeProfit !== undefined && data.takeProfit !== null) {
    if (data.takeProfit <= 0) {
      errors.push('Take profit must be positive if provided')
    } else {
      sanitizedData.takeProfit = roundCurrency(data.takeProfit)
    }
  }

  if (data.riskAmount !== undefined && data.riskAmount !== null) {
    if (data.riskAmount < 0) {
      errors.push('Risk amount cannot be negative')
    } else {
      sanitizedData.riskAmount = roundCurrency(data.riskAmount)
    }
  }

  // Logical validations
  if (sanitizedData.entryPrice && sanitizedData.exitPrice) {
    const priceChange = Math.abs(sanitizedData.exitPrice - sanitizedData.entryPrice)
    const priceChangePercent = (priceChange / sanitizedData.entryPrice) * 100
    
    if (priceChangePercent > 50) {
      warnings.push(`Large price change detected: ${priceChangePercent.toFixed(2)}%. Please verify entry and exit prices.`)
    }
  }

  // Fee reasonableness check
  const totalFees = (sanitizedData.entryFees || 0) + (sanitizedData.exitFees || 0) + (sanitizedData.commission || 0)
  if (totalFees > 0 && sanitizedData.entryPrice && sanitizedData.quantity) {
    const tradeValue = sanitizedData.entryPrice * sanitizedData.quantity
    const feePercentage = (totalFees / tradeValue) * 100
    
    if (feePercentage > 10) {
      warnings.push(`High fees detected: ${feePercentage.toFixed(2)}% of trade value. Please verify fee calculations.`)
    }
  }

  // P&L consistency check
  if (sanitizedData.grossPnL !== undefined && sanitizedData.netPnL !== undefined && 
      sanitizedData.grossPnL !== null && sanitizedData.netPnL !== null) {
    const expectedNetPnL = sanitizedData.grossPnL - totalFees
    const pnlDifference = Math.abs(sanitizedData.netPnL - expectedNetPnL)
    
    if (pnlDifference > 0.01) {
      warnings.push(`P&L calculation mismatch: Net P&L (${sanitizedData.netPnL}) does not match Gross P&L (${sanitizedData.grossPnL}) minus fees (${totalFees}).`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedData: errors.length === 0 ? sanitizedData : undefined
  }
}

/**
 * Validate account balance data
 */
export function validateAccountBalance(balance: number, startingBalance?: number): TradeValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!isFinite(balance) || isNaN(balance)) {
    errors.push('Account balance must be a valid number')
  }

  if (startingBalance && balance < startingBalance * 0.5) {
    warnings.push(`Account balance is significantly lower than starting balance. Current: $${balance.toFixed(2)}, Starting: $${startingBalance.toFixed(2)}`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedData: { balance: roundCurrency(balance) }
  }
}

/**
 * Validate trailing drawdown data
 */
export function validateTrailingDrawdownData(
  accountHigh: number,
  currentBalance: number,
  trailingLimit: number,
  startingBalance: number
): TradeValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Basic validations
  if (accountHigh < startingBalance) {
    errors.push('Account high cannot be less than starting balance')
  }

  if (currentBalance > accountHigh) {
    warnings.push('Current balance is higher than recorded account high - account high may need updating')
  }

  if (trailingLimit > accountHigh) {
    errors.push('Trailing drawdown limit cannot be higher than account high')
  }

  if (currentBalance < trailingLimit) {
    warnings.push('Current balance is below trailing drawdown limit - account may be in violation')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedData: {
      accountHigh: roundCurrency(accountHigh),
      currentBalance: roundCurrency(currentBalance),
      trailingLimit: roundCurrency(trailingLimit)
    }
  }
}