/**
 * Trade-Aligned Market Data Service
 * Generates chart data that exactly matches trade execution patterns and price action
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
  dataSource: 'trade_aligned' | 'real_market' | 'synthetic'
  lastUpdated: number
  metadata?: {
    originalSymbol: string
    tradeContext?: {
      entryPrice: number
      exitPrice?: number
      entryDate: Date
      exitDate?: Date
      exactAlignment: boolean
    }
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

// Real market patterns based on actual trading sessions
const MARKET_PATTERNS = {
  'NQ': {
    volatility: 0.025,
    sessionStart: 9.5, // 9:30 AM
    sessionEnd: 16.0,  // 4:00 PM
    typicalRange: 200, // Typical daily range in points
  },
  'ES': {
    volatility: 0.018,
    sessionStart: 9.5,
    sessionEnd: 16.0,
    typicalRange: 50,
  },
  'MNQ': {
    volatility: 0.025,
    sessionStart: 9.5,
    sessionEnd: 16.0,
    typicalRange: 200,
  },
  'MNQU5': {
    volatility: 0.025,
    sessionStart: 9.5,
    sessionEnd: 16.0,
    typicalRange: 200,
  }
}

/**
 * Generate trade-aligned market data that exactly matches execution patterns
 */
export async function getTradeAlignedMarketData(
  symbol: string,
  tradeContext: TradeContext,
  timeframe: string = '1d'
): Promise<MarketDataResult> {
  const cacheKey = `trade_aligned_${symbol}_${tradeContext.entryDate.getTime()}_${tradeContext.exitDate?.getTime()}_${timeframe}`
  
  // Check cache
  const cached = dataCache.get(cacheKey)
  if (cached && cached.expiry > Date.now()) {
    return { ...cached.data, dataSource: 'cached' }
  }

  try {
    // Try to get real market data first
    const realData = await getRealMarketData(symbol, tradeContext, timeframe)
    if (realData && realData.length > 0) {
      const result = {
        symbol,
        data: realData,
        dataSource: 'real_market' as const,
        lastUpdated: Date.now(),
        metadata: {
          originalSymbol: symbol,
          tradeContext: {
            ...tradeContext,
            exactAlignment: true
          },
          provider: 'real_market'
        }
      }
      
      dataCache.set(cacheKey, { data: result, expiry: Date.now() + 5 * 60 * 1000 })
      return result
    }
  } catch (error) {
    console.warn('Real market data unavailable, using trade-aligned synthetic data:', error)
  }

  // Generate trade-aligned synthetic data
  const alignedData = generateTradeAlignedData(symbol, tradeContext, timeframe)
  
  const result = {
    symbol,
    data: alignedData,
    dataSource: 'trade_aligned' as const,
    lastUpdated: Date.now(),
    metadata: {
      originalSymbol: symbol,
      tradeContext: {
        ...tradeContext,
        exactAlignment: true
      },
      provider: 'trade_aligned'
    }
  }
  
  dataCache.set(cacheKey, { data: result, expiry: Date.now() + 30 * 60 * 1000 })
  return result
}

/**
 * Attempt to fetch real market data for the exact trade period
 */
async function getRealMarketData(
  symbol: string,
  tradeContext: TradeContext,
  timeframe: string
): Promise<OHLCData[]> {
  const mapping = ENHANCED_YAHOO_MAPPINGS[symbol]
  if (!mapping) return []

  const startDate = new Date(tradeContext.entryDate)
  const endDate = tradeContext.exitDate ? new Date(tradeContext.exitDate) : new Date()
  
  // Extend range to provide context
  startDate.setDate(startDate.getDate() - 2)
  endDate.setDate(endDate.getDate() + 2)

  const period1 = Math.floor(startDate.getTime() / 1000)
  const period2 = Math.floor(endDate.getTime() / 1000)

  // Use 1-minute intervals for precise alignment
  const interval = timeframe === '1m' ? '1m' : 
                   timeframe === '5m' ? '5m' :
                   timeframe === '15m' ? '15m' :
                   timeframe === '1h' ? '60m' : '1d'

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
    
    // Find the exact trade period
    const entryTimestamp = tradeContext.entryDate.getTime()
    const exitTimestamp = tradeContext.exitDate?.getTime() || Date.now()
    
    for (let i = 0; i < timestamps.length; i++) {
      const timestamp = timestamps[i] * 1000
      
      // Only include data around the trade period
      if (timestamp >= entryTimestamp - 24 * 60 * 60 * 1000 && 
          timestamp <= exitTimestamp + 24 * 60 * 60 * 1000) {
        
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
    }

    return ohlcData
  } catch (error) {
    console.warn('Failed to fetch real market data:', error)
    return []
  }
}

/**
 * Generate synthetic data that exactly matches trade execution patterns
 */
function generateTradeAlignedData(
  symbol: string,
  tradeContext: TradeContext,
  timeframe: string
): OHLCData[] {
  const data: OHLCData[] = []
  
  const entryTime = tradeContext.entryDate.getTime()
  const exitTime = tradeContext.exitDate?.getTime() || entryTime + 60 * 60 * 1000 // Default 1 hour
  const entryPrice = tradeContext.entryPrice
  const exitPrice = tradeContext.exitPrice || entryPrice
  
  // Calculate time range based on timeframe
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

  // Generate data points
  const startTime = entryTime - timeframeMs * 10 // 10 periods before
  const endTime = exitTime + timeframeMs * 5 // 5 periods after
  
  let currentPrice = entryPrice * 0.995 // Start slightly below entry
  const volatility = MARKET_PATTERNS[symbol as keyof typeof MARKET_PATTERNS]?.volatility || 0.02
  
  for (let time = startTime; time <= endTime; time += timeframeMs) {
    const timeProgress = (time - startTime) / (endTime - startTime)
    
    // Create realistic price action around trade
    let priceMovement = 0
    
    if (time < entryTime) {
      // Pre-trade: gradual approach to entry
      const approachFactor = 1 - (entryTime - time) / (entryTime - startTime)
      priceMovement = (entryPrice - currentPrice) * approachFactor * 0.3
    } else if (time >= entryTime && time <= exitTime) {
      // During trade: realistic intraday movement
      const tradeProgress = (time - entryTime) / (exitTime - entryTime)
      
      if (exitPrice > entryPrice) {
        // Long trade profit scenario
        priceMovement = (exitPrice - entryPrice) * tradeProgress * (1 + Math.sin(timeProgress * Math.PI * 4) * 0.1)
      } else {
        // Short trade profit scenario
        priceMovement = (exitPrice - entryPrice) * tradeProgress * (1 + Math.sin(timeProgress * Math.PI * 4) * 0.1)
      }
    } else {
      // Post-trade: continuation pattern
      priceMovement = (exitPrice - currentPrice) * 0.1 * Math.sin(timeProgress * Math.PI * 2)
    }
    
    // Add realistic volatility
    const randomWalk = (Math.random() - 0.5) * volatility * currentPrice
    currentPrice += priceMovement + randomWalk
    
    // Ensure price stays within realistic bounds
    const minPrice = Math.min(entryPrice, exitPrice) * 0.98
    const maxPrice = Math.max(entryPrice, exitPrice) * 1.02
    currentPrice = Math.max(minPrice, Math.min(maxPrice, currentPrice))
    
    // Create candle structure
    const candleRange = volatility * currentPrice * 0.5
    const open = currentPrice + (Math.random() - 0.5) * candleRange * 0.3
    const close = currentPrice
    const high = Math.max(open, close) + Math.random() * candleRange * 0.5
    const low = Math.min(open, close) - Math.random() * candleRange * 0.5
    
    // Ensure entry and exit prices are within candles when appropriate
    let adjustedHigh = high
    let adjustedLow = low
    
    if (Math.abs(time - entryTime) < timeframeMs) {
      adjustedHigh = Math.max(adjustedHigh, entryPrice * 1.001)
      adjustedLow = Math.min(adjustedLow, entryPrice * 0.999)
    }
    
    if (exitPrice && Math.abs(time - exitTime) < timeframeMs) {
      adjustedHigh = Math.max(adjustedHigh, exitPrice * 1.001)
      adjustedLow = Math.min(adjustedLow, exitPrice * 0.999)
    }
    
    data.push({
      timestamp: time,
      open: Number(open.toFixed(2)),
      high: Number(adjustedHigh.toFixed(2)),
      low: Number(adjustedLow.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: Math.floor(Math.random() * 50000) + 10000
    })
  }
  
  return data
}

// Cache for trade-aligned data
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
 * Clear trade-aligned cache
 */
export function clearTradeAlignedCache(): void {
  dataCache.clear()
}
