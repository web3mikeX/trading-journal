const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkAccount() {
  try {
    const user = await prisma.user.findUnique({
      where: { id: 'cmcwu8b5m0001m17ilm0triy8' },
      select: {
        initialBalance: true,
        startingBalance: true,
        accountStartDate: true,
        accountType: true
      }
    })
    
    console.log('👤 USER ACCOUNT CONFIG:')
    console.log('  Initial Balance:', user?.initialBalance)
    console.log('  Starting Balance:', user?.startingBalance)
    console.log('  Account Start Date:', user?.accountStartDate)
    console.log('  Account Type:', user?.accountType)
    
    // Get all trades summary
    const tradesCount = await prisma.trade.count({
      where: { userId: 'cmcwu8b5m0001m17ilm0triy8' }
    })
    
    const netPnLSum = await prisma.trade.aggregate({
      where: { 
        userId: 'cmcwu8b5m0001m17ilm0triy8',
        status: 'CLOSED'
      },
      _sum: { netPnL: true }
    })
    
    console.log('\n📊 CURRENT DATA:')
    console.log('  Total Trades:', tradesCount)
    console.log('  Total Net P&L:', netPnLSum._sum.netPnL?.toFixed(2))
    console.log('  Expected Balance:', (50000 + (netPnLSum._sum.netPnL || 0)).toFixed(2))
    console.log('  Target Balance: $51,177.92')
    console.log('  Account Metrics Balance: $51,281.24')
    
    await prisma.$disconnect()
  } catch (error) {
    console.error('Error:', error)
    await prisma.$disconnect()
  }
}

checkAccount()