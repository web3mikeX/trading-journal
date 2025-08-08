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
  'MNQU5': { yahoo: 'QQQ', explanation: 'QQQ ETF tracks NASDAQ-100, similar to MNQU5 micro futures' },
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
  'MNQ': 'QQQ',     // Micro NASDAQ futures
  'MNQU5': 'QQQ',   // NASDAQ micro futures September 2025
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
 * Enhanced Yahoo Finance fetching with intraday support
 */
async function fetchEnhancedYahooData(
  symbol: string, 
  days: number = 7, 
  interval: string = '1d'
): Promise<OHLCData[]> {
  const mapping = ENHANCED_YAHOO_MAPPINGS[symbol]
  if (!mapping) {
    throw new Error(`No Yahoo Finance mapping for ${symbol}`)
  }
  
  // Map timeframe to Yahoo Finance interval and range
  const intervalMap: Record<string, { interval: string; range: string }> = {
    '1m': { interval: '1m', range: '1d' },
    '5m': { interval: '5m', range: '5d' },
    '15m': { interval: '15m', range: '5d' },
    '1h': { interval: '1h', range: '10d' },
    '4h': { interval: '1h', range: '30d' }, // We'll aggregate 4h from 1h data
    '1d': { interval: '1d', range: `${Math.max(days, 30)}d` },
    '1w': { interval: '1wk', range: `${Math.max(days * 7, 180)}d` },
    '1M': { interval: '1mo', range: `${Math.max(days * 30, 365)}d` }
  }
  
  const yahooConfig = intervalMap[interval] || intervalMap['1d']
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${mapping.yahoo}?interval=${yahooConfig.interval}&range=${yahooConfig.range}`
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // Increased timeout
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    
    const data = await response.json()
    if (!data.chart?.result?.[0]) throw new Error('No chart data available')
    
    const result = data.chart.result[0]
    const timestamps = result.timestamp || []
    const quotes = result.indicators?.quote?.[0] || {}
    
    let ohlcData: OHLCData[] = []
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
        open: Number(open.toFixed(4)),
        high: Number(high.toFixed(4)),
        low: Number(low.toFixed(4)),
        close: Number(close.toFixed(4)),
        volume: volume ? Math.floor(volume) : undefined
      })
    }
    
    // Aggregate to 4h if requested
    if (interval === '4h') {
      ohlcData = aggregateToTimeframe(ohlcData, 4 * 60 * 60 * 1000) // 4 hours in ms
    }
    
    // Filter to requested number of data points
    const maxPoints = getMaxDataPoints(interval, days)
    if (ohlcData.length > maxPoints) {
      ohlcData = ohlcData.slice(-maxPoints)
    }
    
    return ohlcData
  } catch (error) {
    throw new Error(`Yahoo Finance fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get time interval in milliseconds for a given timeframe
 */
function getTimeIntervalMs(interval: string): number {
  const intervals: Record<string, number> = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '1w': 7 * 24 * 60 * 60 * 1000,
    '1M': 30 * 24 * 60 * 60 * 1000
  }
  return intervals[interval] || intervals['1d']
}

/**
 * Get enhanced market data with multi-provider fallback and timeframe support
 */
export async function getEnhancedMarketData(
  symbol: string,
  days: number = 7,
  preferRealData: boolean = true,
  tradeContext?: { 
    entryPrice?: number, 
    exitPrice?: number,
    entryDate?: Date,
    exitDate?: Date | null
  },
  interval: string = '1d'
): Promise<MarketDataResult> {
  const cacheKey = `enhanced_${symbol}_${days}_${interval}_${preferRealData}`
  
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
    const syntheticData = generateSyntheticData(symbol, days, interval, tradeContext)
    result = {
      symbol,
      data: syntheticData,
      dataSource: 'enhanced_synthetic',
      lastUpdated: Date.now(),
      metadata: {
        originalSymbol: symbol,
        provider: 'synthetic',
        explanation: `Enhanced synthetic data for ${symbol} (${interval})`
      }
    }
  } else {
    // OPTIMIZED: Try providers in parallel for faster response
    const promises = []
    
    // 1. Yahoo Finance (ETF proxies) - Primary
    const yahooMapping = ENHANCED_YAHOO_MAPPINGS[symbol]
    if (yahooMapping) {
      promises.push(
        fetchEnhancedYahooData(symbol, days, interval)
          .then(data => ({ 
            success: data.length > 0, 
            data, 
            source: 'yahoo_finance',
            metadata: {
              originalSymbol: symbol,
              provider: 'yahoo_finance',
              proxySymbol: yahooMapping.yahoo,
              explanation: `${yahooMapping.explanation} (${interval})`
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
  const syntheticData = generateSyntheticData(symbol, days, interval, tradeContext)
  result = {
    symbol,
    data: syntheticData,
    dataSource: 'enhanced_synthetic',
    lastUpdated: Date.now(),
    metadata: {
      originalSymbol: symbol,
      provider: 'synthetic',
      explanation: `Enhanced synthetic data for ${symbol} (${interval} timeframe)`
    }
  }
  
  dataCache.set(cacheKey, { data: result, expiry: Date.now() + CACHE_DURATION.synthetic })
  return result
}

/**
 * Get maximum data points for a given timeframe - ENHANCED for better visualization
 */
function getMaxDataPoints(interval: string, days: number): number {
  const pointsPerDay = {
    '1m': 390,  // 6.5 trading hours * 60 minutes
    '5m': 78,   // 6.5 trading hours / 5 minutes
    '15m': 26,  // 6.5 trading hours / 15 minutes
    '1h': 6.5,  // 6.5 trading hours
    '4h': 1.6,  // ~1.6 4-hour periods per day
    '1d': 1,    // 1 daily candle
    '1w': 0.2,  // ~1 weekly candle per 5 days
    '1M': 0.033 // ~1 monthly candle per 30 days
  }
  
  const points = pointsPerDay[interval as keyof typeof pointsPerDay] || 1
  const calculatedPoints = Math.ceil(days * points)
  
  // CRITICAL: Ensure minimum viable chart density
  const minimumPoints = {
    '1m': 60,   // At least 1 hour of 1-minute data
    '5m': 50,   // At least ~4 hours of 5-minute data
    '15m': 40,  // At least ~10 hours of 15-minute data  
    '1h': 30,   // At least 30 hours of data
    '4h': 25,   // At least ~4 days of 4-hour data
    '1d': 20,   // At least 20 days of daily data
    '1w': 15,   // At least 15 weeks
    '1M': 12    // At least 12 months
  }[interval] || 25
  
  return Math.max(calculatedPoints, minimumPoints)
}

/**
 * Aggregate OHLC data to a different timeframe
 */
function aggregateToTimeframe(data: OHLCData[], timeframeMs: number): OHLCData[] {
  if (data.length === 0) return []
  
  const aggregated: OHLCData[] = []
  let currentPeriodStart = Math.floor(data[0].timestamp / timeframeMs) * timeframeMs
  let periodData: OHLCData[] = []
  
  for (const candle of data) {
    const candlePeriodStart = Math.floor(candle.timestamp / timeframeMs) * timeframeMs
    
    if (candlePeriodStart !== currentPeriodStart) {
      // Close current period
      if (periodData.length > 0) {
        aggregated.push(aggregatePeriod(periodData, currentPeriodStart))
      }
      
      // Start new period
      currentPeriodStart = candlePeriodStart
      periodData = [candle]
    } else {
      periodData.push(candle)
    }
  }
  
  // Close final period
  if (periodData.length > 0) {
    aggregated.push(aggregatePeriod(periodData, currentPeriodStart))
  }
  
  return aggregated
}

/**
 * Aggregate a period of OHLC data into a single candle
 */
function aggregatePeriod(periodData: OHLCData[], timestamp: number): OHLCData {
  const open = periodData[0].open
  const close = periodData[periodData.length - 1].close
  const high = Math.max(...periodData.map(d => d.high))
  const low = Math.min(...periodData.map(d => d.low))
  const volume = periodData.reduce((sum, d) => sum + (d.volume || 0), 0)
  
  return {
    timestamp,
    open: Number(open.toFixed(4)),
    high: Number(high.toFixed(4)),
    low: Number(low.toFixed(4)),
    close: Number(close.toFixed(4)),
    volume: volume > 0 ? volume : undefined
  }
}

/**
 * Generate realistic synthetic data with proper volatility patterns
 */
function generateSyntheticData(
  symbol: string, 
  days: number = 7,
  interval: string = '1d',
  tradeContext?: { 
    entryPrice?: number, 
    exitPrice?: number,
    entryDate?: Date,
    exitDate?: Date | null
  }
): OHLCData[] {
  // Updated realistic base prices with enhanced volatility characteristics
  const basePrices: Record<string, number> = {
    'NQ': 21500, 'MNQ': 21500, 'MNQU5': 22500, 'ES': 6100, 'MES': 6100, 
    'RTY': 2350, 'M2K': 2350, 'YM': 44500, 'MYM': 44500,
    'GC': 2650, 'CL': 78, 'SI': 31, 'NG': 2.8,
    'BTC': 98000, 'ETH': 3800, 'SOL': 245,
    'QQQ': 525, 'SPY': 610, 'IWM': 235, 'DIA': 445,
    'GLD': 265, 'USO': 78, 'SLV': 31, 'UNG': 28,
    'VIX': 14, 'VXX': 18, 'TLT': 93, 'IEF': 95,
    'FXE': 103, 'FXB': 124, 'FXY': 66, 'FXA': 64,
    'JJC': 45, 'CORN': 25, 'SOYB': 45, 'WEAT': 22
  }
  
  // Enhanced volatility settings based on asset class and timeframe
  const volatilitySettings: Record<string, { daily: number; intraday: number; trend: number }> = {
    'NQ': { daily: 0.028, intraday: 0.045, trend: 0.15 },
    'MNQ': { daily: 0.028, intraday: 0.045, trend: 0.15 },
    'MNQU5': { daily: 0.028, intraday: 0.045, trend: 0.15 },
    'ES': { daily: 0.018, intraday: 0.032, trend: 0.12 },
    'MES': { daily: 0.018, intraday: 0.032, trend: 0.12 },
    'RTY': { daily: 0.032, intraday: 0.055, trend: 0.18 },
    'M2K': { daily: 0.032, intraday: 0.055, trend: 0.18 },
    'YM': { daily: 0.016, intraday: 0.028, trend: 0.10 },
    'MYM': { daily: 0.016, intraday: 0.028, trend: 0.10 },
    'GC': { daily: 0.022, intraday: 0.038, trend: 0.08 },
    'CL': { daily: 0.045, intraday: 0.075, trend: 0.25 },
    'SI': { daily: 0.035, intraday: 0.058, trend: 0.20 },
    'BTC': { daily: 0.055, intraday: 0.085, trend: 0.30 },
    'ETH': { daily: 0.065, intraday: 0.095, trend: 0.35 },
    'QQQ': { daily: 0.022, intraday: 0.035, trend: 0.12 },
    'SPY': { daily: 0.016, intraday: 0.028, trend: 0.10 },
    'IWM': { daily: 0.028, intraday: 0.048, trend: 0.15 },
    'VIX': { daily: 0.15, intraday: 0.25, trend: 0.40 },
    'VXX': { daily: 0.12, intraday: 0.20, trend: 0.35 }
  }
  
  // Use trade context to determine realistic price range and time period
  let basePrice = basePrices[symbol] || basePrices[symbol.replace(/[HMU Z]\d{2}$/, '')] || 1000
  
  // Get volatility settings for the symbol
  const baseSymbol = symbol.replace(/[HMU Z]\d{2}$/, '')
  const volSettings = volatilitySettings[baseSymbol] || volatilitySettings[symbol] || 
    { daily: 0.025, intraday: 0.040, trend: 0.15 }
  
  // TRADINGVIEW-STYLE: Center data around actual trade prices with realistic range
  if (tradeContext && (tradeContext.entryPrice || tradeContext.exitPrice)) {
    const entryPrice = tradeContext.entryPrice || tradeContext.exitPrice || basePrice
    const exitPrice = tradeContext.exitPrice || tradeContext.entryPrice || basePrice
    
    // For TradingView-style charts, use exact trade price as base with minimal variance
    basePrice = entryPrice // Start exactly at entry price
    
    console.log(`📊 TradingView-style data generation: Starting at entry price ${entryPrice}`)
  }
  
  // TRADINGVIEW-STYLE: Generate dense, realistic data points
  const tradingViewDensity = {
    '1m': tradeContext ? 240 : 120,  // 4 hours of 1-minute data (or 2 hours)
    '5m': tradeContext ? 144 : 72,   // 12 hours of 5-minute data (or 6 hours)
    '15m': tradeContext ? 96 : 48,   // 24 hours of 15-minute data (or 12 hours)
    '1h': tradeContext ? 72 : 36,    // 3 days of hourly data (or 1.5 days)
    '4h': tradeContext ? 48 : 24,    // 8 days of 4-hour data (or 4 days)
    '1d': tradeContext ? 30 : 20,    // 30 days of daily data (or 20 days)
    '1w': tradeContext ? 20 : 12,    // 20 weeks (or 12 weeks)
    '1M': tradeContext ? 12 : 8      // 12 months (or 8 months)
  }[interval] || 60
  
  const actualPoints = tradingViewDensity
  
  console.log(`📊 TradingView-style generation: ${actualPoints} ${interval} candles`)
  
  // TRADINGVIEW-STYLE: Realistic intraday volatility patterns
  const isIntraday = ['1m', '5m', '15m', '1h', '4h'].includes(interval)
  
  // Much smaller volatility for realistic candle-to-candle movement
  const tradingViewVolatility = {
    '1m': 0.0008,  // ~0.08% per minute (very small moves)
    '5m': 0.002,   // ~0.2% per 5 minutes
    '15m': 0.004,  // ~0.4% per 15 minutes
    '1h': 0.008,   // ~0.8% per hour
    '4h': 0.015,   // ~1.5% per 4 hours
    '1d': 0.025,   // ~2.5% per day
    '1w': 0.05,    // ~5% per week
    '1M': 0.08     // ~8% per month
  }[interval] || 0.01
  
  // Asset-specific multipliers for realistic movement
  const assetMultiplier = {
    'NQ': 1.2, 'MNQ': 1.2, 'MNQU5': 1.2,  // NASDAQ futures - more volatile
    'ES': 0.8, 'MES': 0.8,                 // S&P 500 - less volatile
    'RTY': 1.4, 'M2K': 1.4,                // Russell - most volatile
    'YM': 0.7, 'MYM': 0.7,                 // Dow - least volatile
    'GC': 1.0, 'CL': 1.8, 'SI': 1.3,      // Commodities
    'BTC': 2.5, 'ETH': 3.0                 // Crypto - very volatile
  }[baseSymbol] || 1.0
  
  const volatility = tradingViewVolatility * assetMultiplier
  
  const data: OHLCData[] = []
  let currentPrice = basePrice
  let trendDirection = (Math.random() - 0.5) * volSettings.trend // Random trend bias
  
  // Generate realistic market data with proper time intervals
  const now = Date.now()
  const timeIntervalMs = getTimeIntervalMs(interval)
  
  // TRADINGVIEW-STYLE: Precise timing around trade period
  let dataStartTime: number
  
  if (tradeContext?.entryDate) {
    const tradeTime = tradeContext.entryDate.getTime()
    // Start data well before trade to show context
    const preTradeCandles = Math.floor(actualPoints * 0.3) // 30% of candles before trade
    dataStartTime = tradeTime - (preTradeCandles * timeIntervalMs)
    
    console.log(`📈 TradingView timing: ${preTradeCandles} candles before trade at ${new Date(tradeTime).toISOString()}`)
  } else {
    // Standard timing if no trade context
    dataStartTime = now - (actualPoints * timeIntervalMs)
  }
  
  // Add market session awareness for intraday data
  const isMarketHours = (timestamp: number) => {
    if (!isIntraday) return true
    const date = new Date(timestamp)
    const hours = date.getUTCHours() - 5 // EST
    const day = date.getUTCDay()
    return day >= 1 && day <= 5 && hours >= 9 && hours < 16 // 9:30 AM - 4:00 PM EST
  }
  
  let generatedPoints = 0
  let i = 0
  
  while (generatedPoints < actualPoints && i < actualPoints * 3) { // Safety limit to prevent infinite loop
    let timestamp = dataStartTime + (i * timeIntervalMs)
    i++
    
    // Skip non-market hours for intraday data
    if (isIntraday && !isMarketHours(timestamp)) {
      continue
    }
    
    generatedPoints++
    
    // TRADINGVIEW-STYLE: Realistic tick-by-tick price movement
    let openPrice = currentPrice
    
    // For first candle, use current price as open
    if (generatedPoints > 1) {
      // Small gap from previous close (realistic market behavior)
      const gapSize = (Math.random() - 0.5) * volatility * 0.1
      openPrice = currentPrice * (1 + gapSize)
    }
    
    // Generate realistic close price with small movement
    const priceDirection = (Math.random() - 0.5) + trendDirection * 0.3
    const moveSize = Math.random() * volatility * (0.5 + Math.random() * 1.0)
    const close = openPrice * (1 + (priceDirection * moveSize))
    
    // Create realistic high/low within the candle
    const ohlcRange = Math.abs(close - openPrice)
    const wickMultiplier = 0.3 + Math.random() * 0.7 // Variable wick sizes
    
    // High: extends above the higher of open/close
    const highBase = Math.max(openPrice, close)
    const highWick = ohlcRange * wickMultiplier + (Math.random() * volatility * currentPrice * 0.2)
    const high = highBase + highWick
    
    // Low: extends below the lower of open/close  
    const lowBase = Math.min(openPrice, close)
    const lowWick = ohlcRange * wickMultiplier + (Math.random() * volatility * currentPrice * 0.2)
    const low = lowBase - lowWick
    
    // Ensure OHLC relationships are maintained
    const tempHigh = Math.max(openPrice, high, close)
    const tempLow = Math.min(openPrice, low, close)
    
    // TRADINGVIEW-STYLE: Ensure trade prices are reachable but don't distort natural movement
    let adjustedHigh = high
    let adjustedLow = low
    let adjustedClose = close
    
    // Only adjust if we're near the trade time
    if (tradeContext?.entryDate) {
      const candleTime = timestamp
      const tradeTime = tradeContext.entryDate.getTime()
      const timeDiff = Math.abs(candleTime - tradeTime)
      const isNearTrade = timeDiff < timeIntervalMs * 3 // Within 3 candles of trade
      
      if (isNearTrade && tradeContext.entryPrice) {
        // Gently adjust range to include entry price
        adjustedHigh = Math.max(adjustedHigh, tradeContext.entryPrice + (volatility * currentPrice * 0.1))
        adjustedLow = Math.min(adjustedLow, tradeContext.entryPrice - (volatility * currentPrice * 0.1))
        
        // If very close to trade time, make close price move toward entry
        if (timeDiff < timeIntervalMs) {
          const entryInfluence = 0.7 // 70% influence of entry price
          adjustedClose = close * (1 - entryInfluence) + tradeContext.entryPrice * entryInfluence
        }
      }
      
      // Similar logic for exit price
      if (isNearTrade && tradeContext.exitPrice && tradeContext.exitDate) {
        const exitTime = tradeContext.exitDate.getTime()
        const exitDiff = Math.abs(candleTime - exitTime)
        const isNearExit = exitDiff < timeIntervalMs * 3
        
        if (isNearExit) {
          adjustedHigh = Math.max(adjustedHigh, tradeContext.exitPrice + (volatility * currentPrice * 0.1))
          adjustedLow = Math.min(adjustedLow, tradeContext.exitPrice - (volatility * currentPrice * 0.1))
          
          if (exitDiff < timeIntervalMs) {
            const exitInfluence = 0.7
            adjustedClose = adjustedClose * (1 - exitInfluence) + tradeContext.exitPrice * exitInfluence
          }
        }
      }
    }
    
    // Generate realistic volume with correlation to price movement
    const priceChange = Math.abs(adjustedClose - openPrice) / openPrice
    
    // Asset-specific volume patterns
    const baseVolumeByAsset = {
      'NQ': { base: 100000, multiplier: 2.0 },
      'MNQ': { base: 150000, multiplier: 1.8 },
      'MNQU5': { base: 120000, multiplier: 1.9 },
      'ES': { base: 80000, multiplier: 1.5 },
      'RTY': { base: 60000, multiplier: 2.2 },
      'BTC': { base: 200000, multiplier: 3.0 },
      'ETH': { base: 180000, multiplier: 2.8 }
    }
    
    const volConfig = baseVolumeByAsset[baseSymbol] || { base: 75000, multiplier: 1.8 }
    const baseVolume = isIntraday ? 
      volConfig.base + Math.random() * volConfig.base :
      volConfig.base * 5 + Math.random() * volConfig.base * 10
    
    const volumeMultiplier = 1 + (priceChange * volConfig.multiplier) // Asset-specific volume response
    const volume = Math.floor(baseVolume * volumeMultiplier)
    
    // TRADINGVIEW-STYLE: Proper OHLC relationships and precision
    const finalOpen = Number(openPrice.toFixed(2))
    const finalHigh = Number(adjustedHigh.toFixed(2))
    const finalLow = Number(adjustedLow.toFixed(2))
    const finalClose = Number(adjustedClose.toFixed(2))
    
    // Ensure proper OHLC relationships
    const validHigh = Math.max(finalOpen, finalHigh, finalClose)
    const validLow = Math.min(finalOpen, finalLow, finalClose)
    
    data.push({
      timestamp,
      open: finalOpen,
      high: validHigh,
      low: validLow,
      close: finalClose,
      volume
    })
    
    currentPrice = finalClose
    
    // TRADINGVIEW-STYLE: Subtle trend evolution
    trendDirection = trendDirection * 0.98 + (Math.random() - 0.5) * 0.02
    
    // Rare volatility events (more realistic frequency)
    if (Math.random() < 0.01) { // 1% chance instead of 5%
      const spike = (Math.random() - 0.5) * volatility * 1.5
      currentPrice *= (1 + spike)
    }
  }
  
  // Sort by timestamp to ensure proper chronological order
  const sortedData = data.sort((a, b) => a.timestamp - b.timestamp)
  
  console.log(`📊 Generated ${sortedData.length} TradingView-style candles from ${new Date(sortedData[0]?.timestamp).toISOString()} to ${new Date(sortedData[sortedData.length - 1]?.timestamp).toISOString()}`)
  
  return sortedData
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
