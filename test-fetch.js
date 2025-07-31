// Simple fetch test for the stats API
const http = require('http');

const testFetch = async () => {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/stats?userId=cmcwu8b5m0001m17ilm0triy8',
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Node.js Test Client'
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      console.log(`Status: ${res.statusCode}`);
      console.log(`Headers:`, res.headers);
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log('\nAPI Response:');
          console.log('- Total P&L:', jsonData.totalPnL);
          console.log('- Win Rate:', jsonData.winRate);
          console.log('- Total Trades:', jsonData.totalTrades);
          console.log('- Recent Trades Count:', jsonData.recentTrades?.length || 0);
          resolve(jsonData);
        } catch (error) {
          console.error('JSON Parse Error:', error.message);
          console.log('Raw Response:', data);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Request Error:', error.message);
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      console.error('Request timeout');
      req.abort();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
};

testFetch().then(() => {
  console.log('\n✅ API test completed successfully');
}).catch((error) => {
  console.error('\n❌ API test failed:', error.message);
});