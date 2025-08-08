/**
 * Hybrid Symbol Mappings for Multi-Provider Data Access
 * Provides fallback options when TradingView restricts CME futures access
 */

export interface HybridSymbolMapping {
  symbol: string
  primary: string
  yahoo: string
  etf: string
  description: string
  assetClass: 'futures' | 'etf' | 'index'
  multiplier?: number
  tickSize?: number
}

// Comprehensive hybrid mappings for CME futures with fallbacks
export const HYBRID_SYMBOL_MAPPINGS: Record<string, HybridSymbolMapping> = {
  // ===== NASDAQ =====
  'NQ': {
    symbol: 'NQ',
    primary: 'CME_MINI:NQ1!',
    yahoo: 'NQ%3DF', // Yahoo Finance format
    etf: 'NASDAQ:QQQ',
    description: 'E-mini NASDAQ-100 Futures → QQQ ETF',
    assetClass: 'futures',
    multiplier: 20,
    tickSize: 0.25
  },
  'MNQ': {
    symbol: 'MNQ',
    primary: 'CME_MINI:MNQ1!',
    yahoo: 'MNQ%3DF',
    etf: 'NASDAQ:QQQ',
    description: 'Micro E-mini NASDAQ-100 → QQQ ETF',
    assetClass: 'futures',
    multiplier: 2,
    tickSize: 0.25
  },

  // ===== S&P 500 =====
  'ES': {
    symbol: 'ES',
    primary: 'CME_MINI:ES1!',
    yahoo: 'ES%3DF',
    etf: 'NYSEARCA:SPY',
    description: 'E-mini S&P 500 Futures → SPY ETF',
    assetClass: 'futures',
    multiplier: 50,
    tickSize: 0.25
  },
  'MES': {
    symbol: 'MES',
    primary: 'CME_MINI:MES1!',
    yahoo: 'MES%3DF',
    etf: 'NYSEARCA:SPY',
    description: 'Micro E-mini S&P 500 → SPY ETF',
    assetClass: 'futures',
    multiplier: 5,
    tickSize: 0.25
  },

  // ===== RUSSELL 2000 =====
  'RTY': {
    symbol: 'RTY',
    primary: 'CME_MINI:RTY1!',
    yahoo: 'RTY%3DF',
    etf: 'NYSEARCA:IWM',
    description: 'E-mini Russell 2000 → IWM ETF',
    assetClass: 'futures',
    multiplier: 50,
    tickSize: 0.10
  },
  'M2K': {
    symbol: 'M2K',
    primary: 'CME_MINI:M2K1!',
    yahoo: 'M2K%3DF',
    etf: 'NYSEARCA:IWM',
    description: 'Micro E-mini Russell 2000 → IWM ETF',
    assetClass: 'futures',
    multiplier: 5,
    tickSize: 0.10
  },

  // ===== DOW =====
  'YM': {
    symbol: 'YM',
    primary: 'CBOT_MINI:YM1!',
    yahoo: 'YM%3DF',
    etf: 'NYSEARCA:DIA',
    description: 'E-mini Dow Jones → DIA ETF',
    assetClass: 'futures',
    multiplier: 5,
    tickSize: 1.0
  },
  'MYM': {
    symbol: 'MYM',
    primary: 'CBOT_MINI:MYM1!',
    yahoo: 'MYM%3DF',
    etf: 'NYSEARCA:DIA',
    description: 'Micro E-mini Dow Jones → DIA ETF',
    assetClass: 'futures',
    multiplier: 0.5,
    tickSize: 1.0
  },

  // ===== GOLD =====
  'GC': {
    symbol: 'GC',
    primary: 'COMEX:GC1!',
    yahoo: 'GC%3DF',
    etf: 'NYSEARCA:GLD',
    description: 'Gold Futures → GLD ETF',
    assetClass: 'futures',
    multiplier: 100,
    tickSize: 0.10
  },

  // ===== SILVER =====
  'SI': {
    symbol: 'SI',
    primary: 'COMEX:SI1!',
    yahoo: 'SI%3DF',
    etf: 'NYSEARCA:SLV',
    description: 'Silver Futures → SLV ETF',
    assetClass: 'futures',
    multiplier: 5000,
    tickSize: 0.005
  },

  // ===== OIL =====
  'CL': {
    symbol: 'CL',
    primary: 'NYMEX:CL1!',
    yahoo: 'CL%3DF',
    etf: 'NYSEARCA:USO',
    description: 'Crude Oil Futures → USO ETF',
    assetClass: 'futures',
    multiplier: 1000,
    tickSize: 0.01
  },

  // ===== NATURAL GAS =====
  'NG': {
    symbol: 'NG',
    primary: 'NYMEX:NG1!',
    yahoo: 'NG%3DF',
    etf: 'NYSEARCA:UNG',
    description: 'Natural Gas Futures → UNG ETF',
    assetClass: 'futures',
    multiplier: 10000,
    tickSize: 0.001
  }
}

// Contract month mappings
export const CONTRACT_MONTH_MAPPINGS: Record<string, string> = {
  'H': '03', // March
  'M': '06', // June  
  'U': '09', // September
  'Z': '12'  // December
}

/**
 * Get hybrid symbol mapping with fallbacks
 */
export function getHybridSymbolMapping(symbol: string): HybridSymbolMapping | null {
  // Direct match
  if (HYBRID_SYMBOL_MAPPINGS[symbol.toUpperCase()]) {
    return HYBRID_SYMBOL_MAPPINGS[symbol.toUpperCase()]
  }

  // Handle contract months (NQH25, NQM25, etc.)
  const contractMatch = symbol.match(/^([A-Z]+)([HMUZ])(\d{2,4})$/)
  if (contractMatch) {
    const [_, baseSymbol, month, year] = contractMatch
    const baseMapping = HYBRID_SYMBOL_MAPPINGS[baseSymbol]
    if (baseMapping) {
      const monthCode = CONTRACT_MONTH_MAPPINGS[month]
      const fullYear = year.length === 2 ? `20${year}` : year
      
      return {
        ...baseMapping,
        symbol: symbol,
        primary: `${baseMapping.primary.replace('1!', '')}${month}${fullYear}`,
        yahoo: `${baseMapping.symbol}${month}${year}%3DF`,
        description: `${baseMapping.description} (${month}${year} Contract)`
      }
    }
  }

  return null
}

/**
 * Get available data sources for a symbol
 */
export function getAvailableDataSources(symbol: string): {
  tradingView: string | null
  yahoo: string | null
  etf: string | null
  sources: string[]
} {
  const mapping = getHybridSymbolMapping(symbol)
  if (!mapping) {
    return {
      tradingView: null,
      yahoo: null,
      etf: null,
      sources: []
    }
  }

  return {
    tradingView: mapping.primary,
    yahoo: mapping.yahoo,
    etf: mapping.etf,
    sources: ['tradingview', 'yahoo', 'etf']
  }
}

/**
 * Get best available symbol for current provider
 */
export function getBestAvailableSymbol(
  symbol: string,
  provider: 'tradingview' | 'yahoo' | 'etf' = 'tradingview'
): string | null {
  const sources = getAvailableDataSources(symbol)
  
  switch (provider) {
    case 'tradingview':
      return sources.tradingView
    case 'yahoo':
      return sources.yahoo
    case 'etf':
      return sources.etf
    default:
      return sources.tradingView || sources.yahoo || sources.etf
  }
}
