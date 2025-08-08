/**
 * TradingView Symbol Mapping for Subscription Users
 * Converts trading journal symbols to TradingView format for real-time data access
 */

export interface SymbolMapping {
  tradingViewSymbol: string
  exchange: string
  assetClass: 'futures' | 'etf' | 'crypto' | 'forex' | 'index'
  description: string
  multiplier?: number
  tickSize?: number
  timezone?: string
}

// Comprehensive symbol mappings for TradingView subscription access
export const TRADINGVIEW_SYMBOL_MAPPINGS: Record<string, SymbolMapping> = {
  // ===== NASDAQ FUTURES =====
  'NQ': {
    tradingViewSymbol: 'CME_MINI:NQ1!',
    exchange: 'CME',
    assetClass: 'futures',
    description: 'E-mini NASDAQ-100 Futures (Continuous Contract)',
    multiplier: 20,
    tickSize: 0.25,
    timezone: 'America/Chicago'
  },
  'MNQ': {
    tradingViewSymbol: 'CME_MINI:MNQ1!',
    exchange: 'CME',
    assetClass: 'futures',
    description: 'Micro E-mini NASDAQ-100 Futures (Continuous Contract)', 
    multiplier: 2,
    tickSize: 0.25,
    timezone: 'America/Chicago'
  },
  
  // NASDAQ Contract Months
  'MNQU5': { tradingViewSymbol: 'CME_MINI:MNQU2025', exchange: 'CME', assetClass: 'futures', description: 'Micro NASDAQ Sep 2025' },
  'NQH25': { tradingViewSymbol: 'CME_MINI:NQH2025', exchange: 'CME', assetClass: 'futures', description: 'NASDAQ Mar 2025' },
  'NQM25': { tradingViewSymbol: 'CME_MINI:NQM2025', exchange: 'CME', assetClass: 'futures', description: 'NASDAQ Jun 2025' },
  'NQU25': { tradingViewSymbol: 'CME_MINI:NQU2025', exchange: 'CME', assetClass: 'futures', description: 'NASDAQ Sep 2025' },
  'NQZ25': { tradingViewSymbol: 'CME_MINI:NQZ2025', exchange: 'CME', assetClass: 'futures', description: 'NASDAQ Dec 2025' },
  'MNQH25': { tradingViewSymbol: 'CME_MINI:MNQH2025', exchange: 'CME', assetClass: 'futures', description: 'Micro NASDAQ Mar 2025' },
  'MNQM25': { tradingViewSymbol: 'CME_MINI:MNQM2025', exchange: 'CME', assetClass: 'futures', description: 'Micro NASDAQ Jun 2025' },
  'MNQZ25': { tradingViewSymbol: 'CME_MINI:MNQZ2025', exchange: 'CME', assetClass: 'futures', description: 'Micro NASDAQ Dec 2025' },

  // ===== S&P 500 FUTURES =====
  'ES': {
    tradingViewSymbol: 'CME_MINI:ES1!',
    exchange: 'CME',
    assetClass: 'futures',
    description: 'E-mini S&P 500 Futures (Continuous Contract)',
    multiplier: 50,
    tickSize: 0.25,
    timezone: 'America/Chicago'
  },
  'MES': {
    tradingViewSymbol: 'CME_MINI:MES1!',
    exchange: 'CME',
    assetClass: 'futures',
    description: 'Micro E-mini S&P 500 Futures (Continuous Contract)',
    multiplier: 5,
    tickSize: 0.25,
    timezone: 'America/Chicago'
  },
  
  // S&P Contract Months
  'ESH25': { tradingViewSymbol: 'CME_MINI:ESH2025', exchange: 'CME', assetClass: 'futures', description: 'S&P 500 Mar 2025' },
  'ESM25': { tradingViewSymbol: 'CME_MINI:ESM2025', exchange: 'CME', assetClass: 'futures', description: 'S&P 500 Jun 2025' },
  'ESU25': { tradingViewSymbol: 'CME_MINI:ESU2025', exchange: 'CME', assetClass: 'futures', description: 'S&P 500 Sep 2025' },
  'ESZ25': { tradingViewSymbol: 'CME_MINI:ESZ2025', exchange: 'CME', assetClass: 'futures', description: 'S&P 500 Dec 2025' },
  'MESH25': { tradingViewSymbol: 'CME_MINI:MESH2025', exchange: 'CME', assetClass: 'futures', description: 'Micro S&P 500 Mar 2025' },
  'MESM25': { tradingViewSymbol: 'CME_MINI:MESM2025', exchange: 'CME', assetClass: 'futures', description: 'Micro S&P 500 Jun 2025' },
  'MESU25': { tradingViewSymbol: 'CME_MINI:MESU2025', exchange: 'CME', assetClass: 'futures', description: 'Micro S&P 500 Sep 2025' },
  'MESZ25': { tradingViewSymbol: 'CME_MINI:MESZ2025', exchange: 'CME', assetClass: 'futures', description: 'Micro S&P 500 Dec 2025' },

  // ===== RUSSELL 2000 FUTURES =====
  'RTY': {
    tradingViewSymbol: 'CME_MINI:RTY1!',
    exchange: 'CME',
    assetClass: 'futures',
    description: 'E-mini Russell 2000 Futures (Continuous Contract)',
    multiplier: 50,
    tickSize: 0.10,
    timezone: 'America/Chicago'
  },
  'M2K': {
    tradingViewSymbol: 'CME_MINI:M2K1!',
    exchange: 'CME',
    assetClass: 'futures',
    description: 'Micro E-mini Russell 2000 Futures (Continuous Contract)',
    multiplier: 5,
    tickSize: 0.10,
    timezone: 'America/Chicago'
  },
  
  // Russell Contract Months
  'RTYH25': { tradingViewSymbol: 'CME_MINI:RTYH2025', exchange: 'CME', assetClass: 'futures', description: 'Russell 2000 Mar 2025' },
  'RTYM25': { tradingViewSymbol: 'CME_MINI:RTYM2025', exchange: 'CME', assetClass: 'futures', description: 'Russell 2000 Jun 2025' },
  'RTYU25': { tradingViewSymbol: 'CME_MINI:RTYU2025', exchange: 'CME', assetClass: 'futures', description: 'Russell 2000 Sep 2025' },
  'RTYZ25': { tradingViewSymbol: 'CME_MINI:RTYZ2025', exchange: 'CME', assetClass: 'futures', description: 'Russell 2000 Dec 2025' },

  // ===== DOW FUTURES =====
  'YM': {
    tradingViewSymbol: 'CBOT_MINI:YM1!',
    exchange: 'CBOT',
    assetClass: 'futures',
    description: 'E-mini Dow Jones Futures (Continuous Contract)',
    multiplier: 5,
    tickSize: 1.0,
    timezone: 'America/Chicago'
  },
  'MYM': {
    tradingViewSymbol: 'CBOT_MINI:MYM1!',
    exchange: 'CBOT',
    assetClass: 'futures',
    description: 'Micro E-mini Dow Jones Futures (Continuous Contract)',
    multiplier: 0.5,
    tickSize: 1.0,
    timezone: 'America/Chicago'
  },
  
  // Dow Contract Months
  'YMH25': { tradingViewSymbol: 'CBOT_MINI:YMH2025', exchange: 'CBOT', assetClass: 'futures', description: 'Dow Jones Mar 2025' },
  'YMM25': { tradingViewSymbol: 'CBOT_MINI:YMM2025', exchange: 'CBOT', assetClass: 'futures', description: 'Dow Jones Jun 2025' },
  'YMU25': { tradingViewSymbol: 'CBOT_MINI:YMU2025', exchange: 'CBOT', assetClass: 'futures', description: 'Dow Jones Sep 2025' },
  'YMZ25': { tradingViewSymbol: 'CBOT_MINI:YMZ2025', exchange: 'CBOT', assetClass: 'futures', description: 'Dow Jones Dec 2025' },

  // ===== GOLD FUTURES =====
  'GC': {
    tradingViewSymbol: 'COMEX:GC1!',
    exchange: 'COMEX',
    assetClass: 'futures',
    description: 'Gold Futures (Continuous Contract)',
    multiplier: 100,
    tickSize: 0.10,
    timezone: 'America/New_York'
  },
  
  // Gold Contract Months
  'GCG25': { tradingViewSymbol: 'COMEX:GCG2025', exchange: 'COMEX', assetClass: 'futures', description: 'Gold Feb 2025' },
  'GCJ25': { tradingViewSymbol: 'COMEX:GCJ2025', exchange: 'COMEX', assetClass: 'futures', description: 'Gold Apr 2025' },
  'GCM25': { tradingViewSymbol: 'COMEX:GCM2025', exchange: 'COMEX', assetClass: 'futures', description: 'Gold Jun 2025' },
  'GCQ25': { tradingViewSymbol: 'COMEX:GCQ2025', exchange: 'COMEX', assetClass: 'futures', description: 'Gold Aug 2025' },
  'GCZ25': { tradingViewSymbol: 'COMEX:GCZ2025', exchange: 'COMEX', assetClass: 'futures', description: 'Gold Dec 2025' },

  // ===== SILVER FUTURES =====
  'SI': {
    tradingViewSymbol: 'COMEX:SI1!',
    exchange: 'COMEX',
    assetClass: 'futures',
    description: 'Silver Futures (Continuous Contract)',
    multiplier: 5000,
    tickSize: 0.005,
    timezone: 'America/New_York'
  },
  'SIF25': { tradingViewSymbol: 'COMEX:SIF2025', exchange: 'COMEX', assetClass: 'futures', description: 'Silver Jan 2025' },
  'SIH25': { tradingViewSymbol: 'COMEX:SIH2025', exchange: 'COMEX', assetClass: 'futures', description: 'Silver Mar 2025' },
  'SIK25': { tradingViewSymbol: 'COMEX:SIK2025', exchange: 'COMEX', assetClass: 'futures', description: 'Silver May 2025' },
  'SIN25': { tradingViewSymbol: 'COMEX:SIN2025', exchange: 'COMEX', assetClass: 'futures', description: 'Silver Jul 2025' },

  // ===== OIL FUTURES =====
  'CL': {
    tradingViewSymbol: 'NYMEX:CL1!',
    exchange: 'NYMEX',
    assetClass: 'futures',
    description: 'Crude Oil Futures WTI (Continuous Contract)',
    multiplier: 1000,
    tickSize: 0.01,
    timezone: 'America/New_York'
  },
  'CLK25': { tradingViewSymbol: 'NYMEX:CLK2025', exchange: 'NYMEX', assetClass: 'futures', description: 'Crude Oil May 2025' },
  'CLM25': { tradingViewSymbol: 'NYMEX:CLM2025', exchange: 'NYMEX', assetClass: 'futures', description: 'Crude Oil Jun 2025' },
  'CLN25': { tradingViewSymbol: 'NYMEX:CLN2025', exchange: 'NYMEX', assetClass: 'futures', description: 'Crude Oil Jul 2025' },
  'CLQ25': { tradingViewSymbol: 'NYMEX:CLQ2025', exchange: 'NYMEX', assetClass: 'futures', description: 'Crude Oil Aug 2025' },

  // ===== NATURAL GAS FUTURES =====
  'NG': {
    tradingViewSymbol: 'NYMEX:NG1!',
    exchange: 'NYMEX',
    assetClass: 'futures',
    description: 'Natural Gas Futures (Continuous Contract)',
    multiplier: 10000,
    tickSize: 0.001,
    timezone: 'America/New_York'
  },
  'NGK25': { tradingViewSymbol: 'NYMEX:NGK2025', exchange: 'NYMEX', assetClass: 'futures', description: 'Natural Gas May 2025' },
  'NGM25': { tradingViewSymbol: 'NYMEX:NGM2025', exchange: 'NYMEX', assetClass: 'futures', description: 'Natural Gas Jun 2025' },
  'NGN25': { tradingViewSymbol: 'NYMEX:NGN2025', exchange: 'NYMEX', assetClass: 'futures', description: 'Natural Gas Jul 2025' },

  // ===== TREASURY FUTURES =====
  'ZB': {
    tradingViewSymbol: 'CBOT:ZB1!',
    exchange: 'CBOT',
    assetClass: 'futures',
    description: '30-Year Treasury Bond Futures (Continuous Contract)',
    multiplier: 1000,
    tickSize: 0.03125,
    timezone: 'America/Chicago'
  },
  'ZN': {
    tradingViewSymbol: 'CBOT:ZN1!',
    exchange: 'CBOT',
    assetClass: 'futures',
    description: '10-Year Treasury Note Futures (Continuous Contract)',
    multiplier: 1000,
    tickSize: 0.015625,
    timezone: 'America/Chicago'
  },
  'ZF': {
    tradingViewSymbol: 'CBOT:ZF1!',
    exchange: 'CBOT',
    assetClass: 'futures',
    description: '5-Year Treasury Note Futures (Continuous Contract)',
    multiplier: 1000,
    tickSize: 0.0078125,
    timezone: 'America/Chicago'
  },

  // ===== CRYPTO =====
  'BTC': {
    tradingViewSymbol: 'BINANCE:BTCUSDT',
    exchange: 'BINANCE',
    assetClass: 'crypto',
    description: 'Bitcoin / US Dollar Tether',
    tickSize: 0.01,
    timezone: 'UTC'
  },
  'ETH': {
    tradingViewSymbol: 'BINANCE:ETHUSDT',
    exchange: 'BINANCE',
    assetClass: 'crypto',
    description: 'Ethereum / US Dollar Tether',
    tickSize: 0.01,
    timezone: 'UTC'
  },
  'SOL': {
    tradingViewSymbol: 'BINANCE:SOLUSDT',
    exchange: 'BINANCE',
    assetClass: 'crypto',
    description: 'Solana / US Dollar Tether',
    tickSize: 0.001,
    timezone: 'UTC'
  },

  // ===== ETFS =====
  'QQQ': {
    tradingViewSymbol: 'NASDAQ:QQQ',
    exchange: 'NASDAQ',
    assetClass: 'etf',
    description: 'Invesco QQQ Trust (NASDAQ-100 ETF)',
    tickSize: 0.01,
    timezone: 'America/New_York'
  },
  'SPY': {
    tradingViewSymbol: 'NASDAQ:SPY',
    exchange: 'NASDAQ',
    assetClass: 'etf',
    description: 'SPDR S&P 500 ETF Trust',
    tickSize: 0.01,
    timezone: 'America/New_York'
  },
  'IWM': {
    tradingViewSymbol: 'NASDAQ:IWM',
    exchange: 'NASDAQ',
    assetClass: 'etf',
    description: 'iShares Russell 2000 ETF',
    tickSize: 0.01,
    timezone: 'America/New_York'
  },
  'DIA': {
    tradingViewSymbol: 'NASDAQ:DIA',
    exchange: 'NASDAQ',
    assetClass: 'etf',
    description: 'SPDR Dow Jones Industrial Average ETF',
    tickSize: 0.01,
    timezone: 'America/New_York'
  },
  'GLD': {
    tradingViewSymbol: 'NASDAQ:GLD',
    exchange: 'NASDAQ',
    assetClass: 'etf',
    description: 'SPDR Gold Shares ETF',
    tickSize: 0.01,
    timezone: 'America/New_York'
  },
  'SLV': {
    tradingViewSymbol: 'NASDAQ:SLV',
    exchange: 'NASDAQ',
    assetClass: 'etf',
    description: 'iShares Silver Trust ETF',
    tickSize: 0.01,
    timezone: 'America/New_York'
  },
  'USO': {
    tradingViewSymbol: 'NASDAQ:USO',
    exchange: 'NASDAQ',
    assetClass: 'etf',
    description: 'United States Oil Fund ETF',
    tickSize: 0.01,
    timezone: 'America/New_York'
  },
  'UNG': {
    tradingViewSymbol: 'NASDAQ:UNG',
    exchange: 'NASDAQ',
    assetClass: 'etf',
    description: 'United States Natural Gas Fund ETF',
    tickSize: 0.01,
    timezone: 'America/New_York'
  },

  // ===== FOREX =====
  'EURUSD': {
    tradingViewSymbol: 'FX_IDC:EURUSD',
    exchange: 'FX_IDC',
    assetClass: 'forex',
    description: 'Euro / US Dollar',
    tickSize: 0.00001,
    timezone: 'UTC'
  },
  'GBPUSD': {
    tradingViewSymbol: 'FX_IDC:GBPUSD',
    exchange: 'FX_IDC',
    assetClass: 'forex',
    description: 'British Pound / US Dollar',
    tickSize: 0.00001,
    timezone: 'UTC'
  },
  'USDJPY': {
    tradingViewSymbol: 'FX_IDC:USDJPY',
    exchange: 'FX_IDC',
    assetClass: 'forex',
    description: 'US Dollar / Japanese Yen',
    tickSize: 0.001,
    timezone: 'UTC'
  },
  'AUDUSD': {
    tradingViewSymbol: 'FX_IDC:AUDUSD', 
    exchange: 'FX_IDC',
    assetClass: 'forex',
    description: 'Australian Dollar / US Dollar',
    tickSize: 0.00001,
    timezone: 'UTC'
  },

  // ===== INDICES =====
  'VIX': {
    tradingViewSymbol: 'CBOE:VIX',
    exchange: 'CBOE',
    assetClass: 'index',
    description: 'CBOE Volatility Index',
    tickSize: 0.01,
    timezone: 'America/Chicago'
  },
  'VXX': {
    tradingViewSymbol: 'NASDAQ:VXX',
    exchange: 'NASDAQ', 
    assetClass: 'etf',
    description: 'iPath Series B S&P 500 VIX Short-Term Futures ETN',
    tickSize: 0.01,
    timezone: 'America/New_York'
  }
}

// Interval mapping for TradingView
export const TRADINGVIEW_INTERVAL_MAPPING: Record<string, string> = {
  '1m': '1',
  '2m': '2',
  '3m': '3',
  '5m': '5',
  '10m': '10',
  '15m': '15',
  '30m': '30',
  '1h': '60',
  '2h': '120',
  '3h': '180',
  '4h': '240',
  '6h': '360',
  '8h': '480',
  '12h': '720',
  '1d': 'D',
  '1w': 'W',
  '1M': 'M'
}

/**
 * Get TradingView symbol mapping for a given symbol
 */
export function getTradingViewSymbol(symbol: string): SymbolMapping | null {
  // Direct lookup first
  if (TRADINGVIEW_SYMBOL_MAPPINGS[symbol]) {
    return TRADINGVIEW_SYMBOL_MAPPINGS[symbol]
  }

  // Handle contract months by stripping them and looking up base symbol
  const baseSymbol = symbol.replace(/[FGHJKMNQUVXZ]\d{2,4}$/, '')
  if (TRADINGVIEW_SYMBOL_MAPPINGS[baseSymbol]) {
    const mapping = TRADINGVIEW_SYMBOL_MAPPINGS[baseSymbol]
    return {
      ...mapping,
      description: `${mapping.description} (Contract: ${symbol})`
    }
  }

  return null
}

/**
 * Get TradingView interval format
 */
export function getTradingViewInterval(interval: string): string {
  return TRADINGVIEW_INTERVAL_MAPPING[interval] || 'D'
}

/**
 * Check if symbol has real-time TradingView support
 */
export function hasRealTimeSupport(symbol: string): boolean {
  return getTradingViewSymbol(symbol) !== null
}

/**
 * Get all supported symbols
 */
export function getSupportedSymbols(): string[] {
  return Object.keys(TRADINGVIEW_SYMBOL_MAPPINGS)
}

/**
 * Get symbols by asset class
 */
export function getSymbolsByAssetClass(assetClass: 'futures' | 'etf' | 'crypto' | 'forex' | 'index'): string[] {
  return Object.entries(TRADINGVIEW_SYMBOL_MAPPINGS)
    .filter(([, mapping]) => mapping.assetClass === assetClass)
    .map(([symbol]) => symbol)
}

/**
 * Format symbol for display with exchange info
 */
export function formatSymbolDisplay(symbol: string): string {
  const mapping = getTradingViewSymbol(symbol)
  if (!mapping) return symbol
  
  return `${symbol} (${mapping.exchange}:${mapping.tradingViewSymbol.split(':')[1]})`
}

/**
 * Get trading session hours for a symbol
 */
export function getTradingHours(symbol: string): { start: string; end: string; timezone: string } | null {
  const mapping = getTradingViewSymbol(symbol)
  if (!mapping) return null

  const defaultHours = {
    'America/Chicago': { start: '17:00', end: '16:00', timezone: 'America/Chicago' }, // Futures
    'America/New_York': { start: '09:30', end: '16:00', timezone: 'America/New_York' }, // Stocks/ETFs
    'UTC': { start: '00:00', end: '23:59', timezone: 'UTC' } // Crypto/Forex
  }

  const timezone = mapping.timezone || 'America/New_York'
  return defaultHours[timezone as keyof typeof defaultHours] || defaultHours['America/New_York']
}

/**
 * Auto-detect symbol format and get TradingView equivalent
 */
export function autoDetectTradingViewSymbol(rawSymbol: string): {
  originalSymbol: string
  tradingViewMapping: SymbolMapping | null
  confidence: 'high' | 'medium' | 'low'
  suggestions?: string[]
} {
  const cleaned = rawSymbol.toUpperCase().trim()
  
  // Direct match - highest confidence
  const directMatch = getTradingViewSymbol(cleaned)
  if (directMatch) {
    return {
      originalSymbol: rawSymbol,
      tradingViewMapping: directMatch,
      confidence: 'high'
    }
  }

  // Fuzzy matching for common variations
  const fuzzyMatches: string[] = []
  
  // Try variations without numbers/letters
  const basePattern = cleaned.replace(/[0-9FGHJKMNQUVXZ]+$/, '')
  Object.keys(TRADINGVIEW_SYMBOL_MAPPINGS).forEach(key => {
    if (key.startsWith(basePattern) || basePattern.startsWith(key)) {
      fuzzyMatches.push(key)
    }
  })

  if (fuzzyMatches.length > 0) {
    const bestMatch = getTradingViewSymbol(fuzzyMatches[0])
    return {
      originalSymbol: rawSymbol,
      tradingViewMapping: bestMatch,
      confidence: 'medium',
      suggestions: fuzzyMatches.slice(0, 5)
    }
  }

  return {
    originalSymbol: rawSymbol,
    tradingViewMapping: null,
    confidence: 'low',
    suggestions: []
  }
}

/**
 * Validate if a symbol is correctly formatted for TradingView
 */
export function validateTradingViewSymbol(symbol: string): {
  isValid: boolean
  mapping?: SymbolMapping
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  if (!symbol || symbol.trim().length === 0) {
    errors.push('Symbol cannot be empty')
    return { isValid: false, errors, warnings }
  }

  const mapping = getTradingViewSymbol(symbol.toUpperCase().trim())
  
  if (!mapping) {
    errors.push(`Symbol '${symbol}' not found in TradingView mappings`)
    
    // Suggest similar symbols
    const suggestions = Object.keys(TRADINGVIEW_SYMBOL_MAPPINGS)
      .filter(key => key.includes(symbol.toUpperCase()) || symbol.toUpperCase().includes(key))
      .slice(0, 3)
    
    if (suggestions.length > 0) {
      warnings.push(`Did you mean: ${suggestions.join(', ')}?`)
    }

    return { isValid: false, errors, warnings }
  }

  // Check for expired contracts
  if (symbol.match(/[FGHJKMNQUVXZ]\d{2}$/) && symbol.includes('25')) {
    const currentYear = new Date().getFullYear()
    if (parseInt('20' + symbol.slice(-2)) < currentYear) {
      warnings.push('Contract appears to be expired')
    }
  }

  return {
    isValid: true,
    mapping,
    errors,
    warnings
  }
}