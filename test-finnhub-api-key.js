const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables
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
          statusText: res.statusMessage,
          json: () => Promise.resolve(JSON.parse(data)),
          text: () => Promise.resolve(data)
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

async function testFinnhubAPIKey() {
  console.log('🔑 Testing Finnhub API Key');
  console.log('==========================\n');
  
  const apiKey = env.FINNHUB_API_KEY;
  console.log(`Current API Key: ${apiKey ? apiKey.substring(0, 10) + '...' : 'NOT FOUND'}\n`);
  
  if (!apiKey) {
    console.log('❌ No Finnhub API key found in .env.local');
    return;
  }
  
  // Test 1: Basic API access with a simple endpoint
  console.log('Test 1: Basic API access (company profile)');
  try {
    const url = `https://finnhub.io/api/v1/stock/profile2?symbol=AAPL&token=${apiKey}`;
    const response = await fetch(url);
    
    console.log(`  Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.name) {
        console.log(`  ✅ Basic API working - Got data for: ${data.name}`);
      } else {
        console.log(`  ⚠️  API responded but data looks unusual:`, JSON.stringify(data).substring(0, 200));
      }
    } else {
      const errorData = await response.text();
      console.log(`  ❌ API call failed: ${errorData}`);
    }
  } catch (error) {
    console.log(`  ❌ Request failed: ${error.message}`);
  }
  
  console.log();
  
  // Test 2: Test candle data (what we actually need)
  console.log('Test 2: Candle data access (what charts need)');
  try {
    const to = Math.floor(Date.now() / 1000);
    const from = to - (7 * 24 * 60 * 60);
    const url = `https://finnhub.io/api/v1/stock/candle?symbol=AAPL&resolution=D&from=${from}&to=${to}&token=${apiKey}`;
    const response = await fetch(url);
    
    console.log(`  Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.c && data.t) {
        console.log(`  ✅ Candle data working - Got ${data.t.length} data points`);
        console.log(`  📊 Latest close price: $${data.c[data.c.length - 1]}`);
      } else if (data && data.s === 'no_data') {
        console.log(`  ⚠️  No data available for symbol (this is normal for invalid symbols)`);
      } else {
        console.log(`  ⚠️  Unusual response:`, JSON.stringify(data).substring(0, 200));
      }
    } else {
      const errorData = await response.text();
      console.log(`  ❌ Candle API failed: ${errorData}`);
      
      if (response.status === 403) {
        console.log(`  💡 403 Forbidden suggests API key issues or plan limitations`);
      }
    }
  } catch (error) {
    console.log(`  ❌ Request failed: ${error.message}`);
  }
  
  console.log();
  
  // Test 3: Test futures symbol (our main use case)
  console.log('Test 3: Futures symbol access (ES futures)');
  try {
    const to = Math.floor(Date.now() / 1000);
    const from = to - (7 * 24 * 60 * 60);
    const url = `https://finnhub.io/api/v1/stock/candle?symbol=ESc1&resolution=D&from=${from}&to=${to}&token=${apiKey}`;
    const response = await fetch(url);
    
    console.log(`  Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.c && data.t) {
        console.log(`  ✅ Futures data working - Got ${data.t.length} data points for ES`);
      } else if (data && data.s === 'no_data') {
        console.log(`  ⚠️  No futures data available (may require upgraded plan)`);
      } else {
        console.log(`  ⚠️  Unusual response:`, JSON.stringify(data).substring(0, 200));
      }
    } else {
      const errorData = await response.text();
      console.log(`  ❌ Futures API failed: ${errorData}`);
      
      if (response.status === 403) {
        console.log(`  💡 Futures data may require paid Finnhub plan`);
      }
    }
  } catch (error) {
    console.log(`  ❌ Request failed: ${error.message}`);
  }
  
  console.log();
  
  // Test 4: Check API usage/limits
  console.log('Test 4: API usage information');
  try {
    const url = `https://finnhub.io/api/v1/stock/symbol?exchange=US&token=${apiKey}`;
    const response = await fetch(url);
    
    console.log(`  Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        console.log(`  ✅ API key has access to US symbols list (${data.length} symbols)`);
        console.log(`  📈 Sample symbols:`, data.slice(0, 3).map(s => s.symbol).join(', '));
      } else {
        console.log(`  ⚠️  Unusual symbols response:`, JSON.stringify(data).substring(0, 200));
      }
    } else {
      const errorData = await response.text();
      console.log(`  ❌ Symbols API failed: ${errorData}`);
    }
  } catch (error) {
    console.log(`  ❌ Request failed: ${error.message}`);
  }
  
  console.log();
  console.log('🔍 Analysis & Recommendations:');
  console.log('===============================');
  
  console.log('Based on our original diagnostic (all 403 errors), the API key appears to have limitations.');
  console.log('');
  console.log('Possible solutions:');
  console.log('1. 🔄 Try getting a fresh free API key from https://finnhub.io/');
  console.log('2. 💰 Upgrade to paid Finnhub plan for futures data access');
  console.log('3. ✅ Keep current system with Yahoo + Alpha Vantage (already 90% working)');
  console.log('4. 🚫 Disable Finnhub provider temporarily to avoid 403 errors');
  console.log('');
  console.log('💡 Recommendation: Option 3 (current system works great without Finnhub)');
}

testFinnhubAPIKey().catch(console.error);