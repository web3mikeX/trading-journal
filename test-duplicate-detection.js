// Test script for duplicate detection functionality
// Run with: node test-duplicate-detection.js

const BASE_URL = 'http://localhost:3000' // Change to your actual URL

// Test data
const testTrade = {
  userId: "cmcwu8b5m0001m17ilm0triy8", // Demo user ID
  symbol: "ES",
  side: "LONG",
  entryDate: new Date().toISOString(),
  entryPrice: 4500.50,
  quantity: 1,
  market: "FUTURES",
  dataSource: "test"
}

async function testDuplicateDetection() {
  console.log('🧪 Testing Duplicate Detection System\n')
  
  try {
    // Test 1: Import a trade
    console.log('1️⃣ Importing initial trade...')
    const response1 = await fetch(`${BASE_URL}/api/trades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testTrade)
    })
    
    const result1 = await response1.json()
    if (response1.ok) {
      console.log('✅ Trade imported successfully:', result1.id)
    } else {
      console.log('❌ Failed to import trade:', result1.error)
      return
    }
    
    // Test 2: Try to import the same trade (should detect duplicate)
    console.log('\n2️⃣ Attempting to import duplicate trade...')
    const response2 = await fetch(`${BASE_URL}/api/trades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testTrade)
    })
    
    const result2 = await response2.json()
    if (response2.status === 409) {
      console.log('✅ Duplicate detected correctly!')
      console.log('   Confidence:', result2.duplicateInfo.confidence)
      console.log('   Reason:', result2.duplicateInfo.reason)
      console.log('   Existing trade ID:', result2.duplicateInfo.existingTradeId)
    } else {
      console.log('❌ Duplicate detection failed - trade was imported when it should have been blocked')
    }
    
    // Test 3: Force import the duplicate
    console.log('\n3️⃣ Force importing duplicate...')
    const response3 = await fetch(`${BASE_URL}/api/trades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...testTrade,
        force: true,
        notes: "Force imported duplicate"
      })
    })
    
    const result3 = await response3.json()
    if (response3.ok) {
      console.log('✅ Duplicate force-imported successfully:', result3.id)
      console.log('   Marked as duplicate:', result3.isDuplicate)
    } else {
      console.log('❌ Failed to force import:', result3.error)
    }
    
    // Test 4: Test batch endpoint
    console.log('\n4️⃣ Testing batch import with duplicates...')
    const batchTrades = [
      testTrade, // This is a duplicate
      {
        ...testTrade,
        symbol: "NQ",
        entryPrice: 16000.25
      }, // This is new
      {
        ...testTrade,
        entryPrice: 4500.75, // Slightly different price
        quantity: 1.001 // Slightly different quantity
      } // This might be detected as similar
    ]
    
    const response4 = await fetch(`${BASE_URL}/api/trades/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trades: batchTrades,
        options: {
          validateOnly: true
        }
      })
    })
    
    const result4 = await response4.json()
    console.log('✅ Batch validation results:')
    console.log('   Total trades:', result4.totalTrades)
    console.log('   New trades:', result4.newTrades)
    console.log('   Duplicates:', result4.duplicates)
    if (result4.duplicateDetails) {
      result4.duplicateDetails.forEach((dup, index) => {
        console.log(`   Duplicate ${index + 1}:`, dup.duplicateInfo.confidence, '-', dup.duplicateInfo.reason)
      })
    }
    
    console.log('\n🎉 All tests completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testDuplicateDetection()