/**
 * TradesViz URL Generator
 * Generates proper TradesViz embed URLs for different asset classes
 */

interface Trade {
  id: string
  symbol: string
  side: 'LONG' | 'SHORT'
  entryDate: Date
  exitDate?: Date
  entryPrice: number
  exitPrice?: number
  quantity: number
  market?: string
  contractType?: string
  contractMultiplier?: number
}

type AssetClass = 'futures' | 'stocks' | 'forex' | 'crypto' | 'options' | 'cfds'

/**
 * Detect asset class from trade data
 */
export function detectAssetClass(trade: Trade): AssetClass {
  const symbol = trade.symbol.toUpperCase()
  const market = trade.market?.toUpperCase()

  // Primary detection via market field
  if (market) {
    switch (market) {
      case 'FUTURES':
      case 'FUTURE':
        return 'futures'
      case 'STOCK':
      case 'STOCKS':
      case 'EQUITY':
        return 'stocks'
      case 'FOREX':
      case 'FX':
        return 'forex'
      case 'CRYPTO':
      case 'CRYPTOCURRENCY':
        return 'crypto'
      case 'OPTIONS':
      case 'OPTION':
        return 'options'
      case 'CFD':
      case 'CFDS':
        return 'cfds'
    }
  }

  // Fallback: Symbol pattern matching
  
  // Futures patterns
  if (/^(NQ|MNQ|ES|MES|YM|MYM|RTY|M2K|CL|QM|GC|MGC|SI|SIL|ZC|ZS|ZW|HE|LE|GF)/.test(symbol)) {
    return 'futures'
  }
  
  // Forex patterns
  if (/^(EUR|GBP|USD|JPY|CHF|CAD|AUD|NZD).*(USD|EUR|GBP|JPY|CHF|CAD|AUD|NZD)$/.test(symbol) ||
      symbol.includes('/') && symbol.length === 6) {
    return 'forex'
  }
  
  // Crypto patterns
  if (/^(BTC|ETH|LTC|XRP|ADA|DOT|LINK|UNI|SUSHI|AAVE|COMP)/.test(symbol) ||
      symbol.includes('USD') && /^(BTC|ETH|LTC|XRP|ADA|DOT|LINK|UNI|SUSHI|AAVE|COMP)/.test(symbol.replace('USD', ''))) {
    return 'crypto'
  }
  
  // Options patterns (typically have expiration dates or strike prices)
  if (/\d{6}[CP]\d+/.test(symbol) || symbol.includes('CALL') || symbol.includes('PUT')) {
    return 'options'
  }
  
  // Default to stocks for regular symbols
  return 'stocks'
}

/**
 * Format symbol for TradesViz URL
 */
export function formatSymbolForTradesViz(symbol: string, assetClass: AssetClass): string {
  const cleanSymbol = symbol.toUpperCase().trim()
  
  switch (assetClass) {
    case 'futures':
      // Map common futures symbols to TradesViz format
      const futuresMap: Record<string, string> = {
        'NQ': 'NQ',
        'MNQ': 'MNQ', 
        'ES': 'ES',
        'MES': 'MES',
        'YM': 'YM',
        'MYM': 'MYM',
        'RTY': 'RTY',
        'M2K': 'M2K',
        'CL': 'CL',
        'QM': 'QM',
        'GC': 'GC',
        'MGC': 'MGC',
        'SI': 'SI',
        'SIL': 'SIL'
      }
      
      // Extract base symbol (remove contract month/year)
      const baseSymbol = cleanSymbol.replace(/[FGHJKMNQUVXZ]\d{2,4}$/, '').replace(/\d{4}$/, '')
      return futuresMap[baseSymbol] || baseSymbol
      
    case 'forex':
      // Convert various forex formats to standard format
      if (cleanSymbol.includes('/')) {
        return cleanSymbol.replace('/', '')
      }
      if (cleanSymbol.includes('=X')) {
        return cleanSymbol.replace('=X', '')
      }
      return cleanSymbol
      
    case 'crypto':
      // Remove common suffixes
      return cleanSymbol.replace(/(USD|USDT|BTC|ETH)$/, '')
      
    case 'stocks':
    case 'options':
    case 'cfds':
    default:
      return cleanSymbol
  }
}

/**
 * Generate TradesViz embed URL for a trade
 */
export function getTradesVizUrl(trade: Trade): string | null {
  try {
    const assetClass = detectAssetClass(trade)
    const formattedSymbol = formatSymbolForTradesViz(trade.symbol, assetClass)
    
    // Base TradesViz embed URL
    const baseUrl = 'https://tradesviz.com/embed'
    
    // Common parameters
    const params = new URLSearchParams({
      symbol: formattedSymbol,
      theme: 'dark',
      interval: '5m', // Default interval
      toolbar: 'false',
      withdateranges: 'false',
      save_image: 'false',
      container_id: `tradesviz_${trade.id}`
    })
    
    // Asset-specific parameters
    switch (assetClass) {
      case 'futures':
        params.set('exchange', 'CME')
        params.set('asset_type', 'futures')
        break
        
      case 'stocks':
        params.set('exchange', 'NASDAQ')
        params.set('asset_type', 'stocks')
        break
        
      case 'forex':
        params.set('exchange', 'FX')
        params.set('asset_type', 'forex')
        break
        
      case 'crypto':
        params.set('exchange', 'BINANCE')
        params.set('asset_type', 'crypto')
        break
        
      case 'options':
        params.set('exchange', 'CBOE')
        params.set('asset_type', 'options')
        break
        
      case 'cfds':
        params.set('asset_type', 'cfds')
        break
    }
    
    // Add entry/exit annotations if available
    if (trade.entryDate && trade.entryPrice) {
      const entryTimestamp = Math.floor(trade.entryDate.getTime() / 1000)
      params.set('entry_time', entryTimestamp.toString())
      params.set('entry_price', trade.entryPrice.toString())
      params.set('entry_side', trade.side.toLowerCase())
    }
    
    if (trade.exitDate && trade.exitPrice) {
      const exitTimestamp = Math.floor(trade.exitDate.getTime() / 1000)
      params.set('exit_time', exitTimestamp.toString())
      params.set('exit_price', trade.exitPrice.toString())
    }
    
    return `${baseUrl}?${params.toString()}`
    
  } catch (error) {
    console.error('Error generating TradesViz URL:', error)
    return null
  }
}

/**
 * Check if asset class is supported by TradesViz
 */
export function isAssetClassSupported(assetClass: AssetClass): boolean {
  const supportedClasses: AssetClass[] = ['futures', 'stocks', 'forex', 'crypto', 'options']
  return supportedClasses.includes(assetClass)
}

/**
 * Get user-friendly asset class name
 */
export function getAssetClassName(assetClass: AssetClass): string {
  const names: Record<AssetClass, string> = {
    futures: 'Futures',
    stocks: 'Stocks',
    forex: 'Forex',
    crypto: 'Cryptocurrency',
    options: 'Options',
    cfds: 'CFDs'
  }
  return names[assetClass]
}