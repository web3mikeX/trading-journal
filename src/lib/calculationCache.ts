import { AccountMetrics } from './trailingDrawdown'

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

/**
 * Simple in-memory cache for calculation results
 * In production, this could be replaced with Redis or similar
 */
class CalculationCache {
  private cache = new Map<string, CacheEntry<any>>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes

  /**
   * Get cached value if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Set cached value with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now()
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + (ttl || this.defaultTTL)
    }
    this.cache.set(key, entry)
  }

  /**
   * Delete cached value
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cached values
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Clear expired entries
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; hitRate: number; keys: string[] } {
    return {
      size: this.cache.size,
      hitRate: 0, // Would need to track hits/misses for this
      keys: Array.from(this.cache.keys())
    }
  }
}

// Singleton instance
export const calculationCache = new CalculationCache()

// Cache key generators
export const CacheKeys = {
  accountMetrics: (userId: string) => `account_metrics:${userId}`,
  userTrades: (userId: string) => `user_trades:${userId}`,
  tradeCalculation: (tradeId: string) => `trade_calc:${tradeId}`,
  monthlyStats: (userId: string, year: number, month: number) => `monthly_stats:${userId}:${year}:${month}`,
  contractMultiplier: (symbol: string) => `contract_mult:${symbol}`,
  brokerFees: (symbol: string, broker: string) => `broker_fees:${symbol}:${broker}`
}

/**
 * Cache invalidation helpers
 */
export const CacheInvalidation = {
  /**
   * Invalidate all cache entries for a user when their data changes
   */
  invalidateUserData: (userId: string) => {
    const keysToDelete = [
      CacheKeys.accountMetrics(userId),
      CacheKeys.userTrades(userId)
    ]
    
    // Also invalidate monthly stats for current year
    const currentYear = new Date().getFullYear()
    for (let month = 1; month <= 12; month++) {
      keysToDelete.push(CacheKeys.monthlyStats(userId, currentYear, month))
    }

    keysToDelete.forEach(key => calculationCache.delete(key))
  },

  /**
   * Invalidate cache entries when a trade is added/modified/deleted
   */
  invalidateTradeData: (userId: string, tradeId?: string) => {
    if (tradeId) {
      calculationCache.delete(CacheKeys.tradeCalculation(tradeId))
    }
    
    // Invalidate user-level caches
    CacheInvalidation.invalidateUserData(userId)
  }
}

/**
 * Cached wrapper for expensive calculations
 */
export class CachedCalculations {
  /**
   * Get account metrics with caching
   */
  static async getAccountMetricsWithCache(
    userId: string, 
    forceRefresh = false
  ): Promise<AccountMetrics | null> {
    const cacheKey = CacheKeys.accountMetrics(userId)
    
    if (!forceRefresh) {
      const cached = calculationCache.get<AccountMetrics>(cacheKey)
      if (cached) {
        return cached
      }
    }

    // Import here to avoid circular dependency
    const { getAccountMetrics } = await import('./trailingDrawdown')
    const metrics = await getAccountMetrics(userId)
    
    if (metrics) {
      // Cache for 2 minutes since account metrics change frequently during trading
      calculationCache.set(cacheKey, metrics, 2 * 60 * 1000)
    }

    return metrics
  }

  /**
   * Get contract multiplier with caching (these rarely change)
   */
  static getContractMultiplierWithCache(symbol: string, market: string): number {
    const cacheKey = CacheKeys.contractMultiplier(symbol)
    
    const cached = calculationCache.get<number>(cacheKey)
    if (cached !== null) {
      return cached
    }

    // Import here to avoid circular dependency
    const { getContractMultiplier } = require('./contractSpecs')
    const multiplier = getContractMultiplier(symbol, market)
    
    // Cache for 1 hour since contract specs rarely change
    calculationCache.set(cacheKey, multiplier, 60 * 60 * 1000)
    
    return multiplier
  }

  /**
   * Get broker fees with caching
   */
  static getBrokerFeesWithCache(symbol: string, broker: string): any {
    const cacheKey = CacheKeys.brokerFees(symbol, broker)
    
    const cached = calculationCache.get<any>(cacheKey)
    if (cached !== null) {
      return cached
    }

    // Import here to avoid circular dependency
    const { getBrokerFees } = require('./contractSpecs')
    const fees = getBrokerFees(symbol, broker)
    
    // Cache for 30 minutes since fees rarely change
    calculationCache.set(cacheKey, fees, 30 * 60 * 1000)
    
    return fees
  }
}

// Cleanup expired entries every 10 minutes
setInterval(() => {
  calculationCache.cleanup()
}, 10 * 60 * 1000)