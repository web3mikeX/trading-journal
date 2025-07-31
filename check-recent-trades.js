const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRecentTrades() {
  try {
    const userId = 'cmcwu8b5m0001m17ilm0triy8';
    
    // Get recent trades excluding adjustments
    const recentTrades = await prisma.trade.findMany({
      where: { 
        userId,
        NOT: {
          symbol: 'TOPSTEP_ADJUSTMENT'
        }
      },
      orderBy: { entryDate: 'desc' },
      take: 3,
      select: {
        id: true,
        symbol: true,
        side: true,
        quantity: true,
        entryPrice: true,
        exitPrice: true,
        grossPnL: true,
        netPnL: true,
        commission: true,
        entryFees: true,
        exitFees: true,
        entryDate: true,
        exitDate: true,
        status: true
      }
    });
    
    console.log('🔍 RECENT TRADES (excluding adjustments):');
    console.log('=========================================');
    
    recentTrades.forEach((trade, index) => {
      console.log();
      console.log(`TRADE ${index + 1} - ID: ${trade.id}`);
      console.log(`Symbol: ${trade.symbol}`);
      console.log(`Side: ${trade.side}`);
      console.log(`Quantity: ${trade.quantity}`);
      console.log(`Entry Price: ${trade.entryPrice}`);
      console.log(`Exit Price: ${trade.exitPrice}`);
      console.log(`Entry Date: ${trade.entryDate?.toISOString()}`);
      console.log(`Exit Date: ${trade.exitDate?.toISOString()}`);
      console.log(`Status: ${trade.status}`);
      console.log(`Gross P&L: ${trade.grossPnL}`);
      console.log(`Net P&L: ${trade.netPnL}`);
      console.log(`Commission: ${trade.commission}`);
      console.log(`Entry Fees: ${trade.entryFees}`);
      console.log(`Exit Fees: ${trade.exitFees}`);
      
      const totalFees = (trade.commission || 0) + (trade.entryFees || 0) + (trade.exitFees || 0);
      console.log(`Total Fees: ${totalFees.toFixed(2)}`);
      
      // Check if this looks like the $300 profit trade
      if (trade.grossPnL && Math.abs(trade.grossPnL - 300) < 5) {
        console.log('*** THIS APPEARS TO BE THE $300 PROFIT TRADE ***');
        console.log(`Expected fees for ${trade.quantity} contracts: $${(trade.quantity * 1.34).toFixed(2)}`);
        console.log(`Expected net P&L: $${(trade.grossPnL - (trade.quantity * 1.34)).toFixed(2)}`);
        
        console.log();
        console.log('🐛 ISSUE ANALYSIS:');
        console.log('==================');
        console.log(`Current Net P&L: $${(trade.netPnL || 0).toFixed(2)}`);
        console.log(`Expected Net P&L: $${(trade.grossPnL - (trade.quantity * 1.34)).toFixed(2)}`);
        console.log(`Difference: $${((trade.netPnL || 0) - (trade.grossPnL - (trade.quantity * 1.34))).toFixed(2)}`);
        
        if (Math.abs(totalFees - (trade.quantity * 1.34)) > 0.01) {
          console.log(`❌ Fee calculation error: stored $${totalFees.toFixed(2)}, expected $${(trade.quantity * 1.34).toFixed(2)}`);
        }
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentTrades();