const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const userId = 'cmcwu8b5m0001m17ilm0triy8'

async function checkTradeData() {
  try {
    console.log('🔍 CHECKING CURRENT TRADE DATA')
    console.log('==============================\n')

    // Get all trades for the user
    const allTrades = await prisma.trade.findMany({
      where: { userId },
      select: {
        id: true,
        symbol: true,
        entryDate: true,
        netPnL: true,
        dataSource: true
      },
      orderBy: { entryDate: 'desc' }
    })

    console.log(`Total trades in database: ${allTrades.length}`)

    // Group by month
    const tradesByMonth = {}
    allTrades.forEach(trade => {
      const month = trade.entryDate.toISOString().substring(0, 7) // YYYY-MM
      if (!tradesByMonth[month]) {
        tradesByMonth[month] = []
      }
      tradesByMonth[month].push(trade)
    })

    console.log('\n📅 TRADES BY MONTH:')
    Object.keys(tradesByMonth).sort().forEach(month => {
      const trades = tradesByMonth[month]
      const totalPnL = trades.reduce((sum, t) => sum + (t.netPnL || 0), 0)
      console.log(`  ${month}: ${trades.length} trades, P&L: $${totalPnL.toFixed(2)}`)
    })

    // Check July 2025 specifically
    const julyTrades = allTrades.filter(trade => 
      trade.entryDate >= new Date('2025-07-01') && 
      trade.entryDate < new Date('2025-08-01')
    )

    console.log(`\n📊 JULY 2025 ANALYSIS:`)
    console.log(`  July trades: ${julyTrades.length}`)
    console.log(`  July P&L: $${julyTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0).toFixed(2)}`)

    // Check data sources
    const dataSources = {}
    allTrades.forEach(trade => {
      const source = trade.dataSource || 'unknown'
      if (!dataSources[source]) {
        dataSources[source] = 0
      }
      dataSources[source]++
    })

    console.log(`\n📊 DATA SOURCES:`)
    Object.keys(dataSources).forEach(source => {
      console.log(`  ${source}: ${dataSources[source]} trades`)
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkTradeData()