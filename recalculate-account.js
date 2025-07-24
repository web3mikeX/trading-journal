const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function recalculateAccount() {
  try {
    console.log('🔄 Recalculating account metrics...\n')
    
    const userId = 'cmcwu8b5m0001m17ilm0triy8'
    
    // Get current user settings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        startingBalance: true,
        currentAccountHigh: true,
        accountType: true,
        trailingDrawdownAmount: true,
        accountStartDate: true
      }
    })
    
    if (!user) {
      console.log('❌ User not found')
      return
    }
    
    console.log('📊 Current User Settings:')
    console.log(`  Starting Balance: $${user.startingBalance}`)
    console.log(`  Current Account High: $${user.currentAccountHigh || 'Not set'}`)
    console.log(`  Account Type: ${user.accountType}`)
    console.log(`  Trailing Drawdown: $${user.trailingDrawdownAmount}`)
    console.log(`  Account Start Date: ${user.accountStartDate}\n`)
    
    // Get all trades
    const allTrades = await prisma.trade.findMany({
      where: { userId },
      select: {
        id: true,
        symbol: true,
        entryDate: true,
        exitDate: true,
        netPnL: true,
        status: true,
        dataSource: true
      },
      orderBy: { entryDate: 'desc' }
    })
    
    const closedTrades = allTrades.filter(t => t.status === 'CLOSED')
    const totalPnL = closedTrades.reduce((sum, trade) => sum + (trade.netPnL || 0), 0)
    const currentBalance = user.startingBalance + totalPnL
    
    console.log('💰 Trade Summary:')
    console.log(`  Total trades: ${allTrades.length}`)
    console.log(`  Closed trades: ${closedTrades.length}`)
    console.log(`  Total P&L: $${totalPnL.toFixed(2)}`)
    console.log(`  Current Balance: $${currentBalance.toFixed(2)}\n`)
    
    // Calculate account high (highest balance reached)
    let runningBalance = user.startingBalance
    let accountHigh = user.startingBalance
    
    // Sort trades by entry date to calculate running balance
    const sortedTrades = closedTrades.sort((a, b) => new Date(a.entryDate) - new Date(b.entryDate))
    
    for (const trade of sortedTrades) {
      runningBalance += trade.netPnL || 0
      if (runningBalance > accountHigh) {
        accountHigh = runningBalance
      }
    }
    
    console.log('📈 Account High Calculation:')
    console.log(`  Calculated Account High: $${accountHigh.toFixed(2)}`)
    console.log(`  Current Balance: $${currentBalance.toFixed(2)}\n`)
    
    // Calculate trailing drawdown limit
    const trailingDrawdownAmount = user.trailingDrawdownAmount || 2000 // Default for 50K account
    const trailingLimit = accountHigh - trailingDrawdownAmount
    const trailingBuffer = currentBalance - trailingLimit
    
    console.log('🛡️ Risk Management:')
    console.log(`  Account High: $${accountHigh.toFixed(2)}`)
    console.log(`  Trailing Drawdown Amount: $${trailingDrawdownAmount}`)
    console.log(`  Trailing Limit: $${trailingLimit.toFixed(2)}`)
    console.log(`  Current Buffer: $${trailingBuffer.toFixed(2)}`)
    console.log(`  Within Limit: ${currentBalance >= trailingLimit ? '✅ YES' : '❌ NO'}\n`)
    
    // Update user account high if needed
    if (accountHigh > (user.currentAccountHigh || 0)) {
      console.log('🔄 Updating account high...')
      await prisma.user.update({
        where: { id: userId },
        data: {
          currentAccountHigh: accountHigh,
          lastEodCalculation: new Date()
        }
      })
      console.log(`  ✅ Account high updated to $${accountHigh.toFixed(2)}\n`)
    }
    
    // Show comparison with TopStep
    console.log('🎯 TopStep Comparison:')
    console.log(`  Our calculated balance: $${currentBalance.toFixed(2)}`)
    console.log(`  TopStep reported balance: $51,284.14`)
    console.log(`  Difference: $${(51284.14 - currentBalance).toFixed(2)}`)
    
    if (Math.abs(51284.14 - currentBalance) < 50) {
      console.log(`  ✅ EXCELLENT: Difference is within $50!`)
    } else if (Math.abs(51284.14 - currentBalance) < 100) {
      console.log(`  ⚠️ GOOD: Difference is within $100`)
    } else {
      console.log(`  ❌ NEEDS REVIEW: Difference is significant`)
    }
    
    // Show breakdown by source
    console.log('\n📋 Trade Sources:')
    const tradesBySource = {}
    closedTrades.forEach(trade => {
      const source = trade.dataSource || 'unknown'
      if (!tradesBySource[source]) {
        tradesBySource[source] = { count: 0, pnl: 0 }
      }
      tradesBySource[source].count++
      tradesBySource[source].pnl += trade.netPnL || 0
    })
    
    Object.entries(tradesBySource).forEach(([source, data]) => {
      console.log(`  ${source}: ${data.count} trades, $${data.pnl.toFixed(2)} P&L`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

recalculateAccount()