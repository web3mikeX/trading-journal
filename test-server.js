const { spawn } = require('child_process');
const http = require('http');

console.log('🔍 Diagnosing Next.js compilation issues...');

// Set proper environment
process.env.NODE_ENV = 'development';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.NEXTAUTH_SECRET = 'demo-secret-key-for-development-only-please-change-in-production';
process.env.DATABASE_URL = 'file:./prisma/dev.db';

// Start Next.js with better error handling
const nextProcess = spawn('npx', ['next', 'dev'], {
  cwd: '/mnt/c/Users/nftmi/OneDrive/Desktop/Tradedeta/trading-journal',
  env: process.env,
  stdio: 'pipe'
});

let outputBuffer = '';
let errorBuffer = '';

nextProcess.stdout.on('data', (data) => {
  const output = data.toString();
  outputBuffer += output;
  console.log(`📤 ${output.trim()}`);
  
  if (output.includes('Ready in')) {
    console.log('\n✅ Next.js compilation complete!');
    setTimeout(testApp, 2000);
  }
});

nextProcess.stderr.on('data', (data) => {
  const error = data.toString();
  errorBuffer += error;
  console.log(`⚠️  ${error.trim()}`);
});

function testApp() {
  console.log('\n🔍 Testing application endpoints...');
  
  // Test root redirect
  const req = http.get('http://localhost:3000', (res) => {
    console.log(`✅ Root page: ${res.statusCode}`);
    
    // Test auth page
    setTimeout(() => {
      const authReq = http.get('http://localhost:3000/auth/signin', (authRes) => {
        console.log(`✅ Auth page: ${authRes.statusCode}`);
        
        // Test API
        setTimeout(() => {
          const apiReq = http.get('http://localhost:3000/api/health', (apiRes) => {
            console.log(`✅ API health: ${apiRes.statusCode}`);
            console.log('\n🎉 Application is working properly!');
          });
          apiReq.on('error', (e) => console.log(`❌ API error: ${e.message}`));
          apiReq.setTimeout(5000);
        }, 1000);
      });
      authReq.on('error', (e) => console.log(`❌ Auth error: ${e.message}`));
      authReq.setTimeout(5000);
    }, 1000);
  });
  
  req.on('error', (error) => {
    console.log(`❌ Connection error: ${error.message}`);
    console.log('\n🚨 The application is not responding to requests.');
    console.log('This indicates a fundamental Next.js rendering issue.');
  });
  req.setTimeout(10000);
}

nextProcess.on('exit', (code) => {
  console.log(`\n🏁 Next.js exited with code ${code}`);
  if (code !== 0) {
    console.log('❌ Next.js failed to start properly');
    console.log('\nOutput:', outputBuffer);
    console.log('\nErrors:', errorBuffer);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  nextProcess.kill();
  process.exit(0);
});

console.log('\n💡 Press Ctrl+C to stop the server');