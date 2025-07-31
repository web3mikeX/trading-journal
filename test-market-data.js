// Quick test of market data service
const { getMarketDataServer } = require('./src/services/marketDataServer.ts')

async function testMarketData() {
  console.log('🧪 Testing Market Data Service...')
  
  const testSymbols = ['NQ', 'ES', 'QQQ', 'SPY', 'INVALID_SYMBOL']
  
  for (const symbol of testSymbols) {
    try {
      console.log(`\n📊 Testing ${symbol}...`)
      const result = await getMarketDataServer(symbol, 7, true)
      
      console.log(`✅ ${symbol}: ${result.data.length} data points (${result.dataSource})`)
      if (result.metadata?.proxySymbol) {
        console.log(`   📍 Proxy: ${result.metadata.proxySymbol}`)
        console.log(`   💬 Explanation: ${result.metadata.explanation}`)
      }
      
      // Show sample data point
      if (result.data.length > 0) {
        const sample = result.data[0]
        console.log(`   📈 Sample: ${new Date(sample.timestamp).toDateString()} - OHLC: ${sample.open}/${sample.high}/${sample.low}/${sample.close}`)
      }
      
    } catch (error) {
      console.log(`❌ ${symbol}: ${error.message}`)
    }
  }
}

// Only run if called directly
if (require.main === module) {
  testMarketData().catch(console.error)
}

module.exports = { testMarketData }