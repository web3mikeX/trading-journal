/**
 * Market Data Service
 * Provides real market data where available, with intelligent fallbacks
 */

export interface OHLCData {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

export interface MarketDataResult {
  symbol: string
  data: OHLCData[]
  dataSource: 'yahoo_finance' | 'synthetic' | 'enhanced_synthetic' | 'cached'
  lastUpdated: number
  error?: string
  metadata?: {
    originalSymbol: string
    proxySymbol?: string
    explanation?: string
  }
}

// Symbol mapping for real data proxies
const SYMBOL_PROXIES: Record<string, { yahoo: string; explanation: string }> = {
  // NASDAQ futures -> QQQ ETF
  'NQ': { yahoo: 'QQQ', explanation: 'QQQ ETF tracks NASDAQ-100, similar price movement to NQ futures' },
  'NQH25': { yahoo: 'QQQ', explanation: 'QQQ ETF tracks NASDAQ-100, similar price movement to NQ futures' },
  'NQM25': { yahoo: 'QQQ', explanation: 'QQQ ETF tracks NASDAQ-100, similar price movement to NQ futures' },
  'NQU25': { yahoo: 'QQQ', explanation: 'QQQ ETF tracks NASDAQ-100, similar price movement to NQ futures' },
  'NQZ25': { yahoo: 'QQQ', explanation: 'QQQ ETF tracks NASDAQ-100, similar price movement to NQ futures' },
  'MNQ': { yahoo: 'QQQ', explanation: 'QQQ ETF tracks NASDAQ-100, similar price movement to MNQ micro futures' },
  
  // S&P 500 futures -> SPY ETF
  'ES': { yahoo: 'SPY', explanation: 'SPY ETF tracks S&P 500, similar price movement to ES futures' },
  'ESH25': { yahoo: 'SPY', explanation: 'SPY ETF tracks S&P 500, similar price movement to ES futures' },
  'ESM25': { yahoo: 'SPY', explanation: 'SPY ETF tracks S&P 500, similar price movement to ES futures' },
  'ESU25': { yahoo: 'SPY', explanation: 'SPY ETF tracks S&P 500, similar price movement to ES futures' },
  'ESZ25': { yahoo: 'SPY', explanation: 'SPY ETF tracks S&P 500, similar price movement to ES futures' },
  'MES': { yahoo: 'SPY', explanation: 'SPY ETF tracks S&P 500, similar price movement to MES micro futures' },
  
  // Russell 2000 futures -> IWM ETF
  'RTY': { yahoo: 'IWM', explanation: 'IWM ETF tracks Russell 2000, similar price movement to RTY futures' },
  'RTYH25': { yahoo: 'IWM', explanation: 'IWM ETF tracks Russell 2000, similar price movement to RTY futures' },
  'RTYM25': { yahoo: 'IWM', explanation: 'IWM ETF tracks Russell 2000, similar price movement to RTY futures' },
  'RTYU25': { yahoo: 'IWM', explanation: 'IWM ETF tracks Russell 2000, similar price movement to RTY futures' },
  'RTYZ25': { yahoo: 'IWM', explanation: 'IWM ETF tracks Russell 2000, similar price movement to RTY futures' },
  'M2K': { yahoo: 'IWM', explanation: 'IWM ETF tracks Russell 2000, similar price movement to M2K micro futures' },
  
  // Dow futures -> DIA ETF
  'YM': { yahoo: 'DIA', explanation: 'DIA ETF tracks Dow Jones, similar price movement to YM futures' },
  'YMH25': { yahoo: 'DIA', explanation: 'DIA ETF tracks Dow Jones, similar price movement to YM futures' },
  'YMM25': { yahoo: 'DIA', explanation: 'DIA ETF tracks Dow Jones, similar price movement to YM futures' },
  'YMU25': { yahoo: 'DIA', explanation: 'DIA ETF tracks Dow Jones, similar price movement to YM futures' },
  'YMZ25': { yahoo: 'DIA', explanation: 'DIA ETF tracks Dow Jones, similar price movement to YM futures' },
  'MYM': { yahoo: 'DIA', explanation: 'DIA ETF tracks Dow Jones, similar price movement to MYM micro futures' },
  
  // Gold futures -> GLD ETF
  'GC': { yahoo: 'GLD', explanation: 'GLD ETF tracks gold prices, similar movement to GC gold futures' },
  'GCG25': { yahoo: 'GLD', explanation: 'GLD ETF tracks gold prices, similar movement to GC gold futures' },
  'GCJ25': { yahoo: 'GLD', explanation: 'GLD ETF tracks gold prices, similar movement to GC gold futures' },
  'GCM25': { yahoo: 'GLD', explanation: 'GLD ETF tracks gold prices, similar movement to GC gold futures' },
  'GCQ25': { yahoo: 'GLD', explanation: 'GLD ETF tracks gold prices, similar movement to GC gold futures' },
  'GCZ25': { yahoo: 'GLD', explanation: 'GLD ETF tracks gold prices, similar movement to GC gold futures' },
  
  // Oil futures -> USO ETF
  'CL': { yahoo: 'USO', explanation: 'USO ETF tracks oil prices, similar movement to CL crude oil futures' },
  'CLF25': { yahoo: 'USO', explanation: 'USO ETF tracks oil prices, similar movement to CL crude oil futures' },
  'CLG25': { yahoo: 'USO', explanation: 'USO ETF tracks oil prices, similar movement to CL crude oil futures' },
  'CLH25': { yahoo: 'USO', explanation: 'USO ETF tracks oil prices, similar movement to CL crude oil futures' },
  'CLJ25': { yahoo: 'USO', explanation: 'USO ETF tracks oil prices, similar movement to CL crude oil futures' },
  'CLK25': { yahoo: 'USO', explanation: 'USO ETF tracks oil prices, similar movement to CL crude oil futures' },
}

// Base prices for synthetic data generation
const SYMBOL_BASE_PRICES: Record<string, number> = {
  'NQ': 20000, 'NQH25': 20000, 'NQM25': 20000, 'NQU25': 20000, 'NQZ25': 20000, 'MNQ': 20000,
  'ES': 5000, 'ESH25': 5000, 'ESM25': 5000, 'ESU25': 5000, 'ESZ25': 5000, 'MES': 5000,
  'RTY': 2000, 'RTYH25': 2000, 'RTYM25': 2000, 'RTYU25': 2000, 'RTYZ25': 2000, 'M2K': 2000,
  'YM': 40000, 'YMH25': 40000, 'YMM25': 40000, 'YMU25': 40000, 'YMZ25': 40000, 'MYM': 40000,
  'GC': 2200, 'GCG25': 2200, 'GCJ25': 2200, 'GCM25': 2200, 'GCQ25': 2200, 'GCZ25': 2200,
  'CL': 80, 'CLF25': 80, 'CLG25': 80, 'CLH25': 80, 'CLJ25': 80, 'CLK25': 80,
}

// Cache for market data
const dataCache = new Map<string, { data: MarketDataResult; expiry: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Fetch market data from Yahoo Finance
 */
async function fetchYahooFinanceData(symbol: string, days: number = 30): Promise<OHLCData[]> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=${days}d`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data.chart?.result?.[0]) {
      throw new Error('No chart data in response')
    }
    
    const result = data.chart.result[0]
    const timestamps = result.timestamp || []
    const quotes = result.indicators?.quote?.[0] || {}
    
    const ohlcData: OHLCData[] = []
    
    for (let i = 0; i < timestamps.length; i++) {
      const timestamp = timestamps[i] * 1000 // Convert to milliseconds
      const open = quotes.open?.[i]
      const high = quotes.high?.[i]
      const low = quotes.low?.[i]
      const close = quotes.close?.[i]
      const volume = quotes.volume?.[i]
      
      // Skip invalid data points
      if (!open || !high || !low || !close || isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) {
        continue
      }
      
      ohlcData.push({
        timestamp,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume: volume ? Math.floor(volume) : undefined
      })
    }
    
    return ohlcData
  } catch (error) {
    throw new Error(`Yahoo Finance fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Generate enhanced synthetic data based on real market patterns
 */
function generateEnhancedSyntheticData(symbol: string, days: number = 30): OHLCData[] {
  const basePrice = SYMBOL_BASE_PRICES[symbol] || SYMBOL_BASE_PRICES[symbol.replace(/[HMU Z]\d{2}$/, '')] || 1000
  const data: OHLCData[] = []
  
  // Market characteristics based on symbol type
  let volatility = 0.015 // 1.5% default daily volatility
  let trendBias = 0
  
  if (symbol.includes('NQ') || symbol.includes('QQQ')) {
    volatility = 0.022 // Higher volatility for tech
    trendBias = 0.0002 // Slight upward bias
  } else if (symbol.includes('ES') || symbol.includes('SPY')) {
    volatility = 0.018 // Moderate volatility
    trendBias = 0.0001 // Slight upward bias
  } else if (symbol.includes('RTY') || symbol.includes('IWM')) {
    volatility = 0.025 // Higher volatility for small caps
  } else if (symbol.includes('GC') || symbol.includes('GLD')) {
    volatility = 0.020 // Gold volatility
    trendBias = 0.0001 // Slight upward bias for inflation hedge
  } else if (symbol.includes('CL') || symbol.includes('USO')) {
    volatility = 0.035 // High oil volatility
  }
  
  let currentPrice = basePrice
  
  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - (days - 1 - i))
    date.setHours(16, 0, 0, 0) // Market close time
    
    // Generate realistic intraday movement
    const dailyMove = (Math.random() - 0.5) * volatility + trendBias
    const openPrice = currentPrice * (1 + dailyMove * 0.3)
    
    // Intraday range
    const range = volatility * 0.6 * currentPrice
    const highMove = Math.random() * range * 0.7
    const lowMove = Math.random() * range * 0.7
    
    const high = Math.max(openPrice, currentPrice) + highMove
    const low = Math.min(openPrice, currentPrice) - lowMove
    const close = currentPrice * (1 + dailyMove)
    
    // Ensure OHLC logic is correct
    const finalHigh = Math.max(openPrice, high, low, close)
    const finalLow = Math.min(openPrice, high, low, close)
    
    data.push({
      timestamp: date.getTime(),
      open: Number(openPrice.toFixed(2)),
      high: Number(finalHigh.toFixed(2)),
      low: Number(finalLow.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: Math.floor(Math.random() * 1000000) + 500000
    })
    
    currentPrice = close
  }
  
  return data
}

/**
 * Get market data for a symbol with intelligent fallbacks
 * This is now a client-side wrapper that calls the API
 */
export async function getMarketData(
  symbol: string, 
  days: number = 30,
  preferRealData: boolean = true
): Promise<MarketDataResult> {
  // For client-side usage, always call the API endpoint
  // The server will handle Yahoo Finance fetching to avoid CORS issues
  const url = `/api/market-data?symbol=${encodeURIComponent(symbol)}&days=${days}&preferReal=${preferRealData}`
  
  try {
    const response = await fetch(url)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.warn(`Failed to fetch market data for ${symbol}:`, error)
    
    // Fallback to local synthetic data generation
    console.log(`Generating local synthetic data for ${symbol}`)
    const syntheticData = generateEnhancedSyntheticData(symbol, days)
    
    return {
      symbol,
      data: syntheticData,
      dataSource: 'enhanced_synthetic',
      lastUpdated: Date.now(),
      metadata: {
        originalSymbol: symbol,
        explanation: `Local synthetic data (API unavailable)`
      }
    }
  }
}

/**
 * Check if real data is available for a symbol
 */
export function hasRealDataProxy(symbol: string): boolean {
  return symbol in SYMBOL_PROXIES
}

/**
 * Get the explanation for a symbol mapping
 */
export function getSymbolExplanation(symbol: string): string | null {
  const proxy = SYMBOL_PROXIES[symbol]
  return proxy?.explanation || null
}

/**
 * Clear the data cache
 */
export function clearCache(): void {
  dataCache.clear()
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const now = Date.now()
  const entries = Array.from(dataCache.entries())
  
  return {
    totalEntries: entries.length,
    validEntries: entries.filter(([, entry]) => entry.expiry > now).length,
    expiredEntries: entries.filter(([, entry]) => entry.expiry <= now).length,
    cacheHitRate: 0 // Would need to track hits/misses to calculate
  }
}