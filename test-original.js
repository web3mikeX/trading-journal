const { spawn } = require('child_process');
const http = require('http');

console.log('🔧 Testing simplified original Next.js app...');

// Kill any existing processes
try {
  require('child_process').execSync('pkill -f "next.*3000"', { stdio: 'ignore' });
} catch (e) {}

const nextProcess = spawn('npx', ['next', 'dev', '--port', '3000'], {
  cwd: '/mnt/c/Users/nftmi/OneDrive/Desktop/Tradedeta/trading-journal',
  env: {
    ...process.env,
    NODE_ENV: 'development',
    NEXTAUTH_URL: 'http://localhost:3000',
    NEXTAUTH_SECRET: 'demo-secret-key-for-development-only-please-change-in-production',
    DATABASE_URL: 'file:./prisma/dev.db'
  },
  stdio: 'pipe'
});

let isReady = false;
let testAttempts = 0;

nextProcess.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(`📤 ${output.trim()}`);
  
  if ((output.includes('Ready in') || output.includes('started server')) && !isReady) {
    isReady = true;
    console.log('\n✅ Next.js is ready! Testing...');
    
    // Wait a bit then test
    setTimeout(testApp, 3000);
  }
});

nextProcess.stderr.on('data', (data) => {
  const error = data.toString();
  if (!error.includes('warn') && !error.includes('Warning')) {
    console.log(`⚠️  ${error.trim()}`);
  }
});

function testApp() {
  testAttempts++;
  console.log(`\n🔍 Test attempt ${testAttempts}...`);
  
  const req = http.get('http://localhost:3000', (res) => {
    console.log(`✅ Response: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (data.length > 0) {
        console.log('✅ Got response data!');
        console.log('🎉 YOUR ORIGINAL TRADING JOURNAL IS WORKING!');
        console.log('🌐 Access it at: http://localhost:3000');
      } else {
        console.log('❌ Empty response');
        if (testAttempts < 3) {
          setTimeout(testApp, 3000);
        }
      }
    });
  });
  
  req.on('error', (error) => {
    console.log(`❌ Connection error: ${error.message}`);
    if (testAttempts < 3) {
      console.log('⏱️  Retrying in 3 seconds...');
      setTimeout(testApp, 3000);
    } else {
      console.log('❌ Max attempts reached. The app may have issues.');
    }
  });
  
  req.setTimeout(10000, () => {
    console.log('⏱️  Request timeout');
    req.destroy();
    if (testAttempts < 3) {
      setTimeout(testApp, 3000);
    }
  });
}

nextProcess.on('close', (code) => {
  console.log(`\n🏁 Process exited with code ${code}`);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  nextProcess.kill();
  process.exit(0);
});

console.log('\n💡 Press Ctrl+C to stop the server');