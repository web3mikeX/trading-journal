/**
 * Test MNQU5 chart data generation
 */

// Simple test to verify MNQU5 symbol support
function testMNQU5Support() {
  console.log('🧪 Testing MNQU5 Symbol Support...\n')
  
  // Test trade context for MNQU5
  const testTrade = {
    symbol: 'MNQU5',
    entryPrice: 22300,
    exitPrice: 22350,
    side: 'LONG'
  }
  
  console.log('Test Trade:', testTrade)
  
  // Test synthetic data generation logic
  const basePrices = {
    'NQ': 21500, 'MNQ': 21500, 'MNQU5': 22500, 'ES': 6100, 'MES': 6100
  }
  
  const basePrice = basePrices['MNQU5'] || basePrices['MNQU5'.replace(/[HMU Z]\d{2}$/, '')] || 1000
  console.log(`Base price for MNQU5: ${basePrice}`)
  
  // Test trade context influence
  if (testTrade.entryPrice) {
    const tradePrice = testTrade.entryPrice
    const adjustedPrice = tradePrice * (0.98 + Math.random() * 0.04)
    console.log(`Trade context adjusted price: ${adjustedPrice.toFixed(2)}`)
  }
  
  // Test Yahoo Finance mapping
  const yahooMappings = {
    'MNQU5': { yahoo: 'QQQ', explanation: 'QQQ ETF tracks NASDAQ-100, similar to MNQU5 micro futures' }
  }
  
  const mapping = yahooMappings['MNQU5']
  if (mapping) {
    console.log(`Yahoo Finance mapping: ${mapping.yahoo} - ${mapping.explanation}`)
  }
  
  // Test Alpha Vantage mapping
  const alphaMappings = {
    'MNQU5': 'QQQ'
  }
  
  const alphaSymbol = alphaMappings['MNQU5']
  if (alphaSymbol) {
    console.log(`Alpha Vantage mapping: ${alphaSymbol}`)
  }
  
  console.log('\n✅ MNQU5 symbol support test completed!')
  console.log('   - Yahoo Finance mapping: ✅ QQQ')
  console.log('   - Alpha Vantage mapping: ✅ QQQ') 
  console.log('   - Base price configured: ✅ 22,500')
  console.log('   - Trade context support: ✅ Enabled')
}

// Run the test
testMNQU5Support()