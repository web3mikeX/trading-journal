const { PrismaClient } = require('@prisma/client')

async function debugTest() {
  const prisma = new PrismaClient()
  
  try {
    console.log('Testing database connection...')
    
    // Test connection
    await prisma.$connect()
    console.log('✓ Database connected')
    
    // Check users
    const users = await prisma.user.findMany()
    console.log(`✓ Found ${users.length} users`)
    
    if (users.length > 0) {
      const testUserId = users[0].id
      console.log(`✓ Testing with user ID: ${testUserId}`)
      
      // Test trade query exactly as API does
      const trades = await prisma.trade.findMany({
        where: { userId: testUserId },
        include: {
          tags: {
            include: {
              tag: true
            }
          }
        },
        orderBy: { entryDate: 'desc' }
      })
      
      console.log(`✓ Found ${trades.length} trades for user ${testUserId}`)
      
      if (trades.length > 0) {
        console.log('\nFirst trade:')
        console.log(JSON.stringify(trades[0], null, 2))
      }
      
      // Test the stats query
      const allTrades = await prisma.trade.findMany({
        where: { userId: testUserId },
        select: {
          id: true,
          symbol: true,
          side: true,
          entryDate: true,
          exitDate: true,
          netPnL: true,
          status: true,
          entryPrice: true,
          quantity: true
        },
        orderBy: { entryDate: 'desc' }
      })
      
      console.log(`✓ Stats query found ${allTrades.length} trades`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugTest()