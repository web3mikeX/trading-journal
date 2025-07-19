const { PrismaClient } = require('@prisma/client')

async function debugTest() {
  const prisma = new PrismaClient()
  
  try {
    console.log('Testing database connection...')
    
    // Check all users
    const users = await prisma.user.findMany()
    console.log(`✓ Found ${users.length} users:`)
    
    for (const user of users) {
      console.log(`  - ${user.name} (${user.email}) - ID: ${user.id}`)
      
      // Check trades for each user
      const trades = await prisma.trade.findMany({
        where: { userId: user.id },
        orderBy: { entryDate: 'desc' }
      })
      
      console.log(`    Trades: ${trades.length}`)
      
      if (trades.length > 0) {
        console.log(`    First trade: ${trades[0].symbol} ${trades[0].side} ${trades[0].quantity}@${trades[0].entryPrice}`)
        console.log(`    Net PnL: ${trades[0].netPnL}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugTest()