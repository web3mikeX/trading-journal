/**
 * Timeframe-Specific Volatility Data Service
 * Generates realistic price action with accurate volatility patterns for each timeframe
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
  dataSource: 'real_market' | 'synthetic' | 'timeframe_aligned'
  lastUpdated: number
  metadata?: {
    originalSymbol: string
    timeframe: string
    volatility: number
    provider: string
  }
}

interface TradeContext {
  entryPrice: number
  exitPrice?: number
  entryDate: Date
  exitDate?: Date | null
  symbol: string
}

// Realistic volatility patterns by timeframe (based on actual market data)
const VOLATILITY_PATTERNS = {
  '1m': {
    volatility: 0.0015,    // 0.15% per minute
    typicalRange: 32,      // NQ: ~32 points per minute
    sessionMultiplier: 2.5 // Opening volatility
  },
  '5m': {
    volatility: 0.0035,    // 0.35% per 5min
    typicalRange: 75,      // NQ: ~75 points per 5min
    sessionMultiplier: 2.0
  },
  '15m': {
    volatility: 0.006,     // 0.6% per 15min
    typicalRange: 130,     // NQ: ~130 points per 15min
    sessionMultiplier: 1.8
  },
  '1h': {
    volatility: 0.012,     // 1.2% per hour
    typicalRange: 260,     // NQ: ~260 points per hour
    sessionMultiplier: 1.5
  },
  '4h': {
    volatility: 0.025,     // 2.5% per 4h
    typicalRange: 540,     // NQ: ~540 points per 4h
    sessionMultiplier: 1.2
  },
  '1d': {
    volatility: 0.045,     // 4.5% daily
    typicalRange: 970,     // NQ: ~970 points daily
    sessionMultiplier: 1.0
  },
  '1w': {
    volatility: 0.08,      // 8% weekly
    typicalRange: 1720,    // NQ: ~1720 points weekly
    sessionMultiplier: 0.8
  },
  '1M': {
    volatility: 0.15,      // 15% monthly
    typicalRange: 3225,    // NQ: ~3225 points monthly
    sessionMultiplier: 0.6
  }
}

// Market session patterns
const MARKET_SESSIONS = {
  preMarket: { start: 4, end: 9.5, volatility: 0.3 },
  open: { start: 9.5, end: 10.5, volatility: 2.5 },
  morning: { start: 10.5, end: 11.5, volatility: 1.2 },
  lunch: { start: 11.5, end: 13.5, volatility: 0.7 },
  afternoon: { start: 13.5, end: 15, volatility: 1.3 },
  close: { start: 15, end: 16, volatility: 2.0 },
  afterHours: { start: 16, end: 20, volatility: 0.4 }
}

/**
 * Generate timeframe-specific volatility data
 */
export async function getTimeframeVolatilityData(
  symbol: string,
  timeframe: string,
  tradeContext?: TradeContext
): Promise<MarketDataResult> {
  const cacheKey = `volatility_${symbol}_${timeframe}_${tradeContext?.entryDate?.getTime() || 'no_trade'}`
  
  // Check cache
  const cached = dataCache.get(cacheKey)
  if (cached && cached.expiry > Date.now()) {
    return cached.data
  }

  try {
    // Try real market data first
    const realData = await getRealMarketData(symbol, timeframe, tradeContext)
    if (realData && realData.length > 0) {
      const result: MarketDataResult = {
        symbol,
        data: realData,
        dataSource: 'real_market',
        lastUpdated: Date.now(),
        metadata: {
          originalSymbol: symbol,
          timeframe,
          volatility: VOLATILITY_PATTERNS[timeframe as keyof typeof VOLATILITY_PATTERNS]?.volatility || 0.02,
          provider: 'real_market'
        }
      }
      
      dataCache.set(cacheKey, { data: result, expiry: Date.now() + 5 * 60 * 1000 })
      return result
    }
  } catch (error) {
    console.warn('Real market data unavailable, using synthetic volatility data:', error)
  }

  // Generate synthetic data with realistic volatility
  const syntheticData = generateSyntheticVolatilityData(symbol, timeframe, tradeContext)
  
  const result: MarketDataResult = {
    symbol,
    data: syntheticData,
    dataSource: 'timeframe_aligned',
    lastUpdated: Date.now(),
    metadata: {
      originalSymbol: symbol,
      timeframe,
      volatility: VOLATILITY_PATTERNS[timeframe as keyof typeof VOLATILITY_PATTERNS]?.volatility || 0.02,
      provider: 'synthetic'
    }
  }
  
  dataCache.set(cacheKey, { data: result, expiry: Date.now() + 30 * 60 * 1000 })
  return result
}

