const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function applyTopStepFees() {
  try {
    console.log('🔧 Applying TopStep fees to existing MNQU5 trades...\n')
    
    const userId = 'cmcwu8b5m0001m17ilm0triy8'
    
    // Get user account type
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        accountType: true,
        startingBalance: true
      }
    })
    
    if (!user) {
      console.log('❌ User not found')
      return
    }
    
    console.log(`👤 User Account Type: ${user.accountType}`)
    console.log(`💰 Starting Balance: $${user.startingBalance}\n`)
    
    // Get all MNQU5 trades that currently have zero fees
    const trades = await prisma.trade.findMany({
      where: {
        userId: userId,
        symbol: 'MNQU5',
        status: 'CLOSED'
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
    
    console.log(`📊 Found ${trades.length} MNQU5 trades to process\n`)
    
    if (trades.length === 0) {
      console.log('ℹ️ No MNQU5 trades found to update')
      return
    }
    
    // TopStep fee structure for MNQU5: $1.34 per round-turn contract
    const TOPSTEP_MNQU5_FEE = 1.34
    const ENTRY_FEE = 0.67  // Half of round-turn fee
    const EXIT_FEE = 0.67   // Half of round-turn fee
    
    let totalFeesApplied = 0
    let totalGrossPnL = 0
    let totalNewNetPnL = 0
    let tradesUpdated = 0
    
    console.log('🔄 Processing trades...\n')
    
    for (const trade of trades) {
      const currentTotalFees = trade.entryFees + trade.exitFees + trade.commission + trade.swap
      
      console.log(`Trade ${trade.id.substring(0, 8)}...`)
      console.log(`  Symbol: ${trade.symbol} ${trade.side}`)
      console.log(`  Quantity: ${trade.quantity} contracts`)
      console.log(`  Entry: $${trade.entryPrice} | Exit: $${trade.exitPrice}`)
      console.log(`  Current Gross P&L: $${trade.grossPnL || 'N/A'}`)
      console.log(`  Current Net P&L: $${trade.netPnL || 'N/A'}`)
      console.log(`  Current Total Fees: $${currentTotalFees.toFixed(2)}`)
      
      // Calculate the gross P&L if not stored
      let grossPnL = trade.grossPnL
      if (!grossPnL && trade.entryPrice && trade.exitPrice) {
        const pointsDiff = trade.side === 'LONG' 
          ? (trade.exitPrice - trade.entryPrice)
          : (trade.entryPrice - trade.exitPrice)
        grossPnL = pointsDiff * trade.quantity * 2.0 // $2 per point for MNQU5
      }
      
      // Calculate TopStep fees
      const totalFees = TOPSTEP_MNQU5_FEE * trade.quantity
      const entryFees = ENTRY_FEE * trade.quantity
      const exitFees = EXIT_FEE * trade.quantity
      
      // Calculate new net P&L
      const newNetPnL = grossPnL - totalFees
      
      console.log(`  📈 Calculated Gross P&L: $${grossPnL?.toFixed(2)}`)
      console.log(`  💸 TopStep Fees ($${TOPSTEP_MNQU5_FEE}/contract): $${totalFees.toFixed(2)}`)
      console.log(`  📉 New Net P&L: $${newNetPnL?.toFixed(2)}`)
      console.log(`  📊 Impact: ${newNetPnL < (trade.netPnL || 0) ? '-' : '+'}$${Math.abs((newNetPnL || 0) - (trade.netPnL || 0)).toFixed(2)}\n`)
      
      // Update the trade in database
      await prisma.trade.update({
        where: { id: trade.id },
        data: {
          grossPnL: grossPnL,
          netPnL: newNetPnL,
          entryFees: entryFees,
          exitFees: exitFees,
          commission: totalFees,
          swap: 0, // Reset swap to 0 since we're using commission field for total fees
          updatedAt: new Date()
        }
      })
      
      totalFeesApplied += totalFees
      totalGrossPnL += grossPnL || 0
      totalNewNetPnL += newNetPnL || 0
      tradesUpdated++
    }
    
    console.log('\n📋 SUMMARY:')
    console.log(`  Trades Updated: ${tradesUpdated}`)
    console.log(`  Total Gross P&L: $${totalGrossPnL.toFixed(2)}`)
    console.log(`  Total Fees Applied: $${totalFeesApplied.toFixed(2)}`)
    console.log(`  Total New Net P&L: $${totalNewNetPnL.toFixed(2)}`)
    console.log(`  Fee Impact: -$${totalFeesApplied.toFixed(2)}`)
    
    // Calculate new account balance
    const newAccountBalance = user.startingBalance + totalNewNetPnL
    console.log(`\n💰 ACCOUNT IMPACT:`)
    console.log(`  Starting Balance: $${user.startingBalance}`)
    console.log(`  New Calculated Balance: $${newAccountBalance.toFixed(2)}`)
    console.log(`  TopStep Expected Balance: $51,284.14`)
    console.log(`  Difference: $${(51284.14 - newAccountBalance).toFixed(2)}`)
    
    if (Math.abs(51284.14 - newAccountBalance) < 5) {
      console.log(`  ✅ EXCELLENT: Balance matches TopStep within $5!`)
    } else if (Math.abs(51284.14 - newAccountBalance) < 20) {
      console.log(`  ✅ GOOD: Balance matches TopStep within $20`)
    } else {
      console.log(`  ⚠️ REVIEW NEEDED: Difference is significant`)
    }
    
    console.log('\n🎉 TopStep fees successfully applied to all MNQU5 trades!')
    
  } catch (error) {
    console.error('❌ Error applying TopStep fees:', error)
  } finally {
    await prisma.$disconnect()
  }
}

applyTopStepFees()