const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function extractData() {
  try {
    const trades = await prisma.trade.findMany({
      where: { userId: 'cmcwu8b5m0001m17ilm0triy8' },
      orderBy: { entryDate: 'desc' }
    })
    
    console.log('TRADES_DATA:', JSON.stringify(trades, null, 2))
    
    const stats = {
      totalTrades: trades.length,
      totalPnL: trades.reduce((sum, t) => sum + (t.netPnL || 0), 0),
      winningTrades: trades.filter(t => (t.netPnL || 0) > 0).length,
      losingTrades: trades.filter(t => (t.netPnL || 0) < 0).length
    }
    
    console.log('STATS_DATA:', JSON.stringify(stats, null, 2))
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

extractData()