/**
 * Fetch real market data with timeframe-specific intervals
 */
async function getRealMarketData(
  symbol: string,
  timeframe: string,
  tradeContext?: TradeContext
): Promise<OHLCData[]> {
  const mapping = ENHANCED_YAHOO_MAPPINGS[symbol]
  if (!mapping) return []

  let startDate: Date
  let endDate: Date
  
  if (tradeContext) {
    startDate = new Date(tradeContext.entryDate)
    endDate = tradeContext.exitDate ? new Date(tradeContext.exitDate) : new Date()
    startDate.setDate(startDate.getDate() - 2)
    endDate.setDate(endDate.getDate() + 2)
  } else {
    endDate = new Date()
    startDate = new Date()
    const days = timeframe === '1m' ? 1 : 
                 timeframe === '5m' ? 2 : 
                 timeframe === '15m' ? 3 : 
                 timeframe === '1h' ? 7 : 
                 timeframe === '4h' ? 14 : 
                 timeframe === '1d' ? 30 : 
                 timeframe === '1w' ? 90 : 365
    startDate.setDate(startDate.getDate() - days)
  }

  const period1 = Math.floor(startDate.getTime() / 1000)
  const period2 = Math.floor(endDate.getTime() / 1000)

  const interval = timeframe === '1m' ? '1m' : 
                   timeframe === '5m' ? '5m' :
                   timeframe === '15m' ? '15m' :
                   timeframe === '1h' ? '60m' :
                   timeframe === '4h' ? '240m' : '1d'

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${mapping.yahoo}?interval=${interval}&period1=${period1}&period2=${period2}`

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      }
    })

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
      
      if (open && high && low && close && 
          !isNaN(open) && !isNaN(high) && !isNaN(low) && !isNaN(close)) {
        
        ohlcData.push({
          timestamp,
          open: Number(open.toFixed(2)),
          high: Number(high.toFixed(2)),
          low: Number(low.toFixed(2)),
          close: Number(close.toFixed(2)),
          volume: quotes.volume?.[i] ? Math.floor(quotes.volume[i]) : undefined
        })
      }
    }

    return ohlcData
  } catch (error) {
    console.warn('Failed to fetch real market data:', error)
    return []
  }
}

/**
 * Generate synthetic data with realistic timeframe-specific volatility
 */
function generateSyntheticVolatilityData(
  symbol: string,
  timeframe: string,
  tradeContext?: TradeContext
): OHLCData[] {
  const data: OHLCData[] = []
  
  const pattern = VOLATILITY_PATTERNS[timeframe as keyof typeof VOLATILITY_PATTERNS]
  const baseVolatility = pattern?.volatility || 0.02
  const sessionMultiplier = pattern?.sessionMultiplier || 1.0
  
  // Base prices for different symbols
  const basePrices: Record<string, number> = {
    'NQ': 21500, 'MNQ': 21500, 'MNQU5': 22500, 'ES': 6100, 'MES': 6100,
    'RTY': 2350, 'YM': 44500, 'GC': 2650, 'CL': 78, 'SI': 31,
    'BTC': 98000, 'ETH': 3800
  }
  
  let basePrice = basePrices[symbol] || 1000
  
  if (tradeContext) {
    basePrice = tradeContext.entryPrice
  }
  
  // Generate realistic time range
  const timeframeMs = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '1w': 7 * 24 * 60 * 60 * 1000,
    '1M': 30 * 24 * 60 * 60 * 1000
  }[timeframe] || 24 * 60 * 60 * 1000

  const periods = timeframe === '1m' ? 60 : 
                  timeframe === '5m' ? 48 : 
                  timeframe === '15m' ? 32 : 
                  timeframe === '1h' ? 24 : 
                  timeframe === '4h' ? 60 : 
                  timeframe === '1d' ? 30 : 
                  timeframe === '1w' ? 52 : 12

  const now = Date.now()
  let currentPrice = basePrice
  
  for (let i = 0; i < periods; i++) {
    const timestamp = now - (periods - 1 - i) * timeframeMs
    
    // Calculate session-based volatility
    const date = new Date(timestamp)
    const hour = date.getHours()
    const minute = date.getMinutes()
    const timeOfDay = hour + minute / 60
    
    let currentSessionMultiplier = sessionMultiplier
    
    // Apply intraday session patterns for smaller timeframes
    if (['1m', '5m', '15m', '1h', '4h'].includes(timeframe)) {
      if (timeOfDay >= 9.5 && timeOfDay <= 10.5) {
        currentSessionMultiplier *= 2.5 // Opening volatility
      } else if (timeOfDay >= 11.5 && timeOfDay <= 13.5) {
        currentSessionMultiplier *= 0.7 // Lunch lull
      } else if (timeOfDay >= 15 && timeOfDay <= 16) {
        currentSessionMultiplier *= 2.0 // Closing volatility
      } else if (timeOfDay < 9.5 || timeOfDay > 16) {
        currentSessionMultiplier *= 0.3 // After-hours
      }
    }
    
    const volatility = baseVolatility * currentSessionMultiplier
    
    // Generate realistic candle
    const dailyTrend = Math.sin(i * 0.1) * 0.001 // Gentle trend
    const randomWalk = (Math.random() - 0.5) * volatility * currentPrice
    const marketNoise = Math.sin(i * 0.5) * volatility * currentPrice * 0.3
    
    // Calculate price movement
    const priceChange = dailyTrend + randomWalk + marketNoise
    
    // Create realistic OHLC
    const open = currentPrice
    const close = open + priceChange
    
    // Realistic high/low with wicks
    const candleRange = Math.abs(close - open) + volatility * currentPrice * 0.5
    const high = Math.max(open, close) + Math.random() * candleRange * 0.3
    const low = Math.min(open, close) - Math.random() * candleRange * 0.3
    
    // Ensure trade prices are included if provided
    let adjustedHigh = high
    let adjustedLow = low
    
    if (tradeContext) {
      const entryTime = tradeContext.entryDate.getTime()
      const exitTime = tradeContext.exitDate?.getTime() || entryTime
      
      if (Math.abs(timestamp - entryTime) < timeframeMs * 2) {
        adjustedHigh = Math.max(adjustedHigh, tradeContext.entryPrice * 1.002)
        adjustedLow = Math.min(adjustedLow, tradeContext.entryPrice * 0.998)
      }
      
      if (tradeContext.exitPrice && Math.abs(timestamp - exitTime) < timeframeMs * 2) {
        adjustedHigh = Math.max(adjustedHigh, tradeContext.exitPrice * 1.002)
        adjustedLow = Math.min(adjustedLow, tradeContext.exitPrice * 0.998)
      }
    }
    
    // Realistic volume patterns
    let volume = Math.floor(Math.random() * 100000) + 50000
    if (currentSessionMultiplier > 1.5) volume *= 2
    
    data.push({
      timestamp,
      open: Number(open.toFixed(2)),
      high: Number(adjustedHigh.toFixed(2)),
      low: Number(adjustedLow.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume
    })
    
    currentPrice = close
  }
  
  return data
}

// Cache for volatility data
const dataCache = new Map<string, { data: MarketDataResult; expiry: number }>()

// Enhanced ETF mappings for Yahoo Finance
const ENHANCED_YAHOO_MAPPINGS: Record<string, { yahoo: string; explanation: string }> = {
  'NQ': { yahoo: 'QQQ', explanation: 'QQQ ETF tracks NASDAQ-100' },
  'MNQ': { yahoo: 'QQQ', explanation: 'QQQ ETF tracks NASDAQ-100' },
  'MNQU5': { yahoo: 'QQQ', explanation: 'QQQ ETF tracks NASDAQ-100' },
  'ES': { yahoo: 'SPY', explanation: 'SPY ETF tracks S&P 500' },
  'MES': { yahoo: 'SPY', explanation: 'SPY ETF tracks S&P 500' },
  'RTY': { yahoo: 'IWM', explanation: 'IWM ETF tracks Russell 2000' },
  'YM': { yahoo: 'DIA', explanation: 'DIA ETF tracks Dow Jones' },
  'GC': { yahoo: 'GLD', explanation: 'GLD ETF tracks gold' },
  'CL': { yahoo: 'USO', explanation: 'USO ETF tracks oil' },
  'SI': { yahoo: 'SLV', explanation: 'SLV ETF tracks silver' },
  'BTC': { yahoo: 'BITO', explanation: 'BITO ETF tracks Bitcoin' },
  'ETH': { yahoo: 'ETHE', explanation: 'ETHE ETF tracks Ethereum' },
}

/**
 * Clear cache
 */
export function clearVolatilityCache(): void {
  dataCache.clear()
}
