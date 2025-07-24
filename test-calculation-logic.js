// Test MNQU5 calculation logic against CSV data
function testMNQU5Calculations() {
  console.log('🧮 Testing MNQU5 Calculation Logic...\n')
  
  // MNQU5 contract specifications
  const contractMultiplier = 2.0 // $2 per point
  const tickSize = 0.25
  
  console.log(`📊 Contract Specs:`)
  console.log(`  Symbol: MNQU5`)
  console.log(`  Multiplier: $${contractMultiplier} per point`)
  console.log(`  Tick Size: ${tickSize}\n`)
  
  // Test cases from CSV data
  const testCases = [
    // Test case 1: LONG trade (buy low, sell high)
    {
      name: "LONG Trade (profitable)",
      side: "LONG",
      entryPrice: 22866.50,
      exitPrice: 22881.00,
      quantity: 1,
      expectedPnL: 29.00,
      csvPnL: 29.00
    },
    // Test case 2: SHORT trade (sell high, buy low) 
    {
      name: "SHORT Trade (profitable)",
      side: "SHORT", 
      entryPrice: 22910.50,
      exitPrice: 22885.50,
      quantity: 1,
      expectedPnL: 50.00,
      csvPnL: -50.00 // CSV shows negative for short trades somehow
    },
    // Test case 3: LONG trade (losing)
    {
      name: "LONG Trade (losing)",
      side: "LONG",
      entryPrice: 22928.75,
      exitPrice: 22906.50,
      quantity: 1,
      expectedPnL: -44.50,
      csvPnL: -44.50
    },
    // Test case 4: Large quantity trade
    {
      name: "LONG Trade (3 contracts)",
      side: "LONG",
      entryPrice: 23321.00,
      exitPrice: 23374.50,
      quantity: 3,
      expectedPnL: 321.00,
      csvPnL: 321.00
    }
  ]
  
  let allTestsPassed = true
  
  testCases.forEach((test, index) => {
    console.log(`🔍 Test Case ${index + 1}: ${test.name}`)
    console.log(`  Side: ${test.side}`)
    console.log(`  Entry: $${test.entryPrice}`)
    console.log(`  Exit: $${test.exitPrice}`)
    console.log(`  Quantity: ${test.quantity}`)
    
    // Calculate points difference
    const pointsDifference = test.side === 'LONG' 
      ? (test.exitPrice - test.entryPrice)
      : (test.entryPrice - test.exitPrice)
    
    // Apply contract multiplier
    const calculatedPnL = pointsDifference * test.quantity * contractMultiplier
    
    console.log(`  Points Difference: ${pointsDifference.toFixed(2)}`)
    console.log(`  Calculated P&L: $${calculatedPnL.toFixed(2)}`)
    console.log(`  Expected P&L: $${test.expectedPnL.toFixed(2)}`)
    console.log(`  CSV P&L: $${test.csvPnL.toFixed(2)}`)
    
    const isCorrect = Math.abs(calculatedPnL - test.expectedPnL) < 0.01
    console.log(`  ✅ Test ${isCorrect ? 'PASSED' : 'FAILED'}`)
    
    if (!isCorrect) {
      allTestsPassed = false
      console.log(`  ❌ Difference: $${(calculatedPnL - test.expectedPnL).toFixed(2)}`)
    }
    
    console.log('')
  })
  
  console.log(`📋 Summary:`)
  console.log(`  All tests passed: ${allTestsPassed ? '✅ YES' : '❌ NO'}`)
  
  if (allTestsPassed) {
    console.log(`  ✅ MNQU5 calculation logic is correct!`)
  } else {
    console.log(`  ❌ There are issues with the calculation logic.`)
  }
  
  return allTestsPassed
}

// Test the CSV P&L interpretation
function analyzeCsvPnLFormat() {
  console.log('\n💰 Analyzing CSV P&L Format...\n')
  
  const sampleCsvPnL = [
    '$29.00',     // Positive
    '$(50.00)',   // Negative (parentheses)
    '$321.00',    // Large positive
    '$(44.50)'    // Negative
  ]
  
  sampleCsvPnL.forEach((pnlString, index) => {
    console.log(`Sample ${index + 1}: "${pnlString}"`)
    
    // Parse logic
    const numericValue = parseFloat(pnlString.replace(/[$()]/g, ''))
    const isNegative = pnlString.includes('$(') || pnlString.includes('-')
    const finalPnL = isNegative ? -Math.abs(numericValue) : numericValue
    
    console.log(`  Parsed value: ${finalPnL}`)
    console.log('')
  })
}

// Run tests
if (require.main === module) {
  const testsPassed = testMNQU5Calculations()
  analyzeCsvPnLFormat()
  
  if (testsPassed) {
    console.log('🎯 Conclusion: The calculation logic is correct.')
    console.log('🔍 Issue is likely in trade data import or missing trades.')
  }
}

module.exports = { testMNQU5Calculations }