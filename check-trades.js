const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkTrades() {
  try {
    console.log('📊 Checking current July 10th trades...\n')
    
    const trades = await prisma.trade.findMany({
      where: {
        entryDate: {
          gte: new Date('2025-07-10T00:00:00.000Z'),
          lt: new Date('2025-07-11T00:00:00.000Z')
        }
      },
      orderBy: { entryDate: 'asc' }
    })
    
    console.log(`Found ${trades.length} trades on July 10th:\n`)
    
    let totalGross = 0
    let totalCommission = 0
    let totalNet = 0
    
    trades.forEach((trade, index) => {
      console.log(`Trade ${index + 1}:`)
      console.log(`  Symbol: ${trade.symbol}`)
      console.log(`  Gross P&L: $${trade.grossPnL}`)
      console.log(`  Commission: $${trade.commission}`)
      console.log(`  Net P&L: $${trade.netPnL}`)
      console.log(`  Entry Date: ${trade.entryDate.toISOString()}`)
      console.log('')
      
      totalGross += trade.grossPnL || 0
      totalCommission += trade.commission || 0
      totalNet += trade.netPnL || 0
    })
    
    console.log('📈 TOTALS:')
    console.log(`  Total Gross P&L: $${totalGross}`)
    console.log(`  Total Commission: $${totalCommission}`)
    console.log(`  Total Net P&L: $${totalNet}`)
    console.log(`  Expected Net (if commission was $6.70): $${totalGross - 6.70}`)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkTrades()