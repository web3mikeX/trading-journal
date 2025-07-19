const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testAllCalculations() {
  try {
    console.log('🧮 Testing all P&L calculation consistency...\n')
    
    // Test 1: Create a new trade and verify calculations
    console.log('=== TEST 1: Create New Trade ===')
    const newTradeData = {
      userId: 'cmcwu8b5m0001m17ilm0triy8',
      symbol: 'MNQU5',
      side: 'LONG',
      entryDate: new Date('2025-07-11T10:00:00.000Z'),
      entryPrice: 23000,
      quantity: 1,
      exitDate: new Date('2025-07-11T10:05:00.000Z'),
      exitPrice: 23010, // 10 point gain
      market: 'FUTURES',
      commission: 1.34,
      entryFees: 0.05,
      exitFees: 0.05,
      swap: 0,
      dataSource: 'test'
    }
    
    // Expected: 10 points × 1 qty × $2 multiplier = $20 gross, $20 - $1.44 fees = $18.56 net
    console.log('Expected Results:')
    console.log('  Gross P&L: $20 (10 points × 1 × $2)')
    console.log('  Total Fees: $1.44 ($1.34 + $0.05 + $0.05)')
    console.log('  Net P&L: $18.56 ($20 - $1.44)')
    console.log('  Return %: 0.0403% ($18.56 / $46,000 invested)')
    console.log('')
    
    // Create via API simulation
    const response = await fetch('http://localhost:3000/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTradeData)
    })
    
    if (!response.ok) {
      console.log('❌ API not available, testing with direct calculation...')
      
      // Test the calculation logic directly
      const { calculatePnL } = require('./test-calculation-logic')
      const result = calculatePnL(newTradeData)
      
      console.log('Direct Calculation Results:')
      console.log(`  Gross P&L: $${result.grossPnL}`)
      console.log(`  Net P&L: $${result.netPnL}`)
      console.log(`  Return %: ${result.returnPercent?.toFixed(4)}%`)
      console.log(`  Contract Multiplier: ${result.contractMultiplier}`)
      console.log('')
      
      // Validation
      const expectedGross = 20
      const expectedNet = 18.56
      const expectedReturn = 0.0403
      
      const grossOK = Math.abs(result.grossPnL - expectedGross) < 0.01
      const netOK = Math.abs(result.netPnL - expectedNet) < 0.01
      const returnOK = Math.abs(result.returnPercent - expectedReturn) < 0.01
      
      console.log('✅ VALIDATION:')
      console.log(`  Gross P&L: ${grossOK ? '✅' : '❌'} (${result.grossPnL} vs ${expectedGross})`)
      console.log(`  Net P&L: ${netOK ? '✅' : '❌'} (${result.netPnL} vs ${expectedNet})`)
      console.log(`  Return %: ${returnOK ? '✅' : '❌'} (${result.returnPercent?.toFixed(4)}% vs ${expectedReturn}%)`)
      console.log('')
    }
    
    // Test 2: Check existing July 10th data consistency
    console.log('=== TEST 2: Verify July 10th Data Consistency ===')
    const july10Trades = await prisma.trade.findMany({
      where: {
        entryDate: {
          gte: new Date('2025-07-10T00:00:00.000Z'),
          lt: new Date('2025-07-11T00:00:00.000Z')
        }
      },
      orderBy: { entryDate: 'asc' }
    })
    
    console.log(`Found ${july10Trades.length} trades on July 10th`)
    
    let totalGross = 0
    let totalCommission = 0
    let totalNet = 0
    let calculationErrors = 0
    
    july10Trades.forEach((trade, index) => {
      const expectedNet = trade.grossPnL - (trade.commission + trade.entryFees + trade.exitFees + trade.swap)
      const netDiff = Math.abs(trade.netPnL - expectedNet)
      
      if (netDiff > 0.01) {
        console.log(`❌ Trade ${index + 1}: Net P&L mismatch`)
        console.log(`    Stored: $${trade.netPnL}`)
        console.log(`    Expected: $${expectedNet}`)
        calculationErrors++
      }
      
      totalGross += trade.grossPnL || 0
      totalCommission += trade.commission || 0
      totalNet += trade.netPnL || 0
    })
    
    console.log(`Total Gross P&L: $${totalGross}`)
    console.log(`Total Commission: $${totalCommission}`)
    console.log(`Total Net P&L: $${totalNet}`)
    console.log(`Expected Total Net: $${totalGross - totalCommission}`)
    console.log(`Calculation Errors: ${calculationErrors}`)
    
    if (calculationErrors === 0 && Math.abs(totalNet - (totalGross - totalCommission)) < 0.01) {
      console.log('✅ July 10th data is consistent!')
    } else {
      console.log('❌ July 10th data has inconsistencies!')
    }
    console.log('')
    
    // Test 3: Contract multiplier validation
    console.log('=== TEST 3: Contract Multiplier Validation ===')
    const futuresTrades = await prisma.trade.findMany({
      where: {
        market: 'FUTURES'
      },
      take: 5
    })
    
    futuresTrades.forEach((trade, index) => {
      const expectedMultiplier = getExpectedMultiplier(trade.symbol)
      if (trade.contractMultiplier !== expectedMultiplier) {
        console.log(`❌ Trade ${index + 1} (${trade.symbol}):`)
        console.log(`    Stored multiplier: ${trade.contractMultiplier}`)
        console.log(`    Expected multiplier: ${expectedMultiplier}`)
      } else {
        console.log(`✅ Trade ${index + 1} (${trade.symbol}): Multiplier correct (${trade.contractMultiplier})`)
      }
    })
    
    console.log('\n🎉 Calculation consistency test completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

function getExpectedMultiplier(symbol) {
  if (symbol === 'MNQU5' || symbol === 'MNQ') return 2.0
  if (symbol === 'MES') return 5.0  
  if (symbol === 'MYM') return 0.5
  return 1.0
}

testAllCalculations()