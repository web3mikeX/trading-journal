export interface ContractSpecification {
  symbol: string
  name: string
  contractType: string
  multiplier: number
  currency: string
  tickSize: number
  exchange: string
  description: string
}

export interface BrokerFeeStructure {
  broker: string
  description: string
  fees: {
    [symbol: string]: {
      roundTurnFee: number      // Total fee per round-turn contract
      entryFee: number         // Fee per contract entry
      exitFee: number          // Fee per contract exit
      regulatoryFees: number   // NFA, clearing, exchange fees
      platformFee?: number     // Additional platform fees
    }
  }
  defaultFees: {
    roundTurnFee: number
    entryFee: number
    exitFee: number
    regulatoryFees: number
    platformFee?: number
  }
}

export interface FeeCalculation {
  totalFees: number
  entryFees: number
  exitFees: number
  commission: number
  regulatoryFees: number
  platformFees: number
  feeBreakdown: string
}

// Common futures contract specifications
export const CONTRACT_SPECIFICATIONS: Record<string, ContractSpecification> = {
  // Micro E-mini Futures
  "MNQ": {
    symbol: "MNQ",
    name: "Micro E-mini NASDAQ-100",
    contractType: "MICRO_FUTURES",
    multiplier: 2.0, // $2 per point
    currency: "USD",
    tickSize: 0.25,
    exchange: "CME",
    description: "Micro E-mini NASDAQ-100 futures"
  },
  "MNQU5": {
    symbol: "MNQU5",
    name: "Micro E-mini NASDAQ-100 September 2025",
    contractType: "MICRO_FUTURES", 
    multiplier: 2.0, // $2 per point
    currency: "USD",
    tickSize: 0.25,
    exchange: "CME",
    description: "Micro E-mini NASDAQ-100 futures September 2025"
  },
  "MES": {
    symbol: "MES",
    name: "Micro E-mini S&P 500",
    contractType: "MICRO_FUTURES",
    multiplier: 5.0, // $5 per point
    currency: "USD", 
    tickSize: 0.25,
    exchange: "CME",
    description: "Micro E-mini S&P 500 futures"
  },
  "MYM": {
    symbol: "MYM", 
    name: "Micro E-mini Dow",
    contractType: "MICRO_FUTURES",
    multiplier: 0.5, // $0.50 per point
    currency: "USD",
    tickSize: 1.0,
    exchange: "CME",
    description: "Micro E-mini Dow futures"
  },
  
  // E-mini Futures (Standard)
  "NQ": {
    symbol: "NQ",
    name: "E-mini NASDAQ-100",
    contractType: "STANDARD_FUTURES",
    multiplier: 20.0, // $20 per point
    currency: "USD",
    tickSize: 0.25,
    exchange: "CME",
    description: "E-mini NASDAQ-100 futures"
  },
  "ES": {
    symbol: "ES",
    name: "E-mini S&P 500",
    contractType: "STANDARD_FUTURES",
    multiplier: 50.0, // $50 per point
    currency: "USD",
    tickSize: 0.25,
    exchange: "CME",
    description: "E-mini S&P 500 futures"
  },
  "YM": {
    symbol: "YM",
    name: "E-mini Dow",
    contractType: "STANDARD_FUTURES",
    multiplier: 5.0, // $5 per point
    currency: "USD",
    tickSize: 1.0,
    exchange: "CME",
    description: "E-mini Dow futures"
  }
}

