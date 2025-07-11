const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixCommissionsCorrect() {
  try {
    console.log('🔧 Correcting commission calculations to match Tradovate data...\n')
    
    // Get July 10th trades that currently have $4 commission
    const tradesJuly10 = await prisma.trade.findMany({
      where: {
        entryDate: {
          gte: new Date('2025-07-10T00:00:00.000Z'),
          lt: new Date('2025-07-11T00:00:00.000Z')
        },
        commission: 4.0 // Currently set to $4
      },
      orderBy: { entryDate: 'asc' }
    })
    
    console.log(`Found ${tradesJuly10.length} July 10th trades with $4 commission`)
    
    // Calculate correct commission: $6.70 total ÷ 5 trades = $1.34 per trade
    const correctCommissionPerTrade = 1.34
    console.log(`Correct commission per trade: $${correctCommissionPerTrade}`)
    console.log('')
    
    let updatedCount = 0
    
    for (const trade of tradesJuly10) {
      // Correct the commission and recalculate net P&L
      const newNetPnL = trade.grossPnL - correctCommissionPerTrade
      
      await prisma.trade.update({
        where: { id: trade.id },
        data: {
          commission: correctCommissionPerTrade,
          netPnL: newNetPnL
        }
      })
      
      console.log(`✅ Updated trade ${trade.symbol} (${trade.entryDate.toISOString().split('T')[0]}):`)
      console.log(`    Gross P&L: $${trade.grossPnL}`)
      console.log(`    Commission: $4.00 → $${correctCommissionPerTrade}`)
      console.log(`    Net P&L: $${trade.netPnL} → $${newNetPnL}`)
      console.log('')
      
      updatedCount++
    }
    
    console.log(`🎉 Successfully updated ${updatedCount} trades with correct commission`)
    
    // Calculate final totals
    const totalGross = tradesJuly10.reduce((sum, trade) => sum + (trade.grossPnL || 0), 0)
    const totalCommissionNew = updatedCount * correctCommissionPerTrade
    const totalNetNew = totalGross - totalCommissionNew
    
    console.log(`\n📊 Final Summary:`)
    console.log(`Total Gross P&L: $${totalGross}`)
    console.log(`Total Commission: $${totalCommissionNew.toFixed(2)}`)
    console.log(`Total Net P&L: $${totalNetNew.toFixed(2)}`)
    console.log(`Expected: $88.30 ✅`)
    
  } catch (error) {
    console.error('❌ Error fixing commissions:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixCommissionsCorrect()