/**
 * TradingView Configuration Manager
 * Handles environment-based settings for TradingView subscription integration
 */

export interface TradingViewConfig {
  // Core settings
  subscriptionEnabled: boolean
  tradeMarkersEnabled: boolean
  
  // Chart appearance
  defaultTheme: 'light' | 'dark'
  defaultInterval: string
  hideTopToolbar: boolean
  hideSideToolbar: boolean
  allowSymbolChange: boolean
  
  // Advanced features
  libraryPath?: string
  customCssUrl?: string
  
  // Data provider settings
  dataProviderPriority: string[]
  
  // Performance settings
  maxDataPoints: number
  lazyLoad: boolean
  cacheDuration: number
  
  // API keys for fallback providers
  alphaVantageApiKey?: string
  finnhubApiKey?: string
}

/**
 * Get TradingView configuration from environment variables
 */
export function getTradingViewConfig(): TradingViewConfig {
  return {
    // Core settings
    subscriptionEnabled: process.env.NEXT_PUBLIC_TRADINGVIEW_SUBSCRIPTION_ENABLED === 'true',
    tradeMarkersEnabled: process.env.NEXT_PUBLIC_TRADINGVIEW_TRADE_MARKERS_ENABLED === 'true',
    
    // Chart appearance
    defaultTheme: (process.env.NEXT_PUBLIC_TRADINGVIEW_DEFAULT_THEME as 'light' | 'dark') || 'dark',
    defaultInterval: process.env.NEXT_PUBLIC_TRADINGVIEW_DEFAULT_INTERVAL || '1d',
    hideTopToolbar: process.env.NEXT_PUBLIC_TRADINGVIEW_HIDE_TOP_TOOLBAR === 'true',
    hideSideToolbar: process.env.NEXT_PUBLIC_TRADINGVIEW_HIDE_SIDE_TOOLBAR === 'true',
    allowSymbolChange: process.env.NEXT_PUBLIC_TRADINGVIEW_ALLOW_SYMBOL_CHANGE === 'true',
    
    // Advanced features
    libraryPath: process.env.NEXT_PUBLIC_TRADINGVIEW_LIBRARY_PATH,
    customCssUrl: process.env.NEXT_PUBLIC_TRADINGVIEW_CUSTOM_CSS_URL,
    
    // Data provider settings
    dataProviderPriority: (process.env.NEXT_PUBLIC_DATA_PROVIDER_PRIORITY || 'tradingview,yahoo,alpha_vantage,synthetic').split(','),
    
    // Performance settings
    maxDataPoints: parseInt(process.env.NEXT_PUBLIC_CHART_MAX_DATA_POINTS || '1000'),
    lazyLoad: process.env.NEXT_PUBLIC_CHART_LAZY_LOAD === 'true',
    cacheDuration: parseInt(process.env.NEXT_PUBLIC_CHART_CACHE_DURATION || '300000'),
    
    // API keys for fallback providers
    alphaVantageApiKey: process.env.ALPHA_VANTAGE_API_KEY,
    finnhubApiKey: process.env.FINNHUB_API_KEY
  }
}

/**
 * Check if TradingView subscription features are available
 */
export function isTradingViewSubscriptionAvailable(): boolean {
  const config = getTradingViewConfig()
  return config.subscriptionEnabled
}

/**
 * Check if trade markers are enabled
 */
export function areTradeMarkersEnabled(): boolean {
  const config = getTradingViewConfig()
  return config.tradeMarkersEnabled && config.subscriptionEnabled
}

/**
 * Get preferred data provider based on availability and configuration
 */
export function getPreferredDataProvider(): 'tradingview' | 'yahoo' | 'alpha_vantage' | 'synthetic' {
  const config = getTradingViewConfig()
  const priority = config.dataProviderPriority
  
  for (const provider of priority) {
    switch (provider.trim()) {
      case 'tradingview':
        if (config.subscriptionEnabled) return 'tradingview'
        break
      case 'yahoo':
        return 'yahoo' // Yahoo Finance is always available
      case 'alpha_vantage':
        if (config.alphaVantageApiKey) return 'alpha_vantage'
        break
      case 'synthetic':
        return 'synthetic' // Synthetic data is always available
    }
  }
  
  return 'synthetic' // Final fallback
}

/**
 * Get TradingView widget configuration based on environment settings
 */
export function getTradingViewWidgetConfig(overrides: Partial<TradingViewConfig> = {}) {
  const config = getTradingViewConfig()
  const merged = { ...config, ...overrides }
  
  return {
    // Widget display settings
    autosize: false,
    theme: merged.defaultTheme,
    style: "1", // Candlestick
    locale: "en",
    
    // Toolbar settings
    hide_top_toolbar: merged.hideTopToolbar,
    hide_side_toolbar: merged.hideSideToolbar,
    allow_symbol_change: merged.allowSymbolChange,
    
    // Features
    enable_publishing: false,
    save_image: false,
    calendar: false,
    hide_volume: false,
    
    // Professional styling overrides
    overrides: {
      // Candlestick colors
      "mainSeriesProperties.candleStyle.upColor": "#26a69a",
      "mainSeriesProperties.candleStyle.downColor": "#ef5350",
      "mainSeriesProperties.candleStyle.borderUpColor": "#26a69a",
      "mainSeriesProperties.candleStyle.borderDownColor": "#ef5350",
      "mainSeriesProperties.candleStyle.wickUpColor": "#26a69a",
      "mainSeriesProperties.candleStyle.wickDownColor": "#ef5350",
      
      // Background and grid
      "paneProperties.background": merged.defaultTheme === 'dark' ? '#1f2937' : '#ffffff',
      "paneProperties.vertGridProperties.color": merged.defaultTheme === 'dark' ? '#374151' : '#f1f5f9',
      "paneProperties.horzGridProperties.color": merged.defaultTheme === 'dark' ? '#374151' : '#f1f5f9',
      
      // Scales
      "scalesProperties.textColor": merged.defaultTheme === 'dark' ? '#f1f5f9' : '#1e293b',
      "scalesProperties.lineColor": merged.defaultTheme === 'dark' ? '#4b5563' : '#d1d5db',
      
      // Volume
      "volumePaneSize": "medium"
    }
  }
}

/**
 * Get chart selection logic based on configuration and symbol support
 */
export function getChartComponent(
  symbol: string,
  hasTrade: boolean = false
): 'tradingview-subscription' | 'tradingview-widget' | 'lightweight-charts' | 'synthetic' {
  const config = getTradingViewConfig()
  
  // Priority 1: TradingView subscription with trade markers
  if (config.subscriptionEnabled && config.tradeMarkersEnabled && hasTrade) {
    return 'tradingview-subscription'
  }
  
  // Priority 2: TradingView basic widget
  if (config.subscriptionEnabled) {
    return 'tradingview-widget'
  }
  
  // Priority 3: Lightweight Charts with real data
  const preferredProvider = getPreferredDataProvider()
  if (preferredProvider === 'yahoo' || preferredProvider === 'alpha_vantage') {
    return 'lightweight-charts'
  }
  
  // Priority 4: Synthetic data fallback
  return 'synthetic'
}

/**
 * Format configuration for display in admin/debug panels
 */
export function getConfigSummary(): {
  enabled: boolean
  features: string[]
  dataProviders: string[]
  performance: string
  warnings: string[]
} {
  const config = getTradingViewConfig()
  const warnings: string[] = []
  
  // Check for configuration issues
  if (config.subscriptionEnabled && !config.tradeMarkersEnabled) {
    warnings.push('TradingView subscription enabled but trade markers disabled')
  }
  
  if (config.dataProviderPriority.includes('alpha_vantage') && !config.alphaVantageApiKey) {
    warnings.push('Alpha Vantage in priority list but no API key configured')
  }
  
  if (config.dataProviderPriority.includes('finnhub') && !config.finnhubApiKey) {
    warnings.push('Finnhub in priority list but no API key configured')
  }
  
  const features: string[] = []
  if (config.subscriptionEnabled) features.push('TradingView Subscription')
  if (config.tradeMarkersEnabled) features.push('Trade Markers')
  if (config.lazyLoad) features.push('Lazy Loading')
  if (config.libraryPath) features.push('Advanced Charting Library')
  
  return {
    enabled: config.subscriptionEnabled,
    features,
    dataProviders: config.dataProviderPriority,
    performance: `${config.maxDataPoints} max points, ${config.cacheDuration/1000}s cache`,
    warnings
  }
}

/**
 * Validate TradingView configuration
 */
export function validateTradingViewConfig(): {
  isValid: boolean
  errors: string[]
  recommendations: string[]
} {
  const config = getTradingViewConfig()
  const errors: string[] = []
  const recommendations: string[] = []
  
  // Critical errors
  if (config.maxDataPoints < 100) {
    errors.push('Max data points too low (minimum 100)')
  }
  
  if (config.maxDataPoints > 5000) {
    errors.push('Max data points too high (maximum 5000 for performance)')
  }
  
  if (config.cacheDuration < 60000) {
    errors.push('Cache duration too low (minimum 60 seconds)')
  }
  
  // Recommendations
  if (!config.subscriptionEnabled) {
    recommendations.push('Enable TradingView subscription for real-time data')
  }
  
  if (config.subscriptionEnabled && !config.tradeMarkersEnabled) {
    recommendations.push('Enable trade markers for better trade analysis')
  }
  
  if (!config.alphaVantageApiKey && !config.finnhubApiKey) {
    recommendations.push('Configure backup API keys for better data reliability')
  }
  
  if (config.maxDataPoints > 2000) {
    recommendations.push('Consider reducing max data points for better performance')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    recommendations
  }
}

/**
 * Default configuration for development
 */
export const DEFAULT_DEVELOPMENT_CONFIG: TradingViewConfig = {
  subscriptionEnabled: true,
  tradeMarkersEnabled: true,
  defaultTheme: 'dark',
  defaultInterval: '1d',
  hideTopToolbar: false,
  hideSideToolbar: false,
  allowSymbolChange: false,
  dataProviderPriority: ['tradingview', 'yahoo', 'synthetic'],
  maxDataPoints: 1000,
  lazyLoad: true,
  cacheDuration: 300000
}

/**
 * Production configuration template
 */
export const PRODUCTION_CONFIG_TEMPLATE: TradingViewConfig = {
  subscriptionEnabled: true,
  tradeMarkersEnabled: true,
  defaultTheme: 'light',
  defaultInterval: '1d',
  hideTopToolbar: false,
  hideSideToolbar: false,
  allowSymbolChange: false,
  dataProviderPriority: ['tradingview', 'alpha_vantage', 'yahoo', 'synthetic'],
  maxDataPoints: 2000,
  lazyLoad: true,
  cacheDuration: 600000 // 10 minutes
}