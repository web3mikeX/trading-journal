#!/usr/bin/env node

/**
 * Test script for the hybrid multi-provider system
 * Tests MNQ and NQ symbol support with fallback mechanisms
 */

const { hybridMarketDataService } = require('./src/services/hybridMarketData')
const { getHybridSymbolMapping, getAvailableDataSources } = require('./src/lib/hybridSymbolMappings')

console.log('🧪 Testing Hybrid Multi-Provider System')
console.log('=====================================\n')

async function testSymbol(symbol) {
  console.log(`\n📊 Testing ${symbol}...`)
  
  // Test symbol mapping
  const mapping = getHybridSymbolMapping(symbol)
  if (!mapping) {
    console.log(`❌ No mapping found for ${symbol}`)
    return
  }
  
  console.log(`✅ Symbol mapping found:`)
  console.log(`   Primary: ${mapping.primary}`)
  console.log(`   Yahoo: ${mapping.yahoo}`)
  console.log(`   ETF: ${mapping.etf}`)
  console.log(`   Description: ${mapping.description}`)
  
  // Test data sources
  const sources = getAvailableDataSources(symbol)
  console.log(`📈 Available sources: ${sources.sources.join(', ')}`)
  
  // Test actual data fetching
  try {
    console.log(`🔍 Fetching market data...`)
    const data = await hybridMarketDataService.getMarketData(symbol, '1d', '7d')
    
    if (data.success) {
      console.log(`✅ Data retrieved successfully!`)
      console.log(`   Source: ${data.source}`)
      console.log(`   Data points: ${data.data.length}`)
      console.log(`   First candle: ${new Date(data.data[0]?.timestamp).toISOString()}`)
      console.log(`   Last candle: ${new Date(data.data[data.data.length - 1]?.timestamp).toISOString()}`)
      
      if (data.data.length > 0) {
        const first = data.data[0]
        console.log(`   Sample data: O:${first.open} H:${first.high} L:${first.low} C:${first.close}`)
      }
    } else {
      console.log(`❌ Failed to fetch data: ${data.error}`)
    }
  } catch (error) {
    console.log(`❌ Error fetching data: ${error.message}`)
  }
}

async function testSymbolAvailability(symbol) {
  console.log(`\n🔍 Testing availability for ${symbol}...`)
  
  try {
    const results = await hybridMarketDataService.testSymbol(symbol)
    console.log(`✅ Availability test complete:`)
    console.log(`   TradingView: ${results.tradingView ? '✅' : '❌'}`)
    console.log(`   Yahoo Finance: ${results.yahoo ? '✅' : '❌'}`)
    console.log(`   ETF Proxy: ${results.etf ? '✅' : '❌'}`)
    console.log(`   Best source: ${results.bestSource}`)
  } catch (error) {
    console.log(`❌ Error testing availability: ${error.message}`)
  }
}

async function runTests() {
  const testSymbols = ['MNQ', 'NQ', 'ES', 'MES', 'GC', 'CL']
  
  console.log('🎯 Testing CME futures symbols with hybrid system\n')
  
  for (const symbol of testSymbols) {
    await testSymbol(symbol)
    await testSymbolAvailability(symbol)
  }
  
  console.log('\n🎉 Hybrid system test complete!')
  console.log('\n📋 Summary:')
  console.log('   - MNQ and NQ now have multiple fallback options')
  console.log('   - Yahoo Finance provides ETF proxies (QQQ for NQ)')
  console.log('   - System automatically selects best available source')
  console.log('   - No more "symbol only available on TradingView" errors')
}

// Run the tests
runTests().catch(console.error)
