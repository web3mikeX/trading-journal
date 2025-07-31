const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const userId = 'cmcwu8b5m0001m17ilm0triy8'

async function addTopStepAdjustment() {
  try {
    console.log('🎯 ADDING TOPSTEP ADJUSTMENT')
    console.log('============================\n')

    // Current CSV total vs TopStep total
    const csvTotal = 1227.50
    const topstepTotal = 1177.92
    const adjustment = topstepTotal - csvTotal

    console.log(`CSV Total: $${csvTotal}`)
    console.log(`TopStep Account Total: $${topstepTotal}`)
    console.log(`Required Adjustment: $${adjustment.toFixed(2)}`)

    // Add adjustment entry as a manual trade
    const adjustmentEntry = {
      userId,
      symbol: 'TOPSTEP_ADJUSTMENT',
      side: 'ADJUSTMENT',
      entryDate: new Date('2025-07-25T23:59:59.000Z'), // End of July 25
      exitDate: new Date('2025-07-25T23:59:59.000Z'),
      entryPrice: 0,
      exitPrice: 0,
      quantity: 1,
      market: 'ADJUSTMENT',
      grossPnL: adjustment,
      netPnL: adjustment,
      commission: 0,
      entryFees: 0,
      exitFees: 0,
      swap: 0,
      contractMultiplier: 1,
      status: 'CLOSED',
      dataSource: 'topstep_account_adjustment',
      notes: 'Adjustment to match TopStep account total exactly'
    }

    // Create the adjustment entry
    await prisma.trade.create({ data: adjustmentEntry })
    console.log('✅ Adjustment entry created')

    // Update account balance to match TopStep exactly
    const finalBalance = 50000 + topstepTotal
    const dailyLossLimit = finalBalance - 1000

    await prisma.user.update({
      where: { id: userId },
      data: {
        accountBalance: finalBalance,
        currentAccountHigh: Math.max(50000, finalBalance)
      }
    })

    console.log(`✅ Account balance updated to $${finalBalance.toFixed(2)}`)
    console.log(`✅ Daily loss limit: $${dailyLossLimit.toFixed(2)}`)

    // Verify final totals
    const dbStats = await prisma.trade.aggregate({
      where: { userId },
      _sum: {
        netPnL: true,
        grossPnL: true
      },
      _count: true
    })

    console.log('\n📊 FINAL VERIFICATION:')
    console.log('======================')
    console.log(`Database Net P&L: $${(dbStats._sum.netPnL || 0).toFixed(2)}`)
    console.log(`Database Gross P&L: $${(dbStats._sum.grossPnL || 0).toFixed(2)}`)
    console.log(`Total Records: ${dbStats._count}`)
    console.log(`Final Account Balance: $${finalBalance.toFixed(2)}`)
    console.log(`Daily Loss Limit: $${dailyLossLimit.toFixed(2)}`)

    const matches = Math.abs((dbStats._sum.netPnL || 0) - topstepTotal) < 0.01
    console.log(`\n${matches ? '✅' : '❌'} Matches TopStep: ${matches}`)

    if (matches) {
      console.log('\n🎉 SUCCESS!')
      console.log('============')
      console.log('Your trading journal now matches your TopStep account exactly!')
      console.log(`Total P&L: $${topstepTotal.toFixed(2)}`)
      console.log(`Account Balance: $${finalBalance.toFixed(2)}`)
      console.log(`Daily Loss Limit: $${dailyLossLimit.toFixed(2)}`)
    }

  } catch (error) {
    console.error('❌ Error adding adjustment:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addTopStepAdjustment()