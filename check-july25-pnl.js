const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkJuly25PnL() {
  try {
    const userId = 'cmcwu8b5m0001m17ilm0triy8';
    
    // Get July 25, 2025 date range
    const july25 = new Date('2025-07-25');
    july25.setHours(0, 0, 0, 0);
    const july26 = new Date('2025-07-26');
    july26.setHours(0, 0, 0, 0);
    
    console.log('📅 JULY 25, 2025 P&L ANALYSIS');
    console.log('==============================');
    console.log(`Date range: ${july25.toISOString()} to ${july26.toISOString()}`);
    
    // Get July 25 trades (excluding adjustments)
    const july25Trades = await prisma.trade.findMany({
      where: {
        userId,
        entryDate: {
          gte: july25,
          lt: july26
        },
        status: 'CLOSED',
        NOT: {
          symbol: 'TOPSTEP_ADJUSTMENT'
        }
      },
      select: {
        id: true,
        symbol: true,
        side: true,
        quantity: true,
        netPnL: true,
        grossPnL: true,
        commission: true,
        entryDate: true,
        exitDate: true
      },
      orderBy: {
        entryDate: 'asc'
      }
    });
    
    console.log(`\n📊 ACTUAL TRADES FOR JULY 25 (${july25Trades.length} trades):`);
    console.log('=======================================================');
    
    let totalPnL = 0;
    
    july25Trades.forEach((trade, index) => {
      const pnl = trade.netPnL || 0;
      totalPnL += pnl;
      
      console.log(`${index + 1}. ${trade.symbol} ${trade.side} x${trade.quantity}`);
      console.log(`   Entry: ${trade.entryDate.toLocaleString()}`);
      console.log(`   Exit: ${trade.exitDate?.toLocaleString() || 'N/A'}`);
      console.log(`   Gross P&L: $${(trade.grossPnL || 0).toFixed(2)}`);
      console.log(`   Commission: $${(trade.commission || 0).toFixed(2)}`);
      console.log(`   Net P&L: $${pnl.toFixed(2)}`);
      console.log();
    });
    
    console.log('💰 JULY 25 TOTAL P&L');
    console.log('====================');
    console.log(`Total P&L: $${totalPnL.toFixed(2)}`);
    
    // Check if the $300 profit trade is included and has correct calculation
    const bigTrade = july25Trades.find(trade => trade.grossPnL && Math.abs(trade.grossPnL - 300) < 1);
    if (bigTrade) {
      console.log('\n🎯 VERIFICATION OF $300 TRADE:');
      console.log('===============================');
      console.log(`Expected: Gross $300, Commission $4.02, Net $295.98`);
      console.log(`Actual: Gross $${bigTrade.grossPnL}, Commission $${bigTrade.commission}, Net $${bigTrade.netPnL}`);
      console.log(`✅ Calculation is ${Math.abs(bigTrade.netPnL - 295.98) < 0.01 ? 'CORRECT' : 'INCORRECT'}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking July 25 P&L:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkJuly25PnL();