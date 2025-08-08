/**
 * Test TradingView Lightweight Charts library import
 */

async function testLibraryImport() {
  console.log('🧪 Testing TradingView Library Import...\n')
  
  try {
    // Test dynamic import
    console.log('1. Testing dynamic import...')
    const module = await import('lightweight-charts')
    
    console.log('2. Module loaded successfully:')
    console.log('   - createChart:', typeof module.createChart)
    console.log('   - LineStyle:', !!module.LineStyle)
    console.log('   - CrosshairMode:', !!module.CrosshairMode)
    console.log('   - Available exports:', Object.keys(module).slice(0, 10))
    
    // Test chart creation
    console.log('\n3. Testing chart creation...')
    if (typeof module.createChart === 'function') {
      console.log('   - createChart function is available ✅')
      
      // Test minimal chart creation (this would fail in Node.js but we can check the function)
      console.log('   - Function signature:', module.createChart.toString().substring(0, 100) + '...')
    } else {
      console.log('   - createChart function is NOT available ❌')
    }
    
    console.log('\n✅ Library import test completed successfully!')
    
  } catch (error) {
    console.error('❌ Library import failed:', error.message)
    console.error('   Error details:', error)
  }
}

// Run the test
testLibraryImport()