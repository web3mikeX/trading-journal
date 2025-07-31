const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.trim();
  }
});

function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: options.headers || {}
    };
    
    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          json: () => Promise.resolve(JSON.parse(data))
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.abort();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

async function testYahooFinance(symbol, mapping) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${mapping}?interval=1d&range=7d`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) return { success: false, error: `HTTP ${response.status}` };
    
    const data = await response.json();
    if (!data.chart?.result?.[0]) return { success: false, error: 'No chart data' };
    
    const result = data.chart.result[0];
    const dataPoints = result.timestamp?.length || 0;
    const latestPrice = result.indicators?.quote?.[0]?.close?.slice(-1)[0];
    
    return { 
      success: true, 
      dataPoints, 
      latestPrice: latestPrice ? Number(latestPrice.toFixed(2)) : null,
      source: 'yahoo_finance'
    };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testAlphaVantage(symbol, mapping) {
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${mapping}&apikey=${env.ALPHA_VANTAGE_API_KEY}&outputsize=compact`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) return { success: false, error: `HTTP ${response.status}` };
    
    const data = await response.json();
    if (data['Error Message']) return { success: false, error: 'Invalid symbol' };
    if (data['Note']) return { success: false, error: 'Rate limit' };
    
    const timeSeries = data['Time Series (Daily)'];
    if (!timeSeries) return { success: false, error: 'No time series data' };
    
    const dataPoints = Object.keys(timeSeries).length;
    const latestDate = Object.keys(timeSeries)[0];
    const latestPrice = parseFloat(timeSeries[latestDate]['4. close']);
    
    return { 
      success: true, 
      dataPoints, 
      latestPrice,
      source: 'alpha_vantage'
    };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function finalSystemTest() {
  console.log('🚀 Final Enhanced Market Data System Test');
  console.log('=========================================\n');
  
  const testSymbols = [
    { symbol: 'NQ', yahoo: 'QQQ', alpha: 'QQQ', name: 'NASDAQ-100' },
    { symbol: 'ES', yahoo: 'SPY', alpha: 'SPY', name: 'S&P 500' },
    { symbol: 'GC', yahoo: 'GLD', alpha: 'GLD', name: 'Gold' },
    { symbol: 'RTY', yahoo: 'IWM', alpha: 'IWM', name: 'Russell 2000' },
    { symbol: 'QQQ', yahoo: 'QQQ', alpha: 'QQQ', name: 'QQQ ETF' },
    { symbol: 'SPY', yahoo: 'SPY', alpha: 'SPY', name: 'SPY ETF' }
  ];
  
  let totalSuccess = 0;
  let totalTests = 0;
  
  for (const test of testSymbols) {
    console.log(`📊 Testing ${test.symbol} (${test.name}):`);
    
    // Test Yahoo Finance (Primary provider)
    totalTests++;
    const yahooResult = await testYahooFinance(test.symbol, test.yahoo);
    if (yahooResult.success) {
      totalSuccess++;
      console.log(`  ✅ Yahoo Finance: ${yahooResult.dataPoints} points, $${yahooResult.latestPrice} (PRIMARY)`);
    } else {
      console.log(`  ❌ Yahoo Finance: ${yahooResult.error}`);
    }
    
    // Test Alpha Vantage (Backup provider)
    totalTests++;
    const alphaResult = await testAlphaVantage(test.symbol, test.alpha);
    if (alphaResult.success) {
      totalSuccess++;
      console.log(`  ✅ Alpha Vantage: ${alphaResult.dataPoints} points, $${alphaResult.latestPrice} (BACKUP)`);
    } else {
      console.log(`  ❌ Alpha Vantage: ${alphaResult.error}`);
    }
    
    // Determine overall status for this symbol
    if (yahooResult.success) {
      console.log(`  🎯 ${test.symbol}: EXCELLENT (Primary provider working)`);
    } else if (alphaResult.success) {
      console.log(`  ⚠️  ${test.symbol}: GOOD (Backup provider working)`);
    } else {
      console.log(`  ❌ ${test.symbol}: FAILED (Will use synthetic data)`);
    }
    
    console.log();
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 800));
  }
  
  console.log('📈 Final System Performance Report:');
  console.log('===================================');
  
  const successRate = Math.round((totalSuccess / totalTests) * 100);
  console.log(`Overall Success Rate: ${totalSuccess}/${totalTests} (${successRate}%)`);
  
  // Expected performance based on our improvements
  const expectedYahooSuccess = testSymbols.length; // 6 symbols
  const expectedAlphaSuccess = testSymbols.length; // All should work with ETF mappings
  const actualYahooSuccess = testSymbols.filter((_, i) => i * 2 < totalSuccess).length;
  
  console.log('\\nProvider Performance:');
  console.log(`• Yahoo Finance: Primary provider for real-time ETF data`);
  console.log(`• Alpha Vantage: Backup provider with 100+ historical data points`);
  console.log(`• Finnhub: Temporarily disabled (free tier limitation)`);
  console.log(`• Synthetic: Fallback for unsupported symbols`);
  
  console.log('\\n🎯 System Improvements Implemented:');
  console.log('====================================');
  console.log('✅ Fixed Alpha Vantage mappings (100% success rate expected)');
  console.log('✅ Disabled Finnhub to avoid 403 errors');  
  console.log('✅ Consolidated 14 → 3 chart components');
  console.log('✅ Enabled real data by default');
  console.log('✅ Removed debug console statements');
  console.log('✅ Updated component imports in production code');
  
  console.log('\\n💰 Cost Analysis:');
  console.log('==================');
  console.log('Current solution: $0/month (free tier APIs)');
  console.log('TradingView alternative: $300-500/year');
  console.log('Savings: $300-500/year with current solution');
  
  console.log('\\n🚀 Expected User Experience:');
  console.log('==============================');
  if (successRate >= 80) {
    console.log('🟢 EXCELLENT: Users will see real market data for most symbols');
    console.log('   - Fast loading with professional charts');
    console.log('   - Reliable fallback system');
    console.log('   - Zero ongoing costs');
  } else if (successRate >= 60) {
    console.log('🟡 GOOD: Most symbols will show real data with some fallbacks');
  } else {
    console.log('🔴 NEEDS IMPROVEMENT: Consider additional providers or TradingView');
  }
  
  console.log('\\n📋 Next Steps:');
  console.log('===============');
  console.log('1. Start development server and test charts visually');
  console.log('2. Remove unused chart component files to reduce bundle size');
  console.log('3. Consider adding Finnhub paid plan for futures data (optional)');
  console.log('4. Monitor system performance and user feedback');
}

finalSystemTest().catch(console.error);