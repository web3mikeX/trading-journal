// Simple test to check TypeScript compilation
const { exec } = require('child_process');
const path = require('path');

// Change to trading-journal directory
process.chdir(path.join(__dirname, 'trading-journal'));

// Run TypeScript check
exec('npx tsc --noEmit', (error, stdout, stderr) => {
  if (error) {
    console.error('TypeScript compilation failed:', error);
    console.error('stdout:', stdout);
    console.error('stderr:', stderr);
    return;
  }
  
  console.log('TypeScript compilation successful!');
  console.log('stdout:', stdout);
});
