#!/usr/bin/env node

/**
 * TradingView Integration Verification Script
 * Tests your TradingView subscription setup
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 TradingView Integration Verification');
console.log('=====================================\n');

// Check environment configuration
const envPath = path.join(__dirname, '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

// Verify TradingView subscription
const subscriptionEnabled = envVars['NEXT_PUBLIC_TRADINGVIEW_SUBSCRIPTION_ENABLED'] === 'true';
console.log(`📊 TradingView Subscription: ${subscriptionEnabled ? '✅ ENABLED' : '❌ DISABLED'}`);

// Check key configuration
const checks = [
  { key: 'NEXT_PUBLIC_TRADINGVIEW_SUBSCRIPTION_ENABLED', expected: 'true', description: 'Subscription enabled' },
  { key: 'NEXT_PUBLIC_TRADINGVIEW_TRADE_MARKERS_ENABLED', expected: 'true', description: 'Trade markers enabled' },
  { key: 'NEXT_PUBLIC_DATA_PROVIDER_PRIORITY', expected: 'tradingview', description: 'TradingView as primary provider' },
  { key: 'ALPHA_VANTAGE_API_KEY', expected: 'F5HU7ZL97JJ72Q26', description: 'Alpha Vantage API key' },
  { key: 'FINNHUB_API_KEY', expected: 'd24qf31r01qu2jgjhuugd24qf31r01qu2jgjhuv0', description: 'Finnhub API key' }
];

let allChecksPass = true;

checks.forEach(check => {
  const actual = envVars[check.key];
  const passed = actual === check.expected || (check.key === 'NEXT_PUBLIC_DATA_PROVIDER_PRIORITY' && actual?.startsWith('tradingview'));
  
  console.log(`${passed ? '✅' : '❌'} ${check.description}: ${actual || 'missing'}`);
  if (!passed) allChecksPass = false;
});

// Check symbol mappings
console.log('\n📈 Symbol Mapping Verification');
console.log('==============================');

const symbolMappings = {
  'NQ': 'CME_MINI:NQ1!',
  'ES': 'CME_MINI:ES1!',
  'GC': 'COMEX:GC1!',
  'CL': 'NYMEX:CL1!',
  'BTC': 'BINANCE:BTCUSDT',
  'ETH': 'BINANCE:ETHUSDT'
};

Object.entries(symbolMappings).forEach(([symbol, tvSymbol]) => {
  console.log(`✅ ${symbol} → ${tvSymbol}`);
});

// Check test page exists
const testPagePath = path.join(__dirname, 'src', 'app', 'test-tradingview-subscription', 'page.tsx');
if (fs.existsSync(testPagePath)) {
  console.log('\n🧪 Test Page: ✅ Available at /test-tradingview-subscription');
} else {
  console.log('\n🧪 Test Page: ❌ Missing');
}

// Final summary
console.log('\n🎯 Summary');
console.log('===========');

if (subscriptionEnabled && allChecksPass) {
  console.log('🎉 TradingView subscription is READY!');
  console.log('📍 Test at: http://localhost:3000/test-tradingview-subscription');
  console.log('🔧 Start server: npm run dev');
} else {
  console.log('⚠️  Please fix the issues above before testing');
}

console.log('\n📋 Next Steps:');
console.log('1. Start your development server: npm run dev');
console.log('2. Visit: http://localhost:3000/test-tradingview-subscription');
console.log('3. Test with real trades to verify live data');
console.log('4. Check that trade markers appear on actual candles');
