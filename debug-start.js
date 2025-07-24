const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Starting ORIGINAL Next.js Trading Journal with debugging...');

// Ensure .env.local exists
const envPath = path.join(__dirname, '.env.local');
const envContent = `
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=demo-secret-key-for-development-only-please-change-in-production
DATABASE_URL=file:./prisma/dev.db
NODE_ENV=development
`;

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envContent.trim());
  console.log('✅ Created .env.local file');
}

// Check if dependencies are installed
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Installing dependencies...');
  const installProcess = spawn('npm', ['install'], {
    cwd: __dirname,
    stdio: 'inherit'
  });
  
  installProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Dependencies installed successfully');
      startNextApp();
    } else {
      console.error('❌ Failed to install dependencies');
      process.exit(1);
    }
  });
} else {
  console.log('✅ Dependencies already installed');
  startNextApp();
}

function startNextApp() {
  console.log('🚀 Starting Next.js application...');
  
  const nextProcess = spawn('npx', ['next', 'dev', '--port', '3000'], {
    cwd: __dirname,
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
  let outputBuffer = '';
  let errorBuffer = '';

  nextProcess.stdout.on('data', (data) => {
    const output = data.toString();
    outputBuffer += output;
    console.log(`📤 ${output.trim()}`);
    
    if ((output.includes('Ready in') || output.includes('started server')) && !isReady) {
      isReady = true;
      console.log('\n🎉 Next.js application is ready!');
      console.log('🌐 Access your ORIGINAL Trading Journal at: http://localhost:3000');
      console.log('📊 All your features are available:');
      console.log('   - NextAuth authentication');
      console.log('   - Trading dashboard');
      console.log('   - Trade management');
      console.log('   - Analytics');
      console.log('   - Database integration');
      
      // Test the application
      setTimeout(() => {
        console.log('\n🔍 Testing application...');
        testApplication();
      }, 2000);
    }
  });

  nextProcess.stderr.on('data', (data) => {
    const error = data.toString();
    errorBuffer += error;
    
    // Filter out common Next.js warnings
    if (!error.includes('warn') && 
        !error.includes('Warning') && 
        !error.includes('next:') && 
        !error.includes('prisma:')) {
      console.log(`⚠️  ${error.trim()}`);
    }
  });

  nextProcess.on('close', (code) => {
    console.log(`\n🏁 Next.js process exited with code ${code}`);
    if (code !== 0) {
      console.log('❌ Application failed to start');
      console.log('\nFull output:', outputBuffer);
      console.log('\nErrors:', errorBuffer);
    }
  });

  nextProcess.on('error', (error) => {
    console.error('❌ Failed to start Next.js process:', error);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Next.js application...');
    nextProcess.kill();
    process.exit(0);
  });
}

function testApplication() {
  const http = require('http');
  
  // Test main page
  const req = http.get('http://localhost:3000', (res) => {
    console.log(`✅ Main page response: ${res.statusCode}`);
    if (res.statusCode === 200 || res.statusCode === 307) {
      console.log('✅ Application is responding correctly');
    }
  });
  
  req.on('error', (error) => {
    console.log(`❌ Connection test failed: ${error.message}`);
    console.log('❌ The application may not be fully ready yet');
  });
  
  req.setTimeout(5000, () => {
    console.log('⏱️  Connection test timed out');
    req.destroy();
  });
}

console.log('\n💡 Press Ctrl+C to stop the application');