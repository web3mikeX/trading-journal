/**
 * Enhanced Market Data Service
 * Free multi-provider approach: Yahoo Finance + Alpha Vantage + Finnhub
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
  dataSource: 'yahoo_finance' | 'alpha_vantage' | 'finnhub' | 'synthetic' | 'enhanced_synthetic' | 'cached'
  lastUpdated: number
  error?: string
  metadata?: {
    originalSymbol: string
    proxySymbol?: string
    explanation?: string
    provider: string
  }
}

// Enhanced ETF mappings for Yahoo Finance
const ENHANCED_YAHOO_MAPPINGS: Record<string, { yahoo: string; explanation: string }> = {
  // NASDAQ futures
  'NQ': { yahoo: 'QQQ', explanation: 'QQQ ETF tracks NASDAQ-100, similar to NQ futures' },
  'MNQ': { yahoo: 'QQQ', explanation: 'QQQ ETF tracks NASDAQ-100, similar to MNQ micro futures' },
  'NQH25': { yahoo: 'QQQ', explanation: 'QQQ ETF tracks NASDAQ-100, similar to NQ futures' },
  'NQM25': { yahoo: 'QQQ', explanation: 'QQQ ETF tracks NASDAQ-100, similar to NQ futures' },
  'NQU25': { yahoo: 'QQQ', explanation: 'QQQ ETF tracks NASDAQ-100, similar to NQ futures' },
  'NQZ25': { yahoo: 'QQQ', explanation: 'QQQ ETF tracks NASDAQ-100, similar to NQ futures' },
  
  // S&P 500 futures
  'ES': { yahoo: 'SPY', explanation: 'SPY ETF tracks S&P 500, similar to ES futures' },
  'MES': { yahoo: 'SPY', explanation: 'SPY ETF tracks S&P 500, similar to MES micro futures' },
  'ESH25': { yahoo: 'SPY', explanation: 'SPY ETF tracks S&P 500, similar to ES futures' },
  'ESM25': { yahoo: 'SPY', explanation: 'SPY ETF tracks S&P 500, similar to ES futures' },
  'ESU25': { yahoo: 'SPY', explanation: 'SPY ETF tracks S&P 500, similar to ES futures' },
  'ESZ25': { yahoo: 'SPY', explanation: 'SPY ETF tracks S&P 500, similar to ES futures' },
  
  // Russell 2000 futures
  'RTY': { yahoo: 'IWM', explanation: 'IWM ETF tracks Russell 2000, similar to RTY futures' },
  'M2K': { yahoo: 'IWM', explanation: 'IWM ETF tracks Russell 2000, similar to M2K micro futures' },
  'RTYH25': { yahoo: 'IWM', explanation: 'IWM ETF tracks Russell 2000, similar to RTY futures' },
  'RTYM25': { yahoo: 'IWM', explanation: 'IWM ETF tracks Russell 2000, similar to RTY futures' },
  
  // Dow futures
  'YM': { yahoo: 'DIA', explanation: 'DIA ETF tracks Dow Jones, similar to YM futures' },
  'MYM': { yahoo: 'DIA', explanation: 'DIA ETF tracks Dow Jones, similar to MYM micro futures' },
  'YMH25': { yahoo: 'DIA', explanation: 'DIA ETF tracks Dow Jones, similar to YM futures' },
  'YMM25': { yahoo: 'DIA', explanation: 'DIA ETF tracks Dow Jones, similar to YM futures' },
  
  // Gold futures
  'GC': { yahoo: 'GLD', explanation: 'GLD ETF tracks gold prices, similar to GC futures' },
  'GCG25': { yahoo: 'GLD', explanation: 'GLD ETF tracks gold prices, similar to GC futures' },
  'GCJ25': { yahoo: 'GLD', explanation: 'GLD ETF tracks gold prices, similar to GC futures' },
  'GCM25': { yahoo: 'GLD', explanation: 'GLD ETF tracks gold prices, similar to GC futures' },
  
  // Silver futures
  'SI': { yahoo: 'SLV', explanation: 'SLV ETF tracks silver prices, similar to SI futures' },
  'SIF25': { yahoo: 'SLV', explanation: 'SLV ETF tracks silver prices, similar to SI futures' },
  
  // Oil futures
  'CL': { yahoo: 'USO', explanation: 'USO ETF tracks oil prices, similar to CL futures' },
  'CLK25': { yahoo: 'USO', explanation: 'USO ETF tracks oil prices, similar to CL futures' },
  'CLM25': { yahoo: 'USO', explanation: 'USO ETF tracks oil prices, similar to CL futures' },
  
  // Natural gas futures
  'NG': { yahoo: 'UNG', explanation: 'UNG ETF tracks natural gas, similar to NG futures' },
  'NGK25': { yahoo: 'UNG', explanation: 'UNG ETF tracks natural gas, similar to NG futures' },
  
  // Treasury bonds
  'ZB': { yahoo: 'TLT', explanation: 'TLT ETF tracks 20+ year Treasury bonds, similar to ZB futures' },
  'ZN': { yahoo: 'IEF', explanation: 'IEF ETF tracks 7-10 year Treasury bonds, similar to ZN futures' },
  
  // Crypto ETFs
  'BTC': { yahoo: 'BITO', explanation: 'BITO ETF tracks Bitcoin futures' },
  'ETH': { yahoo: 'ETHE', explanation: 'ETHE ETF tracks Ethereum' },
  
  // Popular Forex symbols mapped to currency ETFs
  'EURUSD': { yahoo: 'FXE', explanation: 'FXE ETF tracks EUR/USD exchange rate' },
  'GBPUSD': { yahoo: 'FXB', explanation: 'FXB ETF tracks GBP/USD exchange rate' },
  'USDJPY': { yahoo: 'FXY', explanation: 'FXY ETF tracks USD/JPY exchange rate (inverted)' },
  'AUDUSD': { yahoo: 'FXA', explanation: 'FXA ETF tracks AUD/USD exchange rate' },
  
  // VIX and volatility
  'VIX': { yahoo: 'VIX', explanation: 'VIX volatility index' },
  'VXX': { yahoo: 'VXX', explanation: 'VXX volatility ETF' },
  
  // Additional commodity futures
  'HG': { yahoo: 'JJC', explanation: 'JJC ETF tracks copper prices, similar to HG futures' },
  'ZC': { yahoo: 'CORN', explanation: 'CORN ETF tracks corn prices, similar to ZC futures' },
  'ZS': { yahoo: 'SOYB', explanation: 'SOYB ETF tracks soybean prices, similar to ZS futures' },
  'ZW': { yahoo: 'WEAT', explanation: 'WEAT ETF tracks wheat prices, similar to ZW futures' },
}

// Alpha Vantage futures symbols - Updated mappings based on testing
const ALPHA_VANTAGE_SYMBOLS: Record<string, string> = {
  // Futures mapped to ETFs (most reliable approach)
  'NQ': 'QQQ',      // Use QQQ ETF instead of NDX index (NDX not available)
  'ES': 'SPY',      // Use SPY ETF instead of SPX index (SPX not available)
  'RTY': 'IWM',     // Russell 2000 ETF
  'YM': 'DIA',      // Dow Jones ETF
  'GC': 'GLD',      // Gold ETF (more reliable than GOLD)
  'CL': 'USO',      // Oil ETF (more reliable than OIL)
  'SI': 'SLV',      // Silver ETF (more reliable than SILVER)
  'NG': 'UNG',      // Natural gas ETF (more reliable than NATGAS)
  'ZB': 'TLT',      // 20+ year Treasury ETF
  'ZN': 'IEF',      // 7-10 year Treasury ETF
  
  // Forex ETFs
  'EURUSD': 'FXE',  // EUR/USD ETF
  'GBPUSD': 'FXB',  // GBP/USD ETF
  'USDJPY': 'FXY',  // USD/JPY ETF (inverted)
  'AUDUSD': 'FXA',  // AUD/USD ETF
  
  // Volatility and crypto
  'VIX': 'VIX',     // VIX index
  'BTC': 'BITO',    // Bitcoin ETF
  'ETH': 'ETHE',    // Ethereum ETF
  
  // Additional commodities
  'HG': 'JJC',      // Copper ETF
  'ZC': 'CORN',     // Corn ETF
  'ZS': 'SOYB',     // Soybean ETF
  'ZW': 'WEAT',     // Wheat ETF
  
  // Keep direct ETF symbols as-is
  'QQQ': 'QQQ', 'SPY': 'SPY', 'IWM': 'IWM', 'DIA': 'DIA',
  'GLD': 'GLD', 'SLV': 'SLV', 'USO': 'USO', 'UNG': 'UNG',
  'TLT': 'TLT', 'IEF': 'IEF', 'FXE': 'FXE', 'FXB': 'FXB',
  'FXY': 'FXY', 'FXA': 'FXA', 'VXX': 'VXX', 'BITO': 'BITO',
  'ETHE': 'ETHE', 'JJC': 'JJC', 'CORN': 'CORN', 'SOYB': 'SOYB', 'WEAT': 'WEAT',
}

// Finnhub futures symbols
const FINNHUB_SYMBOLS: Record<string, string> = {
  'NQ': 'NQc1',     // NASDAQ futures
  'ES': 'ESc1',     // S&P 500 futures
  'GC': 'GCc1',     // Gold futures
  'CL': 'CLc1',     // Crude oil futures
  'YM': 'YM.cme',   // Dow futures
  'RTY': 'RTY.cme', // Russell 2000 futures
}

// Cache configuration - Optimized for faster loading
const CACHE_DURATION = {
  yahoo: 5 * 60 * 1000,       // 5 minutes for Yahoo (faster refresh)
  alphaVantage: 30 * 60 * 1000, // 30 minutes for Alpha Vantage  
  finnhub: 15 * 60 * 1000,    // 15 minutes for Finnhub
  synthetic: 30 * 60 * 1000,  // 30 minutes for synthetic
}

// Rate limiting
const RATE_LIMITS = {
  alphaVantage: { calls: 5, period: 60 * 1000 },      // 5 calls per minute
  finnhub: { calls: 60, period: 60 * 1000 },          // 60 calls per minute
}

// Cache for market data
const dataCache = new Map<string, { data: MarketDataResult; expiry: number }>()
const rateLimitCache = new Map<string, { count: number; resetTime: number }>()

/**
 * Check rate limits
 */
function checkRateLimit(provider: string): boolean {
  const limit = RATE_LIMITS[provider as keyof typeof RATE_LIMITS]
  if (!limit) return true
  
  const now = Date.now()
  const cacheKey = `rate_${provider}`
  const cached = rateLimitCache.get(cacheKey)
  
  if (!cached || now >= cached.resetTime) {
    rateLimitCache.set(cacheKey, { count: 1, resetTime: now + limit.period })
    return true
  }
  
  if (cached.count < limit.calls) {
    cached.count++
    return true
  }
  
  return false
}

/**
 * Fetch from Alpha Vantage
 */
async function fetchAlphaVantageData(symbol: string, days: number = 7): Promise<OHLCData[]> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY
  if (!apiKey) {
    throw new Error('Alpha Vantage API key not configured')
  }
  
  if (!checkRateLimit('alphaVantage')) {
    throw new Error('Alpha Vantage rate limit exceeded')
  }
  
  const avSymbol = ALPHA_VANTAGE_SYMBOLS[symbol] || symbol
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${avSymbol}&apikey=${apiKey}&outputsize=compact`
  
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    
    const data = await response.json()
    if (data['Error Message']) throw new Error('Invalid symbol')
    if (data['Note']) throw new Error('Rate limit message')
    
    const timeSeries = data['Time Series (Daily)']
    if (!timeSeries) throw new Error('No time series data')
    
    const ohlcData: OHLCData[] = []
    const dates = Object.keys(timeSeries).sort().slice(-days)
    
    for (const date of dates) {
      const dayData = timeSeries[date]
      ohlcData.push({
        timestamp: new Date(date).getTime(),
        open: parseFloat(dayData['1. open']),
        high: parseFloat(dayData['2. high']),
        low: parseFloat(dayData['3. low']),
        close: parseFloat(dayData['4. close']),
        volume: parseInt(dayData['5. volume'])
      })
    }
    
    return ohlcData
  } catch (error) {
    throw new Error(`Alpha Vantage fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Fetch from Finnhub
 */
async function fetchFinnhubData(symbol: string, days: number = 7): Promise<OHLCData[]> {
  const apiKey = process.env.FINNHUB_API_KEY
  if (!apiKey) {
    throw new Error('Finnhub API key not configured')
  }
  
  if (!checkRateLimit('finnhub')) {
    throw new Error('Finnhub rate limit exceeded')
  }
  
  const finnhubSymbol = FINNHUB_SYMBOLS[symbol] || symbol
  const to = Math.floor(Date.now() / 1000)
  const from = to - (days * 24 * 60 * 60)
  
  const url = `https://finnhub.io/api/v1/stock/candle?symbol=${finnhubSymbol}&resolution=D&from=${from}&to=${to}&token=${apiKey}`
  
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    
    const data = await response.json()
    if (!data.c || !data.t) throw new Error('Invalid response format')
    
    const ohlcData: OHLCData[] = []
    for (let i = 0; i < data.t.length; i++) {
      ohlcData.push({
        timestamp: data.t[i] * 1000,
        open: data.o[i],
        high: data.h[i],
        low: data.l[i],
        close: data.c[i],
        volume: data.v[i]
      })
    }
    
    return ohlcData
  } catch (error) {
    throw new Error(`Finnhub fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Enhanced Yahoo Finance fetching
 */
async function fetchEnhancedYahooData(symbol: string, days: number = 7): Promise<OHLCData[]> {
  const mapping = ENHANCED_YAHOO_MAPPINGS[symbol]
  if (!mapping) {
    throw new Error(`No Yahoo Finance mapping for ${symbol}`)
  }
  
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${mapping.yahoo}?interval=1d&range=${days}d`
  
  try {
    // Create timeout controller for better browser compatibility
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    
    const data = await response.json()
    if (!data.chart?.result?.[0]) throw new Error('No chart data')
    
    const result = data.chart.result[0]
    const timestamps = result.timestamp || []
    const quotes = result.indicators?.quote?.[0] || {}
    
    const ohlcData: OHLCData[] = []
    for (let i = 0; i < timestamps.length; i++) {
      const timestamp = timestamps[i] * 1000
      const open = quotes.open?.[i]
      const high = quotes.high?.[i]
      const low = quotes.low?.[i]
      const close = quotes.close?.[i]
      const volume = quotes.volume?.[i]
      
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
 * Get enhanced market data with multi-provider fallback
 */
export async function getEnhancedMarketData(
  symbol: string,
  days: number = 7,
  preferRealData: boolean = true
): Promise<MarketDataResult> {
  const cacheKey = `enhanced_${symbol}_${days}_${preferRealData}`
  
  // Check cache first
  const cached = dataCache.get(cacheKey)
  if (cached && cached.expiry > Date.now()) {
    return { ...cached.data, dataSource: 'cached' }
  }
  
  let result: MarketDataResult = {
    symbol,
    data: [],
    dataSource: 'synthetic',
    lastUpdated: Date.now(),
    metadata: { originalSymbol: symbol, provider: 'synthetic' }
  }
  
  if (!preferRealData) {
    // Use synthetic data if real data not preferred
    const syntheticData = generateSyntheticData(symbol, days)
    result = {
      symbol,
      data: syntheticData,
      dataSource: 'enhanced_synthetic',
      lastUpdated: Date.now(),
      metadata: {
        originalSymbol: symbol,
        provider: 'synthetic',
        explanation: `Enhanced synthetic data for ${symbol}`
      }
    }
  } else {
    // OPTIMIZED: Try providers in parallel for faster response
    const promises = []
    
    // 1. Yahoo Finance (ETF proxies) - Primary
    const yahooMapping = ENHANCED_YAHOO_MAPPINGS[symbol]
    if (yahooMapping) {
      promises.push(
        fetchEnhancedYahooData(symbol, days)
          .then(data => ({ 
            success: data.length > 0, 
            data, 
            source: 'yahoo_finance',
            metadata: {
              originalSymbol: symbol,
              provider: 'yahoo_finance',
              proxySymbol: yahooMapping.yahoo,
              explanation: yahooMapping.explanation
            }
          }))
          .catch(() => ({ success: false, data: [], source: 'yahoo_finance' }))
      )
    }
    
    // 2. Alpha Vantage (backup) - Run in parallel
    const avSymbol = ALPHA_VANTAGE_SYMBOLS[symbol] 
    if (avSymbol && process.env.ALPHA_VANTAGE_API_KEY) {
      promises.push(
        fetchAlphaVantageData(symbol, days)
          .then(data => ({ 
            success: data.length > 0, 
            data, 
            source: 'alpha_vantage',
            metadata: {
              originalSymbol: symbol,
              provider: 'alpha_vantage',
              proxySymbol: avSymbol
            }
          }))
          .catch(() => ({ success: false, data: [], source: 'alpha_vantage' }))
      )
    }
    
    // Wait for first successful result or all to complete
    if (promises.length > 0) {
      try {
        const results = await Promise.allSettled(promises)
        
        // Find first successful result, prioritizing Yahoo Finance
        for (const settledResult of results) {
          if (settledResult.status === 'fulfilled') {
            const providerResult = settledResult.value
            if (providerResult.success && providerResult.data.length > 0) {
              result = {
                symbol,
                data: providerResult.data,
                dataSource: providerResult.source as any,
                lastUpdated: Date.now(),
                metadata: providerResult.metadata
              }
              
              // Cache with appropriate duration
              const cacheDuration = providerResult.source === 'yahoo_finance' 
                ? CACHE_DURATION.yahoo 
                : CACHE_DURATION.alphaVantage
              dataCache.set(cacheKey, { data: result, expiry: Date.now() + cacheDuration })
              return result
            }
          }
        }
      } catch (error) {
        // If parallel fetch fails, continue to synthetic fallback
      }
    }
  }
  
  // 4. Fallback to synthetic data
  console.log(`Using synthetic data for ${symbol}`)
  const syntheticData = generateSyntheticData(symbol, days)
  result = {
    symbol,
    data: syntheticData,
    dataSource: 'enhanced_synthetic',
    lastUpdated: Date.now(),
    metadata: {
      originalSymbol: symbol,
      provider: 'synthetic',
      explanation: `Enhanced synthetic data for ${symbol}`
    }
  }
  
  dataCache.set(cacheKey, { data: result, expiry: Date.now() + CACHE_DURATION.synthetic })
  return result
}

/**
 * Generate synthetic data as fallback
 */
function generateSyntheticData(symbol: string, days: number = 7): OHLCData[] {
  const basePrices: Record<string, number> = {
    'NQ': 20000, 'ES': 5000, 'RTY': 2000, 'YM': 40000,
    'GC': 2200, 'CL': 80, 'SI': 25, 'NG': 3.5,
    'BTC': 45000, 'ETH': 3000, 'SOL': 150
  }
  
  const basePrice = basePrices[symbol] || basePrices[symbol.replace(/[HMU Z]\d{2}$/, '')] || 1000
  const data: OHLCData[] = []
  
  let volatility = 0.02
  let trendBias = 0
  
  // Adjust volatility based on symbol type
  if (symbol.includes('NQ') || symbol.includes('QQQ')) volatility = 0.025
  else if (symbol.includes('ES') || symbol.includes('SPY')) volatility = 0.018
  else if (symbol.includes('GC') || symbol.includes('GLD')) volatility = 0.02
  else if (symbol.includes('CL') || symbol.includes('USO')) volatility = 0.035
  else if (symbol.includes('BTC') || symbol.includes('ETH')) volatility = 0.05
  
  let currentPrice = basePrice
  
  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - (days - 1 - i))
    date.setHours(16, 0, 0, 0)
    
    const dailyMove = (Math.random() - 0.5) * volatility + trendBias
    const openPrice = currentPrice * (1 + dailyMove * 0.3)
    
    const range = volatility * 0.6 * currentPrice
    const highMove = Math.random() * range * 0.7
    const lowMove = Math.random() * range * 0.7
    
    const high = Math.max(openPrice, currentPrice) + highMove
    const low = Math.min(openPrice, currentPrice) - lowMove
    const close = currentPrice * (1 + dailyMove)
    
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
 * Check if a symbol has real data support
 */
export function hasRealDataSupport(symbol: string): boolean {
  return !!(ENHANCED_YAHOO_MAPPINGS[symbol] || ALPHA_VANTAGE_SYMBOLS[symbol] || FINNHUB_SYMBOLS[symbol])
}

/**
 * Get provider information for a symbol
 */
export function getProviderInfo(symbol: string): string[] {
  const providers: string[] = []
  
  if (ENHANCED_YAHOO_MAPPINGS[symbol]) providers.push('Yahoo Finance (ETF)')
  if (ALPHA_VANTAGE_SYMBOLS[symbol]) providers.push('Alpha Vantage')
  if (FINNHUB_SYMBOLS[symbol]) providers.push('Finnhub')
  
  return providers.length > 0 ? providers : ['Synthetic data only']
}

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
  dataCache.clear()
  rateLimitCache.clear()
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
    providers: ['yahoo_finance', 'alpha_vantage', 'finnhub', 'synthetic']
  }
}
