const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function verifyAllFees() {
  try {
    console.log('🔍 Verifying all trade fees...\n')
    
    const userId = 'cmcwu8b5m0001m17ilm0triy8'
    
    // Get all trades
    const allTrades = await prisma.trade.findMany({
      where: { userId },
      select: {
        id: true,
        symbol: true,
        side: true,
        quantity: true,
        grossPnL: true,
        netPnL: true,
        entryFees: true,
        exitFees: true,
        commission: true,
        swap: true,
        dataSource: true,
        status: true,
        entryDate: true
      },
      orderBy: { entryDate: 'desc' }
    })
    
    console.log(`📊 Total trades: ${allTrades.length}\n`)
    
    let totalGross = 0
    let totalNet = 0
    let totalFees = 0
    let tradesWithZeroFees = []
    let tradesBySource = {}
    
    allTrades.forEach(trade => {
      const tradeFees = trade.entryFees + trade.exitFees + trade.commission + trade.swap
      const source = trade.dataSource || 'unknown'
      
      if (!tradesBySource[source]) {
        tradesBySource[source] = { count: 0, grossPnL: 0, netPnL: 0, fees: 0 }
      }
      
      tradesBySource[source].count++
      tradesBySource[source].grossPnL += trade.grossPnL || 0
      tradesBySource[source].netPnL += trade.netPnL || 0
      tradesBySource[source].fees += tradeFees
      
      if (trade.status === 'CLOSED') {
        totalGross += trade.grossPnL || 0
        totalNet += trade.netPnL || 0
        totalFees += tradeFees
        
        if (tradeFees === 0 && trade.symbol.match(/^(MNQ|MES|MYM|NQ|ES|YM)/)) {
          tradesWithZeroFees.push({
            id: trade.id.substring(0, 8),
            symbol: trade.symbol,
            quantity: trade.quantity,
            source: trade.dataSource,
            netPnL: trade.netPnL
          })
        }
      }
    })
    
    console.log('📋 Summary by Data Source:')
    Object.entries(tradesBySource).forEach(([source, data]) => {
      console.log(`  ${source}:`)
      console.log(`    Trades: ${data.count}`)
      console.log(`    Gross P&L: $${data.grossPnL.toFixed(2)}`)
      console.log(`    Net P&L: $${data.netPnL.toFixed(2)}`)
      console.log(`    Total Fees: $${data.fees.toFixed(2)}`)
      console.log(`    Avg Fee/Trade: $${data.count > 0 ? (data.fees / data.count).toFixed(2) : '0.00'}`)
      console.log('')
    })
    
    console.log('💰 Overall Totals:')
    console.log(`  Total Gross P&L: $${totalGross.toFixed(2)}`)
    console.log(`  Total Net P&L: $${totalNet.toFixed(2)}`)
    console.log(`  Total Fees: $${totalFees.toFixed(2)}`)
    console.log(`  Fee Impact: $${(totalGross - totalNet).toFixed(2)}\n`)
    
    if (tradesWithZeroFees.length > 0) {
      console.log('⚠️ Futures trades with ZERO fees:')
      tradesWithZeroFees.forEach(trade => {
        const expectedFee = 1.34 * trade.quantity
        console.log(`  ${trade.id}... ${trade.symbol} (${trade.quantity}x) - Source: ${trade.source} - Expected fee: $${expectedFee.toFixed(2)}`)
      })
      
      const totalMissingFees = tradesWithZeroFees.reduce((sum, trade) => sum + (1.34 * trade.quantity), 0)
      console.log(`  Total missing fees: $${totalMissingFees.toFixed(2)}`)
    } else {
      console.log('✅ All futures trades have fees applied!')
    }
    
    // Calculate expected balance
    const startingBalance = 50000
    const calculatedBalance = startingBalance + totalNet
    console.log(`\n🎯 Balance Verification:`)
    console.log(`  Starting Balance: $${startingBalance}`)
    console.log(`  Calculated Balance: $${calculatedBalance.toFixed(2)}`)
    console.log(`  TopStep Balance: $51,284.14`)
    console.log(`  Difference: $${(51284.14 - calculatedBalance).toFixed(2)}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyAllFees()