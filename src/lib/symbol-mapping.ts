/**
 * Symbol mapping utilities for TradingView integration
 * Converts trading journal symbols to TradingView-compatible format
 */

interface SymbolMapping {
  [key: string]: string
}

// Common futures contract mappings
const futuresMapping: SymbolMapping = {
  // E-mini S&P 500
  'ES': 'CME_MINI:ES1!',
  'ESH25': 'CME_MINI:ESH2025',
  'ESM25': 'CME_MINI:ESM2025',
  'ESU25': 'CME_MINI:ESU2025',
  'ESZ25': 'CME_MINI:ESZ2025',
  
  // E-mini NASDAQ - try multiple formats and fallbacks
  'NQ': 'NASDAQ:QQQ', // Fallback to QQQ ETF which tracks NASDAQ-100
  'NQ1!': 'NASDAQ:QQQ',
  'NQH25': 'NASDAQ:QQQ',
  'NQM25': 'NASDAQ:QQQ', 
  'NQU25': 'NASDAQ:QQQ',
  'NQZ25': 'NASDAQ:QQQ',
  
  // E-mini Dow Jones
  'YM': 'CBOT_MINI:YM1!',
  'YMH25': 'CBOT_MINI:YMH2025',
  'YMM25': 'CBOT_MINI:YMM2025',
  'YMU25': 'CBOT_MINI:YMU2025',
  'YMZ25': 'CBOT_MINI:YMZ2025',
  
  // E-mini Russell 2000
  'RTY': 'CME_MINI:RTY1!',
  'RTYH25': 'CME_MINI:RTYH2025',
  'RTYM25': 'CME_MINI:RTYM2025',
  'RTYU25': 'CME_MINI:RTYU2025',
  'RTYZ25': 'CME_MINI:RTYZ2025',
  
  // Micro futures - fallback to corresponding ETFs
  'MES': 'AMEX:SPY', // S&P 500 ETF
  'MNQ': 'NASDAQ:QQQ', // NASDAQ-100 ETF  
  'MYM': 'AMEX:DIA', // Dow Jones ETF
  'M2K': 'AMEX:IWM', // Russell 2000 ETF
  
  // Gold futures
  'GC': 'COMEX:GC1!',
  'GCG25': 'COMEX:GCG2025',
  'GCJ25': 'COMEX:GCJ2025',
  'GCM25': 'COMEX:GCM2025',
  'GCQ25': 'COMEX:GCQ2025',
  'GCZ25': 'COMEX:GCZ2025',
  
  // Silver futures
  'SI': 'COMEX:SI1!',
  'SIH25': 'COMEX:SIH2025',
  'SIK25': 'COMEX:SIK2025',
  'SIN25': 'COMEX:SIN2025',
  'SIU25': 'COMEX:SIU2025',
  'SIZ25': 'COMEX:SIZ2025',
  
  // Crude Oil
  'CL': 'NYMEX:CL1!',
  'CLF25': 'NYMEX:CLF2025',
  'CLG25': 'NYMEX:CLG2025',
  'CLH25': 'NYMEX:CLH2025',
  'CLJ25': 'NYMEX:CLJ2025',
  'CLK25': 'NYMEX:CLK2025',
  
  // Natural Gas
  'NG': 'NYMEX:NG1!',
  'NGF25': 'NYMEX:NGF2025',
  'NGG25': 'NYMEX:NGG2025',
  'NGH25': 'NYMEX:NGH2025',
  'NGJ25': 'NYMEX:NGJ2025',
  'NGK25': 'NYMEX:NGK2025',
  
  // Forex futures
  'EUR': 'CME:6E1!',
  'GBP': 'CME:6B1!',
  'JPY': 'CME:6J1!',
  'CAD': 'CME:6C1!',
  'AUD': 'CME:6A1!',
  'CHF': 'CME:6S1!',
  
  // Treasury futures
  'ZB': 'CBOT:ZB1!',
  'ZN': 'CBOT:ZN1!',
  'ZF': 'CBOT:ZF1!',
  'ZT': 'CBOT:ZT1!',
  
  // Corn
  'ZC': 'CBOT:ZC1!',
  'ZCH25': 'CBOT:ZCH2025',
  'ZCK25': 'CBOT:ZCK2025',
  'ZCN25': 'CBOT:ZCN2025',
  'ZCU25': 'CBOT:ZCU2025',
  'ZCZ25': 'CBOT:ZCZ2025',
  
  // Soybeans
  'ZS': 'CBOT:ZS1!',
  'ZSF25': 'CBOT:ZSF2025',
  'ZSH25': 'CBOT:ZSH2025',
  'ZSK25': 'CBOT:ZSK2025',
  'ZSN25': 'CBOT:ZSN2025',
  'ZSU25': 'CBOT:ZSU2025',
  'ZSX25': 'CBOT:ZSX2025',
  
  // Wheat
  'ZW': 'CBOT:ZW1!',
  'ZWH25': 'CBOT:ZWH2025',
  'ZWK25': 'CBOT:ZWK2025',
  'ZWN25': 'CBOT:ZWN2025',
  'ZWU25': 'CBOT:ZWU2025',
  'ZWZ25': 'CBOT:ZWZ2025'
}

// Common forex pairs
const forexMapping: SymbolMapping = {
  'EURUSD': 'FX:EURUSD',
  'GBPUSD': 'FX:GBPUSD',
  'USDJPY': 'FX:USDJPY',
  'USDCAD': 'FX:USDCAD',
  'AUDUSD': 'FX:AUDUSD',
  'USDCHF': 'FX:USDCHF',
  'NZDUSD': 'FX:NZDUSD',
  'EURGBP': 'FX:EURGBP',
  'EURJPY': 'FX:EURJPY',
  'GBPJPY': 'FX:GBPJPY',
  'EURCHF': 'FX:EURCHF',
  'GBPCHF': 'FX:GBPCHF',
  'AUDCAD': 'FX:AUDCAD',
  'AUDJPY': 'FX:AUDJPY',
  'CADJPY': 'FX:CADJPY',
  'CHFJPY': 'FX:CHFJPY',
  'EURAUD': 'FX:EURAUD',
  'EURCAD': 'FX:EURCAD',
  'EURNZD': 'FX:EURNZD',
  'GBPAUD': 'FX:GBPAUD',
  'GBPCAD': 'FX:GBPCAD',
  'GBPNZD': 'FX:GBPNZD',
  'NZDCAD': 'FX:NZDCAD',
  'NZDJPY': 'FX:NZDJPY'
}

// Common crypto pairs
const cryptoMapping: SymbolMapping = {
  'BTCUSD': 'COINBASE:BTCUSD',
  'ETHUSD': 'COINBASE:ETHUSD',
  'ADAUSD': 'COINBASE:ADAUSD',
  'SOLUSD': 'COINBASE:SOLUSD',
  'DOTUSD': 'COINBASE:DOTUSD',
  'LINKUSD': 'COINBASE:LINKUSD',
  'LTCUSD': 'COINBASE:LTCUSD',
  'BCHUSD': 'COINBASE:BCHUSD',
  'XLMUSD': 'COINBASE:XLMUSD',
  'XTZUSD': 'COINBASE:XTZUSD',
  'UNIUSD': 'COINBASE:UNIUSD',
  'AVAXUSD': 'COINBASE:AVAXUSD',
  'MATICUSD': 'COINBASE:MATICUSD',
  'AAVEUSD': 'COINBASE:AAVEUSD',
  'COMPUSD': 'COINBASE:COMPUSD',
  'MKRUSD': 'COINBASE:MKRUSD',
  'SNXUSD': 'COINBASE:SNXUSD',
  'YFIUSD': 'COINBASE:YFIUSD',
  'GRTUSD': 'COINBASE:GRTUSD',
  'FILUSD': 'COINBASE:FILUSD'
}

/**
 * Converts a trading symbol to TradingView format
 * Note: Due to TradingView widget limitations, some futures symbols are mapped to equivalent ETFs
 * for better compatibility. For example:
 * - NQ/MNQ futures -> QQQ ETF (tracks NASDAQ-100)
 * - ES/MES futures -> SPY ETF (tracks S&P 500)
 * - This provides similar price movement visualization while ensuring widget compatibility
 * 
 * @param symbol - The original trading symbol
 * @param contractType - The type of contract (stock, future, forex, crypto, etc.)
 * @param exchange - The exchange (optional, for stocks)
 * @returns TradingView-compatible symbol
 */
export function mapToTradingViewSymbol(
  symbol: string, 
  contractType?: string, 
  exchange?: string
): string {
  if (!symbol) return 'NASDAQ:AAPL' // Default fallback
  
  const upperSymbol = symbol.toUpperCase()
  
  // Check specific mappings first
  if (futuresMapping[upperSymbol]) {
    return futuresMapping[upperSymbol]
  }
  
  if (forexMapping[upperSymbol]) {
    return forexMapping[upperSymbol]
  }
  
  if (cryptoMapping[upperSymbol]) {
    return cryptoMapping[upperSymbol]
  }
  
  // Handle based on contract type
  if (contractType) {
    const lowerContractType = contractType.toLowerCase()
    
    switch (lowerContractType) {
      case 'future':
      case 'futures':
        // Try to auto-detect futures exchange - with ETF fallbacks for widget compatibility
        if (upperSymbol.startsWith('NQ') || upperSymbol.startsWith('MNQ')) {
          return 'NASDAQ:QQQ' // Fallback to QQQ for NASDAQ-100 exposure
        }
        if (upperSymbol.startsWith('ES') || upperSymbol.startsWith('MES')) {
          return 'AMEX:SPY' // Fallback to SPY for S&P 500 exposure
        }
        if (upperSymbol.startsWith('RTY') || upperSymbol.startsWith('M2K')) {
          return 'AMEX:IWM' // Fallback to IWM for Russell 2000 exposure
        }
        if (upperSymbol.startsWith('YM') || upperSymbol.startsWith('MYM')) {
          return `CBOT:${upperSymbol}1!`
        }
        if (upperSymbol.startsWith('GC') || upperSymbol.startsWith('SI')) {
          return `COMEX:${upperSymbol}1!`
        }
        if (upperSymbol.startsWith('CL') || upperSymbol.startsWith('NG')) {
          return `NYMEX:${upperSymbol}1!`
        }
        if (upperSymbol.startsWith('ZB') || upperSymbol.startsWith('ZN') || 
            upperSymbol.startsWith('ZF') || upperSymbol.startsWith('ZT') ||
            upperSymbol.startsWith('ZC') || upperSymbol.startsWith('ZS') ||
            upperSymbol.startsWith('ZW')) {
          return `CBOT:${upperSymbol}1!`
        }
        return `CME:${upperSymbol}1!` // Default to CME
        
      case 'forex':
      case 'fx':
        return `FX:${upperSymbol}`
        
      case 'crypto':
      case 'cryptocurrency':
        return `COINBASE:${upperSymbol}`
        
      case 'stock':
      case 'equity':
      default:
        // Handle stocks with exchange prefix
        if (exchange) {
          const upperExchange = exchange.toUpperCase()
          switch (upperExchange) {
            case 'NASDAQ':
            case 'NMS':
              return `NASDAQ:${upperSymbol}`
            case 'NYSE':
            case 'NYQ':
              return `NYSE:${upperSymbol}`
            case 'AMEX':
            case 'ASE':
              return `AMEX:${upperSymbol}`
            default:
              return `${upperExchange}:${upperSymbol}`
          }
        }
        
        // Auto-detect exchange for common symbols
        const commonNasdaqSymbols = [
          'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'TSLA', 'META', 'NVDA', 
          'NFLX', 'ADBE', 'PYPL', 'INTC', 'CMCSA', 'CSCO', 'QCOM', 'TXN',
          'AVGO', 'COST', 'TMUS', 'CHTR', 'SBUX', 'ISRG', 'GILD', 'BKNG',
          'MU', 'AMAT', 'ADI', 'LRCX', 'KLAC', 'MRVL', 'SNPS', 'CDNS'
        ]
        
        if (commonNasdaqSymbols.includes(upperSymbol)) {
          return `NASDAQ:${upperSymbol}`
        }
        
        // Default to NASDAQ for most symbols
        return `NASDAQ:${upperSymbol}`
    }
  }
  
  // If no contract type specified, try to auto-detect
  
  // Check if it looks like a forex pair (6-8 characters, currency codes)
  if (upperSymbol.length >= 6 && upperSymbol.length <= 8 && 
      /^[A-Z]{6,8}$/.test(upperSymbol)) {
    // Common currency codes
    const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD']
    const first3 = upperSymbol.slice(0, 3)
    const second3 = upperSymbol.slice(3, 6)
    
    if (currencies.includes(first3) && currencies.includes(second3)) {
      return `FX:${upperSymbol}`
    }
  }
  
  // Check if it looks like a crypto pair
  if (upperSymbol.includes('BTC') || upperSymbol.includes('ETH') || 
      upperSymbol.includes('USD') && upperSymbol.length <= 8) {
    return `COINBASE:${upperSymbol}`
  }
  
  // Default to stock on NASDAQ
  return `NASDAQ:${upperSymbol}`
}

/**
 * Gets the appropriate interval for TradingView based on trade duration
 * @param entryDate - Trade entry date
 * @param exitDate - Trade exit date (optional)
 * @returns TradingView interval string
 */
export function getOptimalInterval(entryDate: Date, exitDate?: Date): string {
  if (!exitDate) {
    return 'D' // Default to daily for open trades
  }
  
  const durationMs = exitDate.getTime() - entryDate.getTime()
  const durationHours = durationMs / (1000 * 60 * 60)
  const durationDays = durationHours / 24
  
  if (durationHours < 1) {
    return '1' // 1 minute for very short trades
  } else if (durationHours < 4) {
    return '5' // 5 minute for short intraday trades
  } else if (durationHours < 24) {
    return '15' // 15 minute for day trades
  } else if (durationDays < 7) {
    return '60' // 1 hour for short swing trades
  } else if (durationDays < 30) {
    return '240' // 4 hour for medium swing trades
  } else {
    return 'D' // Daily for long-term trades
  }
}

/**
 * Validates if a symbol is likely valid for TradingView
 * @param symbol - The symbol to validate
 * @returns boolean indicating if symbol is likely valid
 */
export function isValidTradingViewSymbol(symbol: string): boolean {
  if (!symbol || symbol.length < 1) return false
  
  // Should contain only letters, numbers, colons, and exclamation marks
  return /^[A-Z0-9:!_-]+$/i.test(symbol)
}

/**
 * Gets exchange name from TradingView symbol
 * @param tvSymbol - TradingView symbol (e.g., "NASDAQ:AAPL")
 * @returns Exchange name or null
 */
export function getExchangeFromTradingViewSymbol(tvSymbol: string): string | null {
  const colonIndex = tvSymbol.indexOf(':')
  if (colonIndex === -1) return null
  
  return tvSymbol.substring(0, colonIndex)
}

/**
 * Gets ticker from TradingView symbol
 * @param tvSymbol - TradingView symbol (e.g., "NASDAQ:AAPL")
 * @returns Ticker symbol or the original symbol
 */
export function getTickerFromTradingViewSymbol(tvSymbol: string): string {
  const colonIndex = tvSymbol.indexOf(':')
  if (colonIndex === -1) return tvSymbol
  
  return tvSymbol.substring(colonIndex + 1)
}

/**
 * Gets mapping explanation for a symbol
 * @param originalSymbol - The original trading symbol
 * @param mappedSymbol - The TradingView mapped symbol
 * @returns Explanation of the mapping or null if no explanation needed
 */
export function getSymbolMappingExplanation(originalSymbol: string, mappedSymbol: string): string | null {
  const upperOriginal = originalSymbol.toUpperCase()
  
  // Futures to ETF mappings
  if ((upperOriginal.startsWith('NQ') || upperOriginal.startsWith('MNQ')) && mappedSymbol === 'NASDAQ:QQQ') {
    return 'Showing QQQ ETF chart (tracks NASDAQ-100, similar to NQ futures movement)'
  }
  
  if ((upperOriginal.startsWith('ES') || upperOriginal.startsWith('MES')) && mappedSymbol === 'AMEX:SPY') {
    return 'Showing SPY ETF chart (tracks S&P 500, similar to ES futures movement)'
  }
  
  if ((upperOriginal.startsWith('RTY') || upperOriginal.startsWith('M2K')) && mappedSymbol === 'AMEX:IWM') {
    return 'Showing IWM ETF chart (tracks Russell 2000, similar to RTY futures movement)'
  }
  
  if ((upperOriginal.startsWith('YM') || upperOriginal.startsWith('MYM')) && mappedSymbol === 'AMEX:DIA') {
    return 'Showing DIA ETF chart (tracks Dow Jones, similar to YM futures movement)'
  }
  
  return null
}