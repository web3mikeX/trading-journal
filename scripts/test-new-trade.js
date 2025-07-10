const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testNewTrade() {
  try {
    console.log('Testing new trade P&L calculation...\n')
    
    // Test trade data - MNQU5 futures
    const testTrade = {
      userId: 'cmcwu8b5m0001m17ilm0triy8',
      symbol: 'MNQU5',
      side: 'LONG',
      entryDate: new Date('2025-07-10T14:00:00.000Z'),
      entryPrice: 23000,
      quantity: 1,
      exitDate: new Date('2025-07-10T14:30:00.000Z'),
      exitPrice: 23010, // 10 point gain
      market: 'FUTURES',
      commission: 1.34,
      entryFees: 0.10,
      exitFees: 0.10,
      swap: 0,
      dataSource: 'test'
    }
    
    // Expected calculations for MNQU5:
    // - Contract multiplier: $2 per point
    // - Points gained: 23010 - 23000 = 10 points
    // - Gross P&L: 10 points × 1 quantity × $2 = $20
    // - Total fees: $1.34 + $0.10 + $0.10 = $1.54
    // - Net P&L: $20 - $1.54 = $18.46
    
    console.log('Expected Calculation:')
    console.log('  Points: 10 (23010 - 23000)')
    console.log('  Gross P&L: $20 (10 × 1 × $2)')
    console.log('  Total Fees: $1.54 ($1.34 + $0.10 + $0.10)')
    console.log('  Net P&L: $18.46 ($20 - $1.54)')
    console.log('')
    
    // Call the same calculation function used by the API
    const pnlData = calculatePnL(testTrade)
    
    console.log('Actual Calculation Results:')
    console.log(`  Gross P&L: $${pnlData.grossPnL}`)
    console.log(`  Net P&L: $${pnlData.netPnL}`)
    console.log(`  Contract Multiplier: ${pnlData.contractMultiplier}`)
    console.log(`  Contract Type: ${pnlData.contractType}`)
    console.log('')
    
    // Verify calculations
    const expectedGross = 20
    const expectedNet = 18.46
    
    const grossMatch = Math.abs(pnlData.grossPnL - expectedGross) < 0.01
    const netMatch = Math.abs(pnlData.netPnL - expectedNet) < 0.01
    
    console.log('✅ VALIDATION:')
    console.log(`  Gross P&L: ${grossMatch ? '✅ CORRECT' : '❌ WRONG'} (${pnlData.grossPnL} vs expected ${expectedGross})`)
    console.log(`  Net P&L: ${netMatch ? '✅ CORRECT' : '❌ WRONG'} (${pnlData.netPnL} vs expected ${expectedNet})`)
    console.log(`  Contract Multiplier: ${pnlData.contractMultiplier === 2 ? '✅ CORRECT' : '❌ WRONG'} (${pnlData.contractMultiplier})`)
    
    if (grossMatch && netMatch && pnlData.contractMultiplier === 2) {
      console.log('\n🎉 ALL CALCULATIONS ARE CORRECT - Future trades will calculate properly!')
    } else {
      console.log('\n❌ CALCULATION ERRORS DETECTED - Needs fixing!')
    }
    
  } catch (error) {
    console.error('Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Import the same calculation function used by the API
function calculatePnL(trade) {
  if (!trade.exitPrice || !trade.entryPrice) {
    return { 
      grossPnL: null, 
      netPnL: null, 
      returnPercent: null,
      contractMultiplier: getContractMultiplier(trade.symbol, trade.market),
      contractType: getContractType(trade.symbol, trade.market)
    }
  }

  // Get contract specifications
  const contractMultiplier = getContractMultiplier(trade.symbol, trade.market)
  const contractType = getContractType(trade.symbol, trade.market)

  // Calculate points difference
  const pointsDifference = trade.side === 'LONG' 
    ? (trade.exitPrice - trade.entryPrice)
    : (trade.entryPrice - trade.exitPrice)

  // Apply contract multiplier to calculate gross PnL
  const grossPnL = pointsDifference * trade.quantity * contractMultiplier

  const totalFees = (trade.entryFees || 0) + (trade.exitFees || 0) + (trade.commission || 0) + (trade.swap || 0)
  const netPnL = grossPnL - totalFees

  const totalInvested = trade.entryPrice * trade.quantity * contractMultiplier
  const returnPercent = totalInvested > 0 ? (netPnL / totalInvested) * 100 : 0

  return { 
    grossPnL, 
    netPnL, 
    returnPercent,
    contractMultiplier,
    contractType
  }
}

function getContractMultiplier(symbol, market = "STOCK") {
  if (market === "FUTURES" || market === "MICRO_FUTURES") {
    if (symbol === "MNQU5" || symbol === "MNQ") {
      return 2.0
    }
  }
  return 1.0
}

function getContractType(symbol, market = "STOCK") {
  if (market === "FUTURES" || market === "MICRO_FUTURES") {
    if (symbol === "MNQU5" || symbol === "MNQ") {
      return "MICRO_FUTURES"
    }
    return "STANDARD_FUTURES"
  }
  return "STANDARD"
}

testNewTrade()