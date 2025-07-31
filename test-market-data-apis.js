/**
 * Test script to validate market data API availability for CMC futures
 * This script tests multiple free data providers to see which ones support our needed symbols
 */

const fetch = require('node-fetch')

// Test symbols we need for CMC futures
const testSymbols = [
  'NQ', 'NQH25', 'NQM25', // NASDAQ futures
  'ES', 'ESH25', 'ESM25', // S&P 500 futures  
  'RTY', 'RTYH25', 'RTYM25', // Russell 2000 futures
  'YM', 'YMH25', 'YMM25', // Dow futures
  'GC', 'GCG25', 'GCJ25', // Gold futures
  'CL', 'CLF25', 'CLG25', // Crude Oil futures
]

// Alternative ETF symbols as fallbacks
const etfFallbacks = {
  'NQ': 'QQQ',
  'ES': 'SPY', 
  'RTY': 'IWM',
  'YM': 'DIA',
  'GC': 'GLD',
  'CL': 'USO'
}

async function testYahooFinance() {
  console.log('\n=== Testing Yahoo Finance ===')
  
  // Test direct futures symbols
  for (const symbol of testSymbols) {
    try {
      // Try different Yahoo Finance formats for futures
      const formats = [
        `${symbol}=F`, // Standard futures format
        `${symbol}.CME`, // CME exchange format
        `${symbol}1!`, // Continuous contract format
      ]
      
      for (const format of formats) {
        try {
          const url = `https://query1.finance.yahoo.com/v8/finance/chart/${format}?interval=1d&range=5d`
          const response = await fetch(url)
          const data = await response.json()
          
          if (data.chart && data.chart.result && data.chart.result.length > 0) {
            const result = data.chart.result[0]
            console.log(`✅ ${symbol} -> ${format}: Found data`)
            console.log(`   Current Price: $${result.meta?.regularMarketPrice || 'N/A'}`)
            console.log(`   Exchange: ${result.meta?.exchangeName || 'Unknown'}`)
            console.log(`   Data Points: ${result.timestamp?.length || 0}`)
            break
          }
        } catch (err) {
          // Continue to next format
        }
      }
    } catch (error) {
      console.log(`❌ ${symbol}: No data found`)
    }
  }
  
  // Test ETF fallbacks
  console.log('\n--- Testing ETF Fallbacks ---')
  for (const [futures, etf] of Object.entries(etfFallbacks)) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${etf}?interval=1d&range=5d`
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.chart && data.chart.result && data.chart.result.length > 0) {
        const result = data.chart.result[0]
        console.log(`✅ ${futures} fallback -> ${etf}: $${result.meta?.regularMarketPrice || 'N/A'}`)
      }
    } catch (error) {
      console.log(`❌ ${futures} fallback -> ${etf}: Failed`)
    }
  }
}

async function testAlphaVantage() {
  console.log('\n=== Testing Alpha Vantage ===')
  console.log('Note: Alpha Vantage requires API key. Testing with demo key (limited)')
  
  const API_KEY = 'demo' // Replace with real key for testing
  
  // Test a few key symbols
  const testSyms = ['QQQ', 'SPY', 'IWM'] // Using ETFs as Alpha Vantage has limited futures support
  
  for (const symbol of testSyms) {
    try {
      const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${API_KEY}`
      const response = await fetch(url)
      const data = await response.json()
      
      if (data['Time Series (Daily)']) {
        const dates = Object.keys(data['Time Series (Daily)'])
        const latestDate = dates[0]
        const latestData = data['Time Series (Daily)'][latestDate]
        console.log(`✅ ${symbol}: $${latestData['4. close']} (${latestDate})`)
      } else if (data['Error Message']) {
        console.log(`❌ ${symbol}: ${data['Error Message']}`)
      } else if (data['Note']) {
        console.log(`⚠️  ${symbol}: ${data['Note']}`)
      }
    } catch (error) {
      console.log(`❌ ${symbol}: Request failed - ${error.message}`)
    }
  }
}

async function testPolygonIO() {
  console.log('\n=== Testing Polygon.io ===')
  console.log('Note: Polygon.io requires API key. Testing free tier limitations')
  
  // Polygon.io free tier is very limited, mainly for stocks
  const API_KEY = 'demo' // Replace with real key for testing
  
  const testSyms = ['QQQ', 'SPY']
  
  for (const symbol of testSyms) {
    try {
      const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apikey=${API_KEY}`
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0]
        console.log(`✅ ${symbol}: $${result.c} (Close: ${new Date(result.t).toDateString()})`)
      } else {
        console.log(`❌ ${symbol}: No data or API key required`)
      }
    } catch (error) {
      console.log(`❌ ${symbol}: Request failed - ${error.message}`)
    }
  }
}

async function testFinnhub() {
  console.log('\n=== Testing Finnhub ===')
  console.log('Note: Finnhub has free tier with good coverage')
  
  const API_KEY = 'demo' // Replace with real key: https://finnhub.io/
  
  const testSyms = ['QQQ', 'SPY', 'IWM']
  
  for (const symbol of testSyms) {
    try {
      const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.c && data.c > 0) {
        console.log(`✅ ${symbol}: $${data.c} (Current: ${data.pc > 0 ? '+' : ''}${((data.c - data.pc) / data.pc * 100).toFixed(2)}%)`)
      } else {
        console.log(`❌ ${symbol}: No data available`)
      }
    } catch (error) {
      console.log(`❌ ${symbol}: Request failed - ${error.message}`)
    }
  }
}

async function generateDataSourceReport() {
  console.log('\n' + '='.repeat(60))
  console.log('MARKET DATA API TESTING REPORT')
  console.log('='.repeat(60))
  
  try {
    await testYahooFinance()
    await new Promise(resolve => setTimeout(resolve, 1000)) // Rate limiting
    
    await testAlphaVantage()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await testPolygonIO()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await testFinnhub()
    
    console.log('\n' + '='.repeat(60))
    console.log('RECOMMENDATIONS:')
    console.log('='.repeat(60))
    console.log('1. Yahoo Finance: Best free option for ETF data (QQQ, SPY, etc.)')
    console.log('2. Direct futures data is limited on free APIs')
    console.log('3. ETF fallbacks provide similar price movement for charting')
    console.log('4. Consider hybrid approach: real data where available, synthetic elsewhere')
    console.log('5. Yahoo Finance format: {SYMBOL}=F for futures, {SYMBOL} for ETFs')
    
  } catch (error) {
    console.error('Error running tests:', error)
  }
}

if (require.main === module) {
  generateDataSourceReport()
}

module.exports = {
  testYahooFinance,
  testAlphaVantage,
  testPolygonIO,
  testFinnhub,
  testSymbols,
  etfFallbacks
}