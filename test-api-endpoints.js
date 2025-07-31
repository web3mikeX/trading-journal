const https = require('https');
const http = require('http');

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

async function testAPIEndpoints() {
  console.log('🌐 Testing Trading Journal API Endpoints');
  console.log('========================================\n');
  
  const baseUrl = 'http://localhost:3004';
  const testSymbols = ['NQ', 'ES', 'QQQ'];
  
  console.log('Testing /api/market-data endpoint:\n');
  
  for (const symbol of testSymbols) {
    try {
      const url = `${baseUrl}/api/market-data?symbol=${symbol}&days=7&preferReal=true`;
      console.log(`Testing ${symbol}...`);
      
      const response = await fetch(url, { timeout: 30000 });
      
      if (!response.ok) {
        console.log(`  ❌ ${symbol}: HTTP ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      
      if (data.error) {
        console.log(`  ❌ ${symbol}: ${data.error}`);
        continue;
      }
      
      console.log(`  ✅ ${symbol}: ${data.dataSource} - ${data.data?.length || 0} points`);
      if (data.metadata?.explanation) {
        console.log(`     📋 ${data.metadata.explanation}`);
      }
      if (data.metadata?.proxySymbol) {
        console.log(`     🔄 Mapped to: ${data.metadata.proxySymbol}`);
      }
      
    } catch (error) {
      console.log(`  ❌ ${symbol}: ${error.message}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\nTesting /api/enhanced-market-data endpoint:\n');
  
  for (const symbol of testSymbols) {
    try {
      const url = `${baseUrl}/api/enhanced-market-data?symbol=${symbol}&days=7`;
      console.log(`Testing enhanced ${symbol}...`);
      
      const response = await fetch(url, { timeout: 30000 });
      
      if (!response.ok) {
        console.log(`  ❌ ${symbol}: HTTP ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      
      if (data.error) {
        console.log(`  ❌ ${symbol}: ${data.error}`);
        continue;
      }
      
      console.log(`  ✅ ${symbol}: ${data.dataSource} - ${data.data?.length || 0} points`);
      
    } catch (error) {
      console.log(`  ❌ ${symbol}: ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🔍 Testing synthetic data fallback:\n');
  
  try {
    const url = `${baseUrl}/api/market-data?symbol=INVALID_SYMBOL&days=7&preferReal=false`;
    console.log('Testing synthetic fallback...');
    
    const response = await fetch(url, { timeout: 15000 });
    const data = await response.json();
    
    if (data.dataSource === 'enhanced_synthetic' || data.dataSource === 'synthetic') {
      console.log(`  ✅ Synthetic fallback working: ${data.data?.length || 0} points`);
    } else {
      console.log(`  ⚠️  Unexpected data source: ${data.dataSource}`);
    }
    
  } catch (error) {
    console.log(`  ❌ Synthetic test failed: ${error.message}`);
  }
}

testAPIEndpoints().catch(console.error);