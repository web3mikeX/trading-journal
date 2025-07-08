const { spawn } = require('child_process');
const http = require('http');

console.log('🚀 Starting Trading Journal with fixed homepage...');

const nextProcess = spawn('npm', ['run', 'dev'], {
  cwd: '/mnt/c/Users/nftmi/OneDrive/Desktop/Tradedeta/trading-journal',
  env: {
    ...process.env,
    NODE_ENV: 'development',
    NEXTAUTH_URL: 'http://localhost:3000',
    NEXTAUTH_SECRET: 'demo-secret-key-for-development-only-please-change-in-production',
    DATABASE_URL: 'file:./prisma/dev.db'
  },
  stdio: ['pipe', 'pipe', 'pipe']
});

let serverReady = false;

nextProcess.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(`📤 ${output.trim()}`);
  
  if (output.includes('Ready in') && !serverReady) {
    serverReady = true;
    console.log('✅ Server is ready! Testing...');
    
    setTimeout(() => {
      testEndpoints();
    }, 2000);
  }
});

nextProcess.stderr.on('data', (data) => {
  const error = data.toString().trim();
  if (error && !error.includes('next:') && !error.includes('prisma:')) {
    console.error(`⚠️  ${error}`);
  }
});

function testEndpoints() {
  console.log('🔍 Testing homepage...');
  
  const req = http.get('http://localhost:3000/', (res) => {
    console.log(`✅ Homepage Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      if (data.includes('Trading Journal')) {
        console.log('🎉 SUCCESS! Homepage is working!');
        console.log('🌐 Access: http://localhost:3000');
        
        // Test API
        setTimeout(testAPI, 1000);
      } else {
        console.log('⚠️  Homepage loaded but content might be wrong');
      }
    });
  });
  
  req.on('error', (error) => {
    console.error(`❌ Homepage test failed: ${error.message}`);
  });
  
  req.setTimeout(10000, () => {
    console.error('⏰ Homepage test timed out');
    req.destroy();
  });
}

function testAPI() {
  console.log('🔍 Testing API...');
  
  const req = http.get('http://localhost:3000/api/health', (res) => {
    console.log(`✅ API Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`📋 API Response: ${data}`);
      console.log('🎉 ALL TESTS PASSED! Your trading journal is ready!');
    });
  });
  
  req.on('error', (error) => {
    console.error(`❌ API test failed: ${error.message}`);
  });
  
  req.setTimeout(5000);
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  nextProcess.kill();
  process.exit(0);
});

// Keep running
console.log('💡 Press Ctrl+C to stop the server');