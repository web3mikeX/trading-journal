import { NextRequest, NextResponse } from 'next/server'

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
  const results = {
    futures: [] as any[],
    etfs: [] as any[],
    summary: {
      futuresFound: 0,
      etfsFound: 0,
      totalTested: 0
    }
  }
  
  console.log('\n=== Testing Yahoo Finance ===')
  
  // Test direct futures symbols (limited selection for speed)
  const limitedSymbols = ['NQ', 'ES', 'RTY']
  
  for (const symbol of limitedSymbols) {
    try {
      results.summary.totalTested++
      
      // Try different Yahoo Finance formats for futures
      const formats = [
        `${symbol}=F`, // Standard futures format
        `${symbol}.CME`, // CME exchange format
        `${symbol}1!`, // Continuous contract format
      ]
      
      let found = false
      for (const format of formats) {
        try {
          const url = `https://query1.finance.yahoo.com/v8/finance/chart/${format}?interval=1d&range=5d`
          const response = await fetch(url)
          
          if (!response.ok) continue
          
          const data = await response.json()
          
          if (data.chart && data.chart.result && data.chart.result.length > 0) {
            const result = data.chart.result[0]
            const marketData = {
              symbol,
              format,
              price: result.meta?.regularMarketPrice || null,
              exchange: result.meta?.exchangeName || 'Unknown',
              dataPoints: result.timestamp?.length || 0,
              status: 'success'
            }
            
            results.futures.push(marketData)
            results.summary.futuresFound++
            console.log(`✅ ${symbol} -> ${format}: Found data`)
            found = true
            break
          }
        } catch (err) {
          // Continue to next format
        }
      }
      
      if (!found) {
        results.futures.push({
          symbol,
          status: 'failed',
          error: 'No valid format found'
        })
        console.log(`❌ ${symbol}: No data found`)
      }
    } catch (error) {
      results.futures.push({
        symbol,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      console.log(`❌ ${symbol}: Error - ${error}`)
    }
  }
  
  // Test ETF fallbacks
  console.log('\n--- Testing ETF Fallbacks ---')
  for (const [futures, etf] of Object.entries(etfFallbacks)) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${etf}?interval=1d&range=5d`
      const response = await fetch(url)
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      
      const data = await response.json()
      
      if (data.chart && data.chart.result && data.chart.result.length > 0) {
        const result = data.chart.result[0]
        const etfData = {
          futures,
          etf,
          price: result.meta?.regularMarketPrice || null,
          exchange: result.meta?.exchangeName || 'Unknown',
          dataPoints: result.timestamp?.length || 0,
          status: 'success'
        }
        
        results.etfs.push(etfData)
        results.summary.etfsFound++
        console.log(`✅ ${futures} fallback -> ${etf}: $${etfData.price}`)
      } else {
        throw new Error('No chart data in response')
      }
    } catch (error) {
      results.etfs.push({
        futures,
        etf,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      console.log(`❌ ${futures} fallback -> ${etf}: Failed`)
    }
  }
  
  return results
}

async function testSampleDataGeneration() {
  console.log('\n=== Testing Sample Data Generation ===')
  
  // Test our existing approach - generate synthetic data based on known patterns
  const sampleResults = []
  
  for (const symbol of ['NQ', 'ES', 'RTY']) {
    try {
      // Simulate realistic price data for these symbols
      const basePrice = symbol === 'NQ' ? 20000 : symbol === 'ES' ? 5000 : 2000
      const dataPoints = []
      
      // Generate 20 days of OHLC data
      for (let i = 0; i < 20; i++) {
        const date = new Date()
        date.setDate(date.getDate() - (19 - i))
        
        const volatility = basePrice * 0.002 // 0.2% daily volatility
        const trend = (Math.random() - 0.5) * volatility * 2
        
        const open = basePrice + trend + (Math.random() - 0.5) * volatility
        const close = open + (Math.random() - 0.5) * volatility
        const high = Math.max(open, close) + Math.random() * volatility * 0.5
        const low = Math.min(open, close) - Math.random() * volatility * 0.5
        
        dataPoints.push({
          date: date.toISOString(),
          open: Number(open.toFixed(2)),
          high: Number(high.toFixed(2)),
          low: Number(low.toFixed(2)),
          close: Number(close.toFixed(2)),
          volume: Math.floor(Math.random() * 100000) + 50000
        })
      }
      
      sampleResults.push({
        symbol,
        basePrice,
        dataPoints: dataPoints.length,
        sampleData: dataPoints.slice(0, 3), // First 3 days as sample
        status: 'success'
      })
      
      console.log(`✅ ${symbol}: Generated ${dataPoints.length} synthetic data points`)
    } catch (error) {
      sampleResults.push({
        symbol,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      console.log(`❌ ${symbol}: Sample generation failed`)
    }
  }
  
  return sampleResults
}

export async function GET(request: NextRequest) {
  try {
    console.log('Starting market data API testing...')
    
    const results = {
      timestamp: new Date().toISOString(),
      tests: {
        yahoo: null as any,
        synthetic: null as any
      },
      recommendations: [] as string[]
    }
    
    // Test Yahoo Finance
    try {
      results.tests.yahoo = await testYahooFinance()
    } catch (error) {
      results.tests.yahoo = {
        error: error instanceof Error ? error.message : 'Yahoo Finance test failed',
        status: 'failed'
      }
    }
    
    // Test synthetic data generation
    try {
      results.tests.synthetic = await testSampleDataGeneration()
    } catch (error) {
      results.tests.synthetic = {
        error: error instanceof Error ? error.message : 'Synthetic data test failed',
        status: 'failed'
      }
    }
    
    // Generate recommendations
    const yahooSuccess = results.tests.yahoo?.summary?.etfsFound || 0
    const syntheticSuccess = results.tests.synthetic?.length || 0
    
    if (yahooSuccess > 0) {
      results.recommendations.push('✅ Yahoo Finance ETF data is available - use for real market data')
      results.recommendations.push(`📊 Found ${yahooSuccess} working ETF symbols that can replace futures`)
    }
    
    if (syntheticSuccess > 0) {
      results.recommendations.push('✅ Synthetic data generation works - use as fallback')
      results.recommendations.push('🔄 Hybrid approach: Real data where available, synthetic elsewhere')
    }
    
    results.recommendations.push('🎯 Best strategy: Use ETF proxies (QQQ for NQ, SPY for ES, etc.)')
    results.recommendations.push('⚡ Implementation: Yahoo Finance for real data + synthetic fallback')
    
    console.log('Market data testing completed')
    
    return NextResponse.json(results, { status: 200 })
    
  } catch (error) {
    console.error('Market data test error:', error)
    return NextResponse.json({
      error: 'Market data testing failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}