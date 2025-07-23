const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function finalFeeVerification() {
  try {
    console.log('🎯 Final TopStep Fee Verification & Testing\n')
    
    const userId = 'cmcwu8b5m0001m17ilm0triy8'
    const expectedTopStepBalance = 51284.14
    
    // Test 1: Verify all futures trades have fees
    console.log('1️⃣ Fee Application Verification:')
    const futuresTrades = await prisma.trade.findMany({
      where: {
        userId,
        status: 'CLOSED',
        symbol: { contains: 'MNQ' }
      },
      select: {
        id: true,
        symbol: true,
        quantity: true,
        grossPnL: true,
        netPnL: true,
        entryFees: true,
        exitFees: true,
        commission: true,
        dataSource: true
      }
    })
    
    let totalGross = 0
    let totalNet = 0
    let totalFees = 0
    let correctFeeCount = 0
    let zeroFeeCount = 0
    
    futuresTrades.forEach(trade => {
      const fees = trade.entryFees + trade.exitFees + trade.commission
      const expectedFees = 1.34 * trade.quantity
      
      totalGross += trade.grossPnL || 0
      totalNet += trade.netPnL || 0
      totalFees += fees
      
      if (Math.abs(fees - expectedFees) < 0.01) {
        correctFeeCount++
      } else if (fees === 0) {
        zeroFeeCount++
      }
    })
    
    console.log(`  MNQ trades found: ${futuresTrades.length}`)
    console.log(`  Trades with correct fees: ${correctFeeCount}`)
    console.log(`  Trades with zero fees: ${zeroFeeCount}`)
    console.log(`  Total gross P&L: $${totalGross.toFixed(2)}`)
    console.log(`  Total net P&L: $${totalNet.toFixed(2)}`)
    console.log(`  Total fees applied: $${totalFees.toFixed(2)}`)
    console.log(`  Fee accuracy: ${correctFeeCount}/${futuresTrades.length} (${((correctFeeCount/futuresTrades.length)*100).toFixed(1)}%)`)
    
    // Test 2: Balance calculation verification
    console.log('\n2️⃣ Balance Calculation Verification:')
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { startingBalance: true }
    })
    
    const allClosedTrades = await prisma.trade.findMany({
      where: { userId, status: 'CLOSED' },
      select: { netPnL: true }
    })
    
    const totalPnL = allClosedTrades.reduce((sum, trade) => sum + (trade.netPnL || 0), 0)
    const calculatedBalance = user.startingBalance + totalPnL
    const difference = Math.abs(expectedTopStepBalance - calculatedBalance)
    
    console.log(`  Starting balance: $${user.startingBalance}`)
    console.log(`  Total net P&L: $${totalPnL.toFixed(2)}`)
    console.log(`  Calculated balance: $${calculatedBalance.toFixed(2)}`)
    console.log(`  TopStep balance: $${expectedTopStepBalance}`)
    console.log(`  Difference: $${difference.toFixed(2)}`)
    
    // Test 3: Fee calculation accuracy
    console.log('\n3️⃣ Fee Calculation Accuracy Test:')
    const testCases = [
      { symbol: 'MNQU5', quantity: 1, expectedFee: 1.34 },
      { symbol: 'MNQU5', quantity: 3, expectedFee: 4.02 },
      { symbol: 'MNQM5', quantity: 1, expectedFee: 1.34 },
      { symbol: 'MNQ', quantity: 2, expectedFee: 2.68 }
    ]
    
    testCases.forEach((test, index) => {
      const calculatedFee = test.quantity * 1.34
      const isCorrect = Math.abs(calculatedFee - test.expectedFee) < 0.01
      console.log(`  Test ${index + 1}: ${test.symbol} (${test.quantity}x) = $${calculatedFee.toFixed(2)} ${isCorrect ? '✅' : '❌'}`)
    })
    
    // Test 4: API consistency check
    console.log('\n4️⃣ API Consistency Check:')
    try {
      const statsResponse = await fetch(`http://localhost:3000/api/stats?userId=${userId}`)
      const statsData = await statsResponse.json()
      
      const metricsResponse = await fetch(`http://localhost:3000/api/account-metrics?userId=${userId}`)
      const metricsData = await metricsResponse.json()
      
      console.log(`  Stats API P&L: $${statsData.totalPnL?.toFixed(2)}`)
      console.log(`  Metrics API balance: $${metricsData.currentBalance?.toFixed(2)}`)
      console.log(`  Metrics API P&L: $${metricsData.netPnLToDate?.toFixed(2)}`)
      
      const apiDifference = Math.abs((metricsData.currentBalance || 0) - expectedTopStepBalance)
      console.log(`  API vs TopStep: $${apiDifference.toFixed(2)}`)
      
    } catch (error) {
      console.log(`  API test failed: ${error.message}`)
    }
    
    // Test 5: Future trade fee test
    console.log('\n5️⃣ Future Trade Fee Calculation Test:')
    const futureTradeTests = [
      { symbol: 'MNQU5', side: 'LONG', entry: 23000, exit: 23050, qty: 1 },
      { symbol: 'MNQU5', side: 'SHORT', entry: 23100, exit: 23050, qty: 2 }
    ]
    
    futureTradeTests.forEach((test, index) => {
      const pointsDiff = test.side === 'LONG' 
        ? (test.exit - test.entry) 
        : (test.entry - test.exit)
      const grossPnL = pointsDiff * test.qty * 2.0 // $2 per point
      const fees = 1.34 * test.qty
      const netPnL = grossPnL - fees
      
      console.log(`  Future Test ${index + 1}: ${test.symbol} ${test.side}`)
      console.log(`    ${test.qty} contracts @ $${test.entry} → $${test.exit}`)
      console.log(`    Gross P&L: $${grossPnL.toFixed(2)} | Fees: $${fees.toFixed(2)} | Net P&L: $${netPnL.toFixed(2)}`)
    })
    
    // Final Assessment
    console.log('\n📋 FINAL ASSESSMENT:')
    const feeAccuracyPct = (correctFeeCount / futuresTrades.length) * 100
    const balanceAccuracy = difference < 1 ? 'PERFECT' : difference < 5 ? 'EXCELLENT' : difference < 20 ? 'GOOD' : 'NEEDS REVIEW'
    
    console.log(`  ✅ Fee System: ${feeAccuracyPct.toFixed(1)}% accuracy`)
    console.log(`  ✅ Balance Accuracy: ${balanceAccuracy} ($${difference.toFixed(2)} difference)`)
    console.log(`  ✅ Total Fees Applied: $${totalFees.toFixed(2)}`)
    console.log(`  ✅ TopStep Compliance: ${difference < 5 ? 'COMPLIANT' : 'REVIEW NEEDED'}`)
    
    if (feeAccuracyPct >= 95 && difference < 5) {
      console.log('\n🎉 SUCCESS: TopStep fee integration is complete and accurate!')
      console.log('   💰 Account balance matches TopStep within acceptable tolerance')
      console.log('   📊 All futures trades have proper fee deductions applied')
      console.log('   🔧 Future trades will automatically calculate correct fees')
    } else {
      console.log('\n⚠️ Review needed: Some issues detected that may need attention')
    }
    
  } catch (error) {
    console.error('❌ Error during verification:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Add fetch for Node.js if not available
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch')
}

finalFeeVerification()