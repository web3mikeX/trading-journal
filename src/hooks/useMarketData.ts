import { useState, useEffect, useCallback } from 'react'

export interface MarketDataPoint {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

export interface MarketDataResponse {
  symbol: string
  data: MarketDataPoint[]
  dataSource: 'yahoo_finance' | 'synthetic' | 'enhanced_synthetic' | 'cached'
  lastUpdated: number
  hasRealDataProxy: boolean
  symbolExplanation?: string
  dataStats: {
    dataPoints: number
    dateRange?: {
      start: string
      end: string
    }
    priceRange?: {
      high: number
      low: number
      latest: number
    }
  }
  metadata?: {
    originalSymbol: string
    proxySymbol?: string
    explanation?: string
  }
}

export interface UseMarketDataOptions {
  days?: number
  preferReal?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useMarketData(
  symbol: string,
  options: UseMarketDataOptions = {}
) {
  const {
    days = 30,
    preferReal = true,
    autoRefresh = false,
    refreshInterval = 5 * 60 * 1000 // 5 minutes
  } = options

  const [data, setData] = useState<MarketDataResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<number>(0)

  const fetchMarketData = useCallback(async (forceRefresh = false) => {
    if (!symbol) return

    // Avoid duplicate requests within a short time window
    const now = Date.now()
    if (!forceRefresh && now - lastFetch < 10000) { // 10 seconds
      console.log(`⚡ Skipping fetch for ${symbol} - too recent (${(now - lastFetch)/1000}s ago)`)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const url = `/api/market-data?symbol=${encodeURIComponent(symbol)}&days=${days}&preferReal=${preferReal}`
      
      console.log(`Fetching market data: ${url}`)
      
      const response = await fetch(url, {
        headers: {
          'Cache-Control': 'no-cache',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const marketData: MarketDataResponse = await response.json()
      
      setData(marketData)
      setLastFetch(now)
      
      console.log(`✅ Market data loaded for ${symbol}: ${marketData.dataStats.dataPoints} points (${marketData.dataSource})`)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch market data'
      setError(errorMessage)
      console.error('Market data fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [symbol, days, preferReal, lastFetch])

  // Initial fetch and symbol change handling
  useEffect(() => {
    fetchMarketData()
  }, [fetchMarketData])

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || !symbol) return

    const interval = setInterval(() => {
      fetchMarketData()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetchMarketData, symbol])

  const refresh = useCallback(() => {
    fetchMarketData(true)
  }, [fetchMarketData])

  const isStale = useCallback(() => {
    if (!data) return true
    const now = Date.now()
    const staleThreshold = data.dataSource === 'yahoo_finance' ? 5 * 60 * 1000 : 60 * 1000 // 5min for real, 1min for synthetic
    return now - data.lastUpdated > staleThreshold
  }, [data])

  return {
    data,
    loading,
    error,
    refresh,
    isStale: isStale(),
    lastFetch: new Date(lastFetch),
    // Helper properties
    hasData: !!data?.data?.length,
    dataPoints: data?.dataStats?.dataPoints || 0,
    dataSource: data?.dataSource || null,
    isRealData: data?.dataSource === 'yahoo_finance',
    isSyntheticData: data?.dataSource === 'enhanced_synthetic' || data?.dataSource === 'synthetic',
    hasRealDataProxy: data?.hasRealDataProxy || false,
    symbolExplanation: data?.symbolExplanation || null,
    priceRange: data?.dataStats?.priceRange || null,
    dateRange: data?.dataStats?.dateRange || null,
  }
}

// Hook for multiple symbols
export function useMultipleMarketData(
  symbols: string[],
  options: UseMarketDataOptions = {}
) {
  const [data, setData] = useState<Record<string, MarketDataResponse>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const fetchAllData = useCallback(async () => {
    const promises = symbols.map(async (symbol) => {
      try {
        setLoading(prev => ({ ...prev, [symbol]: true }))
        setErrors(prev => ({ ...prev, [symbol]: '' }))

        const url = `/api/market-data?symbol=${encodeURIComponent(symbol)}&days=${options.days || 30}&preferReal=${options.preferReal !== false}`
        const response = await fetch(url)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }

        const marketData: MarketDataResponse = await response.json()
        
        setData(prev => ({ ...prev, [symbol]: marketData }))
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data'
        setErrors(prev => ({ ...prev, [symbol]: errorMessage }))
      } finally {
        setLoading(prev => ({ ...prev, [symbol]: false }))
      }
    })

    await Promise.all(promises)
  }, [symbols, options.days, options.preferReal])

  useEffect(() => {
    if (symbols.length > 0) {
      fetchAllData()
    }
  }, [fetchAllData])

  const isLoading = Object.values(loading).some(Boolean)
  const hasErrors = Object.values(errors).some(Boolean)

  return {
    data,
    loading,
    errors,
    isLoading,
    hasErrors,
    refresh: fetchAllData,
    symbols,
  }
}