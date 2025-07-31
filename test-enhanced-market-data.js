/**
 * Test script for enhanced market data service
 * Run with: node test-enhanced-market-data.js
 */

const { getEnhancedMarketData, hasRealDataSupport, getProviderInfo } = require('./src/services/enhancedMarketData.ts')

// Test symbols
const testSymbols = ['NQ', 'ES', 'GC', 'CL', 'YM', 'RTY', 'BTC', 'ETH']

async function testEnhancedMarketData() {
  console.log('🚀 Testing Enhanced Market Data Service\n')

  // Test provider support
  console.log('📊 Provider Support Check:')
  testSymbols.forEach(symbol => {
    const providers = getProviderInfo(symbol)
    const hasSupport = hasRealDataSupport(symbol)
    console.log(`  ${symbol}: ${hasSupport ? '✅' : '❌'} ${providers.join(', ')}`)
  })

  console.log('\n📈 Testing Data Fetching:')
  
  for (const symbol of testSymbols.slice(0, 3)) { // Test first 3 symbols
    try {
      console.log(`\n🔍 Testing ${symbol}...`)
      const data = await getEnhancedMarketData(symbol, 7, true)
      
      console.log(`  ✅ Success: ${data.data.length} data points`)
      console.log(`  📊 Source: ${data.dataSource}`)
      console.log(`  🏦 Provider: ${data.metadata?.provider || 'N/A'}`)
      console.log(`  📅 Range: ${new Date(data.data[0].timestamp).toLocaleDateString()} - ${new Date(data.data[data.data.length - 1].timestamp).toLocaleDateString()}`)
      console.log(`  💰 Latest: $${data.data[data.data.length - 1].close}`)
      
      if (data.metadata?.explanation) {
        console.log(`  ℹ️  Note: ${data.metadata.explanation}`)
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`)
    }
  }

  console.log('\n✅ Enhanced Market Data Service test complete!')
}

// Run the test
if (require.main === module) {
  testEnhancedMarketData().catch(console.error)
}

module.exports = { testEnhancedMarketData }
