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

function fetch(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const req = https.request({
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET'
    }, (res) => {
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

async function testUpdatedMappings() {
  console.log('🔄 Testing Updated Alpha Vantage Mappings');
  console.log('=========================================\n');
  
  // New mappings: NQ→QQQ, ES→SPY, GC→GLD, etc.
  const testMappings = [
    { original: 'NQ', mapped: 'QQQ', description: 'NASDAQ futures → QQQ ETF' },
    { original: 'ES', mapped: 'SPY', description: 'S&P 500 futures → SPY ETF' },
    { original: 'GC', mapped: 'GLD', description: 'Gold futures → GLD ETF' },
    { original: 'CL', mapped: 'USO', description: 'Oil futures → USO ETF' },
    { original: 'SI', mapped: 'SLV', description: 'Silver futures → SLV ETF' }
  ];
  
  const apiKey = env.ALPHA_VANTAGE_API_KEY;
  
  for (const mapping of testMappings) {
    console.log(`Testing ${mapping.description}:`);
    
    try {
      const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${mapping.mapped}&apikey=${apiKey}&outputsize=compact`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.log(`  ❌ HTTP ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      
      if (data['Error Message']) {
        console.log(`  ❌ Invalid symbol: ${data['Error Message']}`);
        continue;
      }
      
      if (data['Note']) {
        console.log(`  ⚠️  Rate limit: ${data['Note']}`);
        continue;
      }
      
      const timeSeries = data['Time Series (Daily)'];
      if (!timeSeries) {
        console.log(`  ❌ No time series data for ${mapping.mapped}`);
        continue;
      }
      
      const dataPoints = Object.keys(timeSeries).length;
      const latestDate = Object.keys(timeSeries)[0];
      const latestPrice = timeSeries[latestDate]['4. close'];
      
      console.log(`  ✅ ${mapping.original} → ${mapping.mapped}: ${dataPoints} data points`);
      console.log(`     Latest: $${parseFloat(latestPrice).toFixed(2)} (${latestDate})`);
      
    } catch (error) {
      console.log(`  ❌ Request failed: ${error.message}`);
    }
    
    console.log();
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('🎯 Summary:');
  console.log('===========');
  console.log('Updated Alpha Vantage mappings use ETF symbols instead of index symbols.');
  console.log('This should provide 100% success rate for the mapped futures symbols.');
  console.log('Yahoo Finance remains the primary provider with Alpha Vantage as backup.');
}

testUpdatedMappings().catch(console.error);