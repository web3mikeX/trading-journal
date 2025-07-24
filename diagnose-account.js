const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function diagnoseAccount() {
  try {
    console.log('🔍 Diagnosing Account Configuration...\n')
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        accountType: true,
        startingBalance: true,
        currentAccountHigh: true,
        trailingDrawdownAmount: true,
        dailyLossLimit: true,
        isLiveFunded: true,
        firstPayoutReceived: true,
        accountStartDate: true,
        _count: {
          select: {
            trades: true
          }
        }
      }
    })
    
    console.log(`Found ${users.length} users:`)
    users.forEach((user, index) => {
      console.log(`\n📊 User ${index + 1}:`)
      console.log(`  ID: ${user.id}`)
      console.log(`  Email: ${user.email}`)
      console.log(`  Account Type: ${user.accountType}`)
      console.log(`  Starting Balance: $${user.startingBalance || 'Not set'}`)
      console.log(`  Current Account High: $${user.currentAccountHigh || 'Not set'}`)
      console.log(`  Trailing Drawdown: $${user.trailingDrawdownAmount || 'Not set'}`)
      console.log(`  Daily Loss Limit: $${user.dailyLossLimit || 'Not set'}`)
      console.log(`  Live Funded: ${user.isLiveFunded}`)
      console.log(`  First Payout Received: ${user.firstPayoutReceived}`)
      console.log(`  Account Start Date: ${user.accountStartDate || 'Not set'}`)
      console.log(`  Total Trades: ${user._count.trades}`)
    })
    
    // Get trade summary for main user
    if (users.length > 0) {
      const mainUser = users[0] // Assuming first user is the main user
      
      console.log(`\n💰 Trade Analysis for ${mainUser.email}:`)
      
      const trades = await prisma.trade.findMany({
        where: { userId: mainUser.id },
        select: {
          id: true,
          symbol: true,
          entryDate: true,
          exitDate: true,
          entryPrice: true,
          exitPrice: true,
          quantity: true,
          side: true,
          netPnL: true,
          status: true,
          dataSource: true
        },
        orderBy: { entryDate: 'desc' }
      })
      
      console.log(`  Total trades in DB: ${trades.length}`)
      
      const closedTrades = trades.filter(t => t.status === 'CLOSED')
      const totalPnL = closedTrades.reduce((sum, trade) => sum + (trade.netPnL || 0), 0)
      
      console.log(`  Closed trades: ${closedTrades.length}`)
      console.log(`  Total P&L: $${totalPnL.toFixed(2)}`)
      
      if (mainUser.startingBalance) {
        const calculatedBalance = mainUser.startingBalance + totalPnL
        console.log(`  Calculated Balance: $${calculatedBalance.toFixed(2)}`)
        console.log(`  Expected Balance (TopStep): $51,284.14`)
        console.log(`  Difference: $${(51284.14 - calculatedBalance).toFixed(2)}`)
      }
      
      // Show recent trades
      console.log(`\n📈 Recent trades (last 5):`)
      trades.slice(0, 5).forEach((trade, index) => {
        console.log(`  ${index + 1}. ${trade.symbol} ${trade.side} - Entry: $${trade.entryPrice} | Exit: $${trade.exitPrice} | P&L: $${trade.netPnL || 'Open'} | Status: ${trade.status}`)
      })
      
      // Check for MNQU5 trades specifically
      const mnqu5Trades = trades.filter(t => t.symbol === 'MNQU5')
      console.log(`\n🎯 MNQU5 trades: ${mnqu5Trades.length}`)
      
      if (mnqu5Trades.length > 0) {
        const mnqu5PnL = mnqu5Trades
          .filter(t => t.status === 'CLOSED')
          .reduce((sum, trade) => sum + (trade.netPnL || 0), 0)
        console.log(`  MNQU5 Total P&L: $${mnqu5PnL.toFixed(2)}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

diagnoseAccount()