const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function auditTradeData() {
  try {
    console.log('=== COMPREHENSIVE P&L AUDIT ===\n')
    
    const trades = await prisma.trade.findMany({
      orderBy: { entryDate: 'asc' },
      select: {
        id: true,
        entryDate: true,
        symbol: true,
        netPnL: true,
        grossPnL: true,
        commission: true,
        entryFees: true,
        exitFees: true,
        swap: true,
        dataSource: true,
        status: true,
        contractMultiplier: true,
        quantity: true
      }
    })

    console.log('📊 BASIC STATS:')
    console.log(`  Total trades: ${trades.length}`)
    
    if (trades.length > 0) {
      const firstTrade = new Date(trades[0].entryDate)
      const lastTrade = new Date(trades[trades.length - 1].entryDate)
      console.log(`  Date range: ${firstTrade.toDateString()} to ${lastTrade.toDateString()}`)
    }

    // Closed trades analysis
    const closedTrades = trades.filter(t => t.status === 'CLOSED')
    console.log(`  Closed trades: ${closedTrades.length}`)
    console.log(`  Open trades: ${trades.length - closedTrades.length}\n`)

    // Calculate totals
    let totalNet = 0
    let totalGross = 0 
    let totalFees = 0
    let calculationErrors = 0

    const monthlyData = {}
    const sourceData = {}

    closedTrades.forEach(trade => {
      // Monthly breakdown
      const month = trade.entryDate.toISOString().substring(0, 7)
      if (!monthlyData[month]) {
        monthlyData[month] = { count: 0, netPnL: 0, grossPnL: 0, fees: 0 }
      }

      // Source breakdown  
      const source = trade.dataSource || 'unknown'
      if (!sourceData[source]) {
        sourceData[source] = { count: 0, netPnL: 0, grossPnL: 0, fees: 0 }
      }

      const tradeFees = (trade.commission || 0) + (trade.entryFees || 0) + (trade.exitFees || 0) + (trade.swap || 0)
      const expectedNet = (trade.grossPnL || 0) - tradeFees
      const netDiff = Math.abs((trade.netPnL || 0) - expectedNet)

      if (netDiff > 0.01) {
        calculationErrors++
      }

      monthlyData[month].count++
      monthlyData[month].netPnL += trade.netPnL || 0
      monthlyData[month].grossPnL += trade.grossPnL || 0
      monthlyData[month].fees += tradeFees

      sourceData[source].count++
      sourceData[source].netPnL += trade.netPnL || 0
      sourceData[source].grossPnL += trade.grossPnL || 0
      sourceData[source].fees += tradeFees

      totalNet += trade.netPnL || 0
      totalGross += trade.grossPnL || 0
      totalFees += tradeFees
    })

    console.log('📅 MONTHLY BREAKDOWN:')
    Object.entries(monthlyData).sort().forEach(([month, data]) => {
      console.log(`  ${month}: ${data.count} trades, Net: $${data.netPnL.toFixed(2)}, Gross: $${data.grossPnL.toFixed(2)}`)
    })

    console.log('\n📈 TOTALS:')
    console.log(`  Total Net P&L: $${totalNet.toFixed(2)}`)
    console.log(`  Total Gross P&L: $${totalGross.toFixed(2)}`) 
    console.log(`  Total Fees: $${totalFees.toFixed(2)}`)
    console.log(`  Target P&L: $51,177.92`)
    console.log(`  Missing P&L: $${(51177.92 - totalNet).toFixed(2)}`)

    console.log('\n🔧 CALCULATION ERRORS:')
    console.log(`  Trades with Net P&L mismatches: ${calculationErrors}`)

    console.log('\n📂 DATA SOURCES:')
    Object.entries(sourceData).forEach(([source, data]) => {
      console.log(`  ${source}: ${data.count} trades, Net: $${data.netPnL.toFixed(2)}, Avg Fee: $${(data.fees / data.count).toFixed(2)}`)
    })

    // Contract multiplier check
    console.log('\n⚙️ CONTRACT MULTIPLIER ISSUES:')
    const multiplierIssues = trades.filter(t => {
      if (t.symbol.startsWith('MNQ')) return t.contractMultiplier !== 2
      if (t.symbol.startsWith('MES')) return t.contractMultiplier !== 5  
      if (t.symbol.startsWith('MYM')) return t.contractMultiplier !== 0.5
      return false
    })
    console.log(`  Trades with incorrect multipliers: ${multiplierIssues.length}`)

    if (multiplierIssues.length > 0) {
      multiplierIssues.slice(0, 5).forEach(trade => {
        const expected = trade.symbol.startsWith('MNQ') ? 2 : trade.symbol.startsWith('MES') ? 5 : 0.5
        console.log(`    ${trade.symbol}: has ${trade.contractMultiplier}, should be ${expected}`)
      })
    }

    console.log('\n✅ AUDIT COMPLETE!')
    
  } catch (error) {
    console.error('❌ Audit failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

auditTradeData()