const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function debugTrades() {
  try {
    console.log('Checking July 8, 2025 trades...\n')
    
    const trades = await prisma.trade.findMany({
      where: {
        userId: 'cmcwu8b5m0001m17ilm0triy8',
        entryDate: {
          gte: new Date('2025-07-08T00:00:00.000Z'),
          lte: new Date('2025-07-08T23:59:59.999Z')
        }
      },
      orderBy: { entryDate: 'asc' },
      select: {
        id: true,
        symbol: true,
        side: true,
        entryDate: true,
        entryPrice: true,
        exitPrice: true,
        quantity: true,
        grossPnL: true,
        netPnL: true,
        commission: true,
        entryFees: true,
        exitFees: true,
        swap: true,
        contractMultiplier: true,
        status: true
      }
    })
    
    let totalNet = 0
    let totalGross = 0
    let totalFees = 0
    
    trades.forEach((trade, index) => {
      const fees = (trade.entryFees || 0) + (trade.exitFees || 0) + (trade.commission || 0) + (trade.swap || 0)
      totalNet += trade.netPnL || 0
      totalGross += trade.grossPnL || 0
      totalFees += fees
      
      console.log(`Trade ${index + 1}: ${trade.symbol} ${trade.side}`)
      console.log(`  Entry: $${trade.entryPrice} -> Exit: $${trade.exitPrice}`)
      console.log(`  Quantity: ${trade.quantity} x Multiplier: ${trade.contractMultiplier}`)
      console.log(`  Gross P&L: $${trade.grossPnL}`)
      console.log(`  Net P&L: $${trade.netPnL}`)
      console.log(`  Commission: $${trade.commission}`)
      console.log(`  Entry Fees: $${trade.entryFees}`)
      console.log(`  Exit Fees: $${trade.exitFees}`)
      console.log(`  Swap: $${trade.swap}`)
      console.log(`  Total Fees: $${fees}`)
      console.log(`  Calculated Net: $${(trade.grossPnL || 0) - fees}`)
      console.log(`---`)
    })
    
    console.log(`\nSUMMARY:`)
    console.log(`Total Trades: ${trades.length}`)
    console.log(`Total Gross P&L: $${totalGross}`)
    console.log(`Total Net P&L: $${totalNet}`)
    console.log(`Total Fees: $${totalFees}`)
    console.log(`Expected Net: $${totalGross - totalFees}`)
    console.log(`\nTradezella Target: $110.14`)
    console.log(`Current Difference: $${totalNet - 110.14}`)
    
  } catch (error) {
    console.error('Debug failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugTrades()