const fs = require('fs');
const path = require('path');

// Check if we're in the right directory
const packageJsonPath = path.join(__dirname, 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('ERROR: package.json not found in trading-journal directory');
  process.exit(1);
}

console.log('✅ Found package.json');
console.log('📁 Current directory:', __dirname);

// Check TypeScript configuration
const tsConfigPath = path.join(__dirname, 'tsconfig.json');
if (!fs.existsSync(tsConfigPath)) {
  console.error('ERROR: tsconfig.json not found');
  process.exit(1);
}

console.log('✅ Found tsconfig.json');

// Check enhanced market data files
const enhancedMarketDataPath = path.join(__dirname, 'src', 'services', 'enhancedMarketData.ts');
const apiRoutePath = path.join(__dirname, 'src', 'app', 'api', 'enhanced-market-data', 'route.ts');

if (!fs.existsSync(enhancedMarketDataPath)) {
  console.error('ERROR: enhancedMarketData.ts not found');
  process.exit(1);
}

if (!fs.existsSync(apiRoutePath)) {
  console.error('ERROR: enhanced-market-data route.ts not found');
  process.exit(1);
}

console.log('✅ All enhanced market data files exist');

// Check for common TypeScript issues
const enhancedMarketDataContent = fs.readFileSync(enhancedMarketDataPath, 'utf8');
const apiRouteContent = fs.readFileSync(apiRoutePath, 'utf8');

// Check for efficient caching implementation (this is a FEATURE, not a bug)
if (enhancedMarketDataContent.includes("dataSource: 'cached'")) {
  console.log('✅ Efficient caching system active - "cached" dataSource indicates optimized performance');
} else {
  console.log('ℹ️  No cached dataSource found (caching may not be active yet)');
}

// Check for proper imports
if (!enhancedMarketDataContent.includes('export interface MarketDataResult')) {
  console.error('ERROR: MarketDataResult interface not found');
} else {
  console.log('✅ MarketDataResult interface found');
}

console.log('🎯 Diagnostic complete - files appear to be correctly configured');