// Broker-specific fee configurations
export const BROKER_FEE_STRUCTURES: Record<string, BrokerFeeStructure> = {
  TOPSTEP: {
    broker: "TopStep",
    description: "TopStep Trading Combine and Funded Account Fees",
    fees: {
      // Micro E-mini futures fees
      "MNQ": { roundTurnFee: 1.34, entryFee: 0.67, exitFee: 0.67, regulatoryFees: 1.34, platformFee: 0 },
      "MNQU5": { roundTurnFee: 1.34, entryFee: 0.67, exitFee: 0.67, regulatoryFees: 1.34, platformFee: 0 },
      "MES": { roundTurnFee: 1.34, entryFee: 0.67, exitFee: 0.67, regulatoryFees: 1.34, platformFee: 0 },
      "MYM": { roundTurnFee: 1.34, entryFee: 0.67, exitFee: 0.67, regulatoryFees: 1.34, platformFee: 0 },
      // Standard E-mini futures fees  
      "NQ": { roundTurnFee: 2.68, entryFee: 1.34, exitFee: 1.34, regulatoryFees: 2.68, platformFee: 0 },
      "ES": { roundTurnFee: 2.68, entryFee: 1.34, exitFee: 1.34, regulatoryFees: 2.68, platformFee: 0 },
      "YM": { roundTurnFee: 2.68, entryFee: 1.34, exitFee: 1.34, regulatoryFees: 2.68, platformFee: 0 }
    },
    defaultFees: {
      roundTurnFee: 1.34,
      entryFee: 0.67,
      exitFee: 0.67,
      regulatoryFees: 1.34,
      platformFee: 0
    }
  },
  TRADOVATE: {
    broker: "Tradovate",
    description: "Tradovate Direct Trading Fees",
    fees: {
      "MNQ": { roundTurnFee: 1.34, entryFee: 0.67, exitFee: 0.67, regulatoryFees: 1.34, platformFee: 0 },
      "MNQU5": { roundTurnFee: 1.34, entryFee: 0.67, exitFee: 0.67, regulatoryFees: 1.34, platformFee: 0 },
      "MES": { roundTurnFee: 1.34, entryFee: 0.67, exitFee: 0.67, regulatoryFees: 1.34, platformFee: 0 },
      "MYM": { roundTurnFee: 1.34, entryFee: 0.67, exitFee: 0.67, regulatoryFees: 1.34, platformFee: 0 },
      "NQ": { roundTurnFee: 2.68, entryFee: 1.34, exitFee: 1.34, regulatoryFees: 2.68, platformFee: 0 },
      "ES": { roundTurnFee: 2.68, entryFee: 1.34, exitFee: 1.34, regulatoryFees: 2.68, platformFee: 0 },
      "YM": { roundTurnFee: 2.68, entryFee: 1.34, exitFee: 1.34, regulatoryFees: 2.68, platformFee: 0 }
    },
    defaultFees: {
      roundTurnFee: 1.34,
      entryFee: 0.67,
      exitFee: 0.67,
      regulatoryFees: 1.34,
      platformFee: 0
    }
  },
  GENERIC: {
    broker: "Generic",
    description: "Generic broker estimation",
    fees: {},
    defaultFees: {
      roundTurnFee: 1.50,
      entryFee: 0.75,
      exitFee: 0.75,
      regulatoryFees: 1.50,
      platformFee: 0
    }
  }
}

/**
 * Get contract specification for a given symbol
 * @param symbol The trading symbol (e.g., "MNQU5", "MNQ", "ES")
 * @returns ContractSpecification or null if not found
 */
export function getContractSpec(symbol: string): ContractSpecification | null {
  // Direct match first
  if (CONTRACT_SPECIFICATIONS[symbol]) {
    return CONTRACT_SPECIFICATIONS[symbol]
  }
  
  // Try to match base symbol (remove expiration codes)
  // For example, MNQU5 -> MNQ, ESU5 -> ES
  const baseSymbol = symbol.replace(/[FGHJKMNQUVXZ]\d+$/, '') // Remove month code + year
  
  if (CONTRACT_SPECIFICATIONS[baseSymbol]) {
    return {
      ...CONTRACT_SPECIFICATIONS[baseSymbol],
      symbol: symbol // Keep the original symbol
    }
  }
  
  return null
}

/**
 * Get contract multiplier for a symbol, defaulting to 1.0 for stocks
 * @param symbol The trading symbol
 * @param market The market type (FUTURES, STOCK, etc.)
 * @returns The multiplier value
 */
export function getContractMultiplier(symbol: string, market: string = "STOCK"): number {
  if (market === "FUTURES" || market === "MICRO_FUTURES") {
    const spec = getContractSpec(symbol)
    if (spec) {
      return spec.multiplier
    }
  }
  
  return 1.0 // Default for stocks and unknown contracts
}

/**
 * Get contract type for a symbol
 * @param symbol The trading symbol
 * @param market The market type
 * @returns The contract type string
 */
export function getContractType(symbol: string, market: string = "STOCK"): string {
  if (market === "FUTURES" || market === "MICRO_FUTURES") {
    const spec = getContractSpec(symbol)
    if (spec) {
      return spec.contractType
    }
    return "STANDARD_FUTURES" // Default for unknown futures
  }
  
  return "STANDARD" // Default for stocks
}

/**
 * Check if a symbol is a known futures contract
 * @param symbol The trading symbol
 * @returns True if it's a recognized futures contract
 */
export function isFuturesContract(symbol: string): boolean {
  return getContractSpec(symbol) !== null
}

/**
 * Get broker-specific fees for a symbol
 * @param symbol The trading symbol
 * @param broker The broker name (TOPSTEP, TRADOVATE, etc.)
 * @returns Fee structure for the symbol
 */
export function getBrokerFees(symbol: string, broker: string = "TOPSTEP") {
  const brokerConfig = BROKER_FEE_STRUCTURES[broker.toUpperCase()]
  if (!brokerConfig) {
    return BROKER_FEE_STRUCTURES.GENERIC.defaultFees
  }

  // Check for exact symbol match first
  if (brokerConfig.fees[symbol]) {
    return brokerConfig.fees[symbol]
  }

  // Try base symbol (remove expiration codes)
  const baseSymbol = symbol.replace(/[FGHJKMNQUVXZ]\d+$/, '')
  if (brokerConfig.fees[baseSymbol]) {
    return brokerConfig.fees[baseSymbol]
  }

  // Return default fees for broker
  return brokerConfig.defaultFees
}

/**
 * Calculate comprehensive fees for a trade
 * @param symbol The trading symbol
 * @param quantity Number of contracts
 * @param broker The broker name
 * @returns Complete fee calculation
 */
export function calculateTradeFees(
  symbol: string, 
  quantity: number, 
  broker: string = "TOPSTEP"
): FeeCalculation {
  const fees = getBrokerFees(symbol, broker)
  
  const entryFees = fees.entryFee * quantity
  const exitFees = fees.exitFee * quantity
  const commission = fees.roundTurnFee * quantity
  const regulatoryFees = fees.regulatoryFees * quantity
  const platformFees = (fees.platformFee || 0) * quantity
  
  const totalFees = commission // Total round-turn fees
  
  return {
    totalFees,
    entryFees,
    exitFees,
    commission,
    regulatoryFees,
    platformFees,
    feeBreakdown: `${broker}: $${fees.roundTurnFee}/contract × ${quantity} contracts = $${totalFees.toFixed(2)}`
  }
}

/**
 * Auto-detect broker based on account type or data source
 * @param accountType User's account type
 * @param dataSource Trade data source
 * @returns Detected broker name
 */
export function detectBroker(accountType?: string, dataSource?: string): string {
  // Check data source first
  if (dataSource) {
    if (dataSource.toLowerCase().includes('tradovate')) return 'TRADOVATE'
    if (dataSource.toLowerCase().includes('topstep')) return 'TOPSTEP'
  }
  
  // Check account type
  if (accountType) {
    if (accountType.includes('EVALUATION') || accountType.includes('FUNDED')) return 'TOPSTEP'
    if (accountType.toLowerCase().includes('tradovate')) return 'TRADOVATE'
  }
  
  // Default to TopStep for prop firm accounts
  return 'TOPSTEP'
}

/**
 * Get fee summary for a broker and symbol
 * @param symbol The trading symbol
 * @param broker The broker name
 * @returns Human-readable fee summary
 */
export function getFeeSummary(symbol: string, broker: string = "TOPSTEP"): string {
  const fees = getBrokerFees(symbol, broker)
  const brokerConfig = BROKER_FEE_STRUCTURES[broker.toUpperCase()]
  
  return `${brokerConfig?.broker || broker}: $${fees.roundTurnFee} per round-turn contract (${symbol})`
}