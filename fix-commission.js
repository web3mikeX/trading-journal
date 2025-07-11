// Fix Commission Script - Apply $4 commission to trades with commission = 0
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixCommissions() {
  try {
    console.log('🔧 Fixing commission calculations...')
    
    // Get all trades with commission = 0
    const tradesWithZeroCommission = await prisma.trade.findMany({
      where: {
        commission: 0,
        status: 'CLOSED' // Only fix closed trades
      }
    })
    
    console.log(`Found ${tradesWithZeroCommission.length} trades with zero commission`)
    
    let updatedCount = 0
    
    for (const trade of tradesWithZeroCommission) {
      // Apply $4 commission and recalculate net P&L
      const newCommission = 4.0
      const newNetPnL = trade.grossPnL - newCommission
      
      await prisma.trade.update({
        where: { id: trade.id },
        data: {
          commission: newCommission,
          netPnL: newNetPnL
        }
      })
      
      console.log(`✅ Updated trade ${trade.symbol} (${trade.entryDate.toISOString().split('T')[0]}): 
        Gross P&L: $${trade.grossPnL} 
        Commission: $0 → $${newCommission}
        Net P&L: $${trade.netPnL} → $${newNetPnL}`)
      
      updatedCount++
    }
    
    console.log(`\n🎉 Successfully updated ${updatedCount} trades with proper commission`)
    
    // Verify the changes
    const totalPnLBefore = tradesWithZeroCommission.reduce((sum, trade) => sum + (trade.netPnL || 0), 0)
    const totalCommissionApplied = updatedCount * 4.0
    const totalPnLAfter = totalPnLBefore - totalCommissionApplied
    
    console.log(`\n📊 Summary:`)
    console.log(`Total P&L before: $${totalPnLBefore.toFixed(2)}`)
    console.log(`Total commission applied: $${totalCommissionApplied.toFixed(2)}`)
    console.log(`Total P&L after: $${totalPnLAfter.toFixed(2)}`)
    
  } catch (error) {
    console.error('❌ Error fixing commissions:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixCommissions()