const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Simple fetch implementation for Node.js
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };
    
    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusText: res.statusMessage,
          json: () => Promise.resolve(JSON.parse(data)),
          text: () => Promise.resolve(data)
        });
      });
    });
    
    req.on('error', reject);
    
    if (options.timeout) {
      req.setTimeout(options.timeout, () => {
        req.abort();
        reject(new Error('Request timeout'));
      });
    }
    
    req.end();
  });
}

// Load environment variables from .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.trim();
  }
});

console.log('🔍 Trading Journal Market Data Diagnostic');
console.log('==========================================\n');

// Test configurations
const testSymbols = ['NQ', 'ES', 'QQQ', 'SPY', 'GC', 'BTC'];
const testResults = {
  yahoo: { success: 0, failed: 0, errors: [] },
  alphaVantage: { success: 0, failed: 0, errors: [] },
  finnhub: { success: 0, failed: 0, errors: [] }
};

// Yahoo Finance Test
async function testYahooFinance(symbol) {
  const yahooMappings = {
    'NQ': 'QQQ',
    'ES': 'SPY', 
    'RTY': 'IWM',
    'YM': 'DIA',
    'GC': 'GLD',
    'CL': 'USO',
    'QQQ': 'QQQ',
    'SPY': 'SPY',
    'BTC': 'BITO'
  };
  
  const yahooSymbol = yahooMappings[symbol] || symbol;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=7d`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      timeout: 5000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.chart?.result?.[0]) {
      throw new Error('No chart data in response');
    }
    
    const result = data.chart.result[0];
    const dataPoints = result.timestamp?.length || 0;
    
    console.log(`  ✅ Yahoo Finance: ${symbol} → ${yahooSymbol} (${dataPoints} data points)`);
    testResults.yahoo.success++;
    return { success: true, dataPoints, mappedSymbol: yahooSymbol };
    
  } catch (error) {
    console.log(`  ❌ Yahoo Finance: ${symbol} → ${yahooSymbol} - ${error.message}`);
    testResults.yahoo.failed++;
    testResults.yahoo.errors.push({ symbol, error: error.message });
    return { success: false, error: error.message };
  }
}

// Alpha Vantage Test
async function testAlphaVantage(symbol) {
  const alphaVantageSymbols = {
    'NQ': 'NDX',
    'ES': 'SPX', 
    'GC': 'GOLD',
    'CL': 'OIL',
    'SI': 'SILVER',
    'NG': 'NATGAS'
  };
  
  const avSymbol = alphaVantageSymbols[symbol] || symbol;
  const apiKey = env.ALPHA_VANTAGE_API_KEY;
  
  if (!apiKey) {
    console.log(`  ❌ Alpha Vantage: ${symbol} - No API key configured`);
    testResults.alphaVantage.failed++;
    return { success: false, error: 'No API key' };
  }
  
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${avSymbol}&apikey=${apiKey}&outputsize=compact`;
  
  try {
    const response = await fetch(url, { timeout: 10000 });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data['Error Message']) {
      throw new Error('Invalid symbol');
    }
    
    if (data['Note']) {
      throw new Error('Rate limit exceeded');
    }
    
    const timeSeries = data['Time Series (Daily)'];
    if (!timeSeries) {
      throw new Error('No time series data');
    }
    
    const dataPoints = Object.keys(timeSeries).length;
    console.log(`  ✅ Alpha Vantage: ${symbol} → ${avSymbol} (${dataPoints} data points)`);
    testResults.alphaVantage.success++;
    return { success: true, dataPoints, mappedSymbol: avSymbol };
    
  } catch (error) {
    console.log(`  ❌ Alpha Vantage: ${symbol} → ${avSymbol} - ${error.message}`);
    testResults.alphaVantage.failed++;
    testResults.alphaVantage.errors.push({ symbol, error: error.message });
    return { success: false, error: error.message };
  }
}

// Finnhub Test
async function testFinnhub(symbol) {
  const finnhubSymbols = {
    'NQ': 'NQc1',
    'ES': 'ESc1',
    'GC': 'GCc1', 
    'CL': 'CLc1',
    'YM': 'YM.cme',
    'RTY': 'RTY.cme'
  };
  
  const finnhubSymbol = finnhubSymbols[symbol] || symbol;
  const apiKey = env.FINNHUB_API_KEY;
  
  if (!apiKey) {
    console.log(`  ❌ Finnhub: ${symbol} - No API key configured`);
    testResults.finnhub.failed++;
    return { success: false, error: 'No API key' };
  }
  
  const to = Math.floor(Date.now() / 1000);
  const from = to - (7 * 24 * 60 * 60);
  const url = `https://finnhub.io/api/v1/stock/candle?symbol=${finnhubSymbol}&resolution=D&from=${from}&to=${to}&token=${apiKey}`;
  
  try {
    const response = await fetch(url, { timeout: 10000 });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.c || !data.t) {
      throw new Error('Invalid response format');
    }
    
    if (data.s === 'no_data') {
      throw new Error('No data available');
    }
    
    const dataPoints = data.t.length;
    console.log(`  ✅ Finnhub: ${symbol} → ${finnhubSymbol} (${dataPoints} data points)`);
    testResults.finnhub.success++;
    return { success: true, dataPoints, mappedSymbol: finnhubSymbol };
    
  } catch (error) {
    console.log(`  ❌ Finnhub: ${symbol} → ${finnhubSymbol} - ${error.message}`);
    testResults.finnhub.failed++;
    testResults.finnhub.errors.push({ symbol, error: error.message });
    return { success: false, error: error.message };
  }
}

// Test Next.js API endpoint
async function testNextjsAPI(symbol) {
  const url = `http://localhost:3000/api/market-data?symbol=${symbol}&days=7`;
  
  try {
    const response = await fetch(url, { timeout: 15000 });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    console.log(`  ✅ Next.js API: ${symbol} → ${data.dataSource} (${data.data?.length || 0} points)`);
    return { success: true, dataSource: data.dataSource, dataPoints: data.data?.length || 0 };
    
  } catch (error) {
    console.log(`  ❌ Next.js API: ${symbol} - ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Main test function
async function runDiagnostic() {
  console.log('📋 Environment Check:');
  console.log(`  Alpha Vantage API Key: ${env.ALPHA_VANTAGE_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`  Finnhub API Key: ${env.FINNHUB_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log('');
  
  console.log('🔗 Testing Market Data Providers:');
  console.log('');
  
  for (const symbol of testSymbols) {
    console.log(`Testing ${symbol}:`);
    
    // Test each provider
    await testYahooFinance(symbol);
    await testAlphaVantage(symbol);
    await testFinnhub(symbol);
    
    console.log('');
    
    // Small delay between symbols to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('🌐 Testing Next.js API Integration:');
  console.log('');
  
  for (const symbol of ['NQ', 'ES', 'GC']) {
    await testNextjsAPI(symbol);
  }
  
  console.log('');
  console.log('📊 Test Results Summary:');
  console.log('========================');
  console.log(`Yahoo Finance: ${testResults.yahoo.success} success, ${testResults.yahoo.failed} failed`);
  console.log(`Alpha Vantage: ${testResults.alphaVantage.success} success, ${testResults.alphaVantage.failed} failed`);
  console.log(`Finnhub: ${testResults.finnhub.success} success, ${testResults.finnhub.failed} failed`);
  
  // Show error details
  if (testResults.yahoo.errors.length > 0) {
    console.log('\\nYahoo Finance Errors:');
    testResults.yahoo.errors.forEach(e => console.log(`  ${e.symbol}: ${e.error}`));
  }
  
  if (testResults.alphaVantage.errors.length > 0) {
    console.log('\\nAlpha Vantage Errors:');
    testResults.alphaVantage.errors.forEach(e => console.log(`  ${e.symbol}: ${e.error}`));
  }
  
  if (testResults.finnhub.errors.length > 0) {
    console.log('\\nFinnhub Errors:');
    testResults.finnhub.errors.forEach(e => console.log(`  ${e.symbol}: ${e.error}`));
  }
  
  // Recommendations
  console.log('\\n💡 Recommendations:');
  console.log('====================');
  
  if (testResults.yahoo.success === 0) {
    console.log('⚠️  Yahoo Finance: All requests failed - check network/firewall');
  } else if (testResults.yahoo.failed > 0) {
    console.log('⚠️  Yahoo Finance: Some symbol mappings may need adjustment');
  }
  
  if (!env.ALPHA_VANTAGE_API_KEY) {
    console.log('⚠️  Alpha Vantage: API key needed for futures data');
  } else if (testResults.alphaVantage.success === 0) {
    console.log('⚠️  Alpha Vantage: API key may be invalid or rate limited');
  }
  
  if (!env.FINNHUB_API_KEY) {
    console.log('⚠️  Finnhub: API key needed for real-time futures data');
  } else if (testResults.finnhub.success === 0) {
    console.log('⚠️  Finnhub: API key may be invalid or rate limited');
  }
}

// Run the diagnostic
runDiagnostic().catch(console.error);