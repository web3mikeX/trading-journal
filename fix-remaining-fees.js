const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixRemainingFees() {
  try {
    console.log('🔧 Applying TopStep fees to remaining MNQ trades...\n')
    
    const userId = 'cmcwu8b5m0001m17ilm0triy8'
    
    // Get all MNQ-related trades that have zero fees
    const tradesNeedingFees = await prisma.trade.findMany({
      where: {
        userId: userId,
        status: 'CLOSED',
        AND: [
          {
            OR: [
              { entryFees: 0 },
              { exitFees: 0 },
              { commission: 0 }
            ]
          },
          {
            OR: [
              { symbol: { startsWith: 'MNQ' } },
              { symbol: { startsWith: 'MES' } },
              { symbol: { startsWith: 'MYM' } },
              { symbol: { startsWith: 'NQ' } },
              { symbol: { startsWith: 'ES' } },
              { symbol: { startsWith: 'YM' } }
            ]
          }
        ]
      },
      select: {
        id: true,
        symbol: true,
        side: true,
        entryPrice: true,
        exitPrice: true,
        quantity: true,
        grossPnL: true,
        netPnL: true,
        entryFees: true,
        exitFees: true,
        commission: true,
        swap: true,
        dataSource: true,
        entryDate: true
      },
      orderBy: { entryDate: 'desc' }
    })
    
    console.log(`📊 Found ${tradesNeedingFees.length} trades needing fee updates\n`)
    
    if (tradesNeedingFees.length === 0) {
      console.log('✅ All trades already have fees applied!')
      return
    }
    
    const TOPSTEP_MNQ_FEE = 1.34  // TopStep fee for micro futures
    const ENTRY_FEE = 0.67
    const EXIT_FEE = 0.67
    
    let totalFeesApplied = 0
    let totalAdjustment = 0
    
    for (const trade of tradesNeedingFees) {
      const currentTotalFees = trade.entryFees + trade.exitFees + trade.commission + trade.swap
      
      console.log(`Trade ${trade.id.substring(0, 8)}... ${trade.symbol}`)
      console.log(`  Current fees: $${currentTotalFees.toFixed(2)}`)
      console.log(`  Current Net P&L: $${trade.netPnL || 0}`)
      
      // Calculate TopStep fees
      const totalFees = TOPSTEP_MNQ_FEE * trade.quantity
      const entryFees = ENTRY_FEE * trade.quantity
      const exitFees = EXIT_FEE * trade.quantity
      
      // Calculate new net P&L
      const grossPnL = trade.grossPnL || trade.netPnL || 0
      const newNetPnL = grossPnL - totalFees
      const adjustment = newNetPnL - (trade.netPnL || 0)
      
      console.log(`  Applied fees: $${totalFees.toFixed(2)}`)
      console.log(`  New Net P&L: $${newNetPnL.toFixed(2)}`)
      console.log(`  Adjustment: $${adjustment.toFixed(2)}`)
      
      // Update the trade
      await prisma.trade.update({
        where: { id: trade.id },
        data: {
          grossPnL: grossPnL,
          netPnL: newNetPnL,
          entryFees: entryFees,
          exitFees: exitFees,
          commission: totalFees,
          swap: 0,
          updatedAt: new Date()
        }
      })
      
      totalFeesApplied += totalFees
      totalAdjustment += adjustment
      console.log('')
    }
    
    console.log('📋 Summary:')
    console.log(`  Trades updated: ${tradesNeedingFees.length}`)
    console.log(`  Total fees applied: $${totalFeesApplied.toFixed(2)}`)
    console.log(`  Total P&L adjustment: $${totalAdjustment.toFixed(2)}`)
    
    // Recalculate final balance
    const allTrades = await prisma.trade.findMany({
      where: { userId, status: 'CLOSED' },
      select: { netPnL: true }
    })
    
    const totalNetPnL = allTrades.reduce((sum, trade) => sum + (trade.netPnL || 0), 0)
    const finalBalance = 50000 + totalNetPnL
    
    console.log(`\n💰 Final Balance Check:`)
    console.log(`  Starting balance: $50,000`)
    console.log(`  Total Net P&L: $${totalNetPnL.toFixed(2)}`)
    console.log(`  Final balance: $${finalBalance.toFixed(2)}`)
    console.log(`  TopStep balance: $51,284.14`)
    console.log(`  Difference: $${(51284.14 - finalBalance).toFixed(2)}`)
    
    if (Math.abs(51284.14 - finalBalance) < 1) {
      console.log(`  ✅ PERFECT MATCH!`)
    } else if (Math.abs(51284.14 - finalBalance) < 5) {
      console.log(`  ✅ EXCELLENT: Within $5`)
    } else {
      console.log(`  ⚠️ Review needed`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixRemainingFees()