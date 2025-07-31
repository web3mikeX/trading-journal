const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const userId = 'cmcwu8b5m0001m17ilm0triy8'

async function clearNonJulyTrades() {
  try {
    console.log('🚀 CLEARING NON-JULY TRADES')
    console.log('============================\n')

    // First, backup count of what we're about to delete
    const nonJulyTrades = await prisma.trade.findMany({
      where: {
        userId,
        entryDate: {
          lt: new Date('2025-07-01T00:00:00.000Z')
        }
      }
    })

    console.log(`Found ${nonJulyTrades.length} non-July trades to delete`)
    
    if (nonJulyTrades.length > 0) {
      // Group by month for reporting
      const tradesByMonth = {}
      nonJulyTrades.forEach(trade => {
        const month = trade.entryDate.toISOString().substring(0, 7)
        if (!tradesByMonth[month]) {
          tradesByMonth[month] = 0
        }
        tradesByMonth[month]++
      })

      console.log('\n📅 TRADES TO DELETE:')
      Object.keys(tradesByMonth).sort().forEach(month => {
        console.log(`  ${month}: ${tradesByMonth[month]} trades`)
      })

      // Delete non-July trades
      const deleteResult = await prisma.trade.deleteMany({
        where: {
          userId,
          entryDate: {
            lt: new Date('2025-07-01T00:00:00.000Z')
          }
        }
      })

      console.log(`\n✅ Deleted ${deleteResult.count} non-July trades`)
    }

    // Verify final state
    const remainingTrades = await prisma.trade.findMany({
      where: { userId },
      select: {
        entryDate: true,
        netPnL: true
      }
    })

    const totalPnL = remainingTrades.reduce((sum, trade) => sum + (trade.netPnL || 0), 0)

    console.log(`\n📊 FINAL STATE:`)
    console.log(`  Remaining trades: ${remainingTrades.length}`)
    console.log(`  Total P&L: $${totalPnL.toFixed(2)}`)
    console.log(`  Date range: July 2025 only`)

    // Update account balance to reflect July-only performance
    const finalBalance = 50000 + totalPnL
    await prisma.user.update({
      where: { id: userId },
      data: {
        accountBalance: finalBalance
      }
    })

    console.log(`  Updated account balance: $${finalBalance.toFixed(2)}`)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearNonJulyTrades()