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