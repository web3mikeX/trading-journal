// Direct test of the enhancedMarketData service
const path = require('path');
const fs = require('fs');

// Load environment variables
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    process.env[key.trim()] = value.trim();
  }
});

// Mock globalThis.fetch for the service
const https = require('https');
const http = require('http');

globalThis.fetch = function(url, options = {}) {
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
    
    if (options.signal) {
      options.signal.addEventListener('abort', () => {
        req.abort();
        reject(new Error('AbortError'));
      });
    }
    
    req.end();
  });
};

// Mock AbortController
globalThis.AbortController = class AbortController {
  constructor() {
    this.signal = {
      aborted: false,
      addEventListener: (event, callback) => {
        this._callback = callback;
      }
    };
  }
  
  abort() {
    this.signal.aborted = true;
    if (this._callback) {
      this._callback();
    }
  }
};

async function testEnhancedMarketDataService() {
  console.log('🔧 Direct Enhanced Market Data Service Test');
  console.log('===========================================\n');
  
  try {
    // Import the service
    const { getEnhancedMarketData, hasRealDataSupport, getProviderInfo } = 
      require('./src/services/enhancedMarketData.ts');
    
    const testSymbols = ['NQ', 'ES', 'QQQ', 'SPY', 'GC'];
    
    for (const symbol of testSymbols) {
      console.log(`\n📊 Testing ${symbol}:`);
      console.log(`  Real data support: ${hasRealDataSupport(symbol)}`);
      console.log(`  Available providers: ${getProviderInfo(symbol).join(', ')}`);
      
      try {
        // Test with real data preference
        console.log('  Testing with preferReal=true...');
        const realDataResult = await getEnhancedMarketData(symbol, 7, true);
        console.log(`    ✅ ${realDataResult.dataSource}: ${realDataResult.data.length} data points`);
        
        if (realDataResult.metadata?.explanation) {
          console.log(`    📋 ${realDataResult.metadata.explanation}`);
        }
        
        // Test with synthetic data preference
        console.log('  Testing with preferReal=false...');
        const syntheticResult = await getEnhancedMarketData(symbol, 7, false);
        console.log(`    ✅ ${syntheticResult.dataSource}: ${syntheticResult.data.length} data points`);
        
      } catch (error) {
        console.log(`    ❌ Error: ${error.message}`);
      }
      
      // Small delay between symbols
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n🎯 Testing fallback chain:');
    console.log('Testing with invalid symbol to trigger fallback...');
    
    try {
      const fallbackResult = await getEnhancedMarketData('INVALID_SYMBOL_TEST', 5, true);
      console.log(`  ✅ Fallback working: ${fallbackResult.dataSource} - ${fallbackResult.data.length} points`);
    } catch (error) {
      console.log(`  ❌ Fallback failed: ${error.message}`);
    }
    
  } catch (importError) {
    console.log('❌ Failed to import enhancedMarketData service:', importError.message);
    console.log('This suggests a TypeScript compilation issue.');
  }
}

testEnhancedMarketDataService().catch(error => {
  console.error('Test failed:', error);
});