const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTodaysPnL() {
  try {
    const userId = 'cmcwu8b5m0001m17ilm0triy8';
    
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    console.log('📅 TODAY\'S P&L ANALYSIS');
    console.log('=======================');
    console.log(`Today's date: ${today.toDateString()}`);
    console.log(`Time range: ${today.toISOString()} to ${tomorrow.toISOString()}`);
    
    // Get today's trades
    const todayTrades = await prisma.trade.findMany({
      where: {
        userId,
        entryDate: {
          gte: today,
          lt: tomorrow
        },
        status: 'CLOSED'
      },
      select: {
        id: true,
        symbol: true,
        side: true,
        quantity: true,
        netPnL: true,
        entryDate: true,
        exitDate: true
      },
      orderBy: {
        entryDate: 'asc'
      }
    });
    
    console.log(`\n📊 TRADES FOR TODAY (${todayTrades.length} trades):`);
    console.log('===========================================');
    
    let totalPnL = 0;
    
    todayTrades.forEach((trade, index) => {
      const pnl = trade.netPnL || 0;
      totalPnL += pnl;
      
      console.log(`${index + 1}. ${trade.symbol} ${trade.side} x${trade.quantity}`);
      console.log(`   Entry: ${trade.entryDate.toLocaleString()}`);
      console.log(`   Exit: ${trade.exitDate?.toLocaleString() || 'N/A'}`);
      console.log(`   P&L: $${pnl.toFixed(2)}`);
      console.log();
    });
    
    console.log('💰 TODAY\'S TOTAL P&L');
    console.log('====================');
    console.log(`Total P&L: $${totalPnL.toFixed(2)}`);
    
    // Also check what the trailingDrawdown.ts function calculates
    const { getTodayPnL } = require('./src/lib/trailingDrawdown.ts');
    
    // Convert trades to the format expected by getTodayPnL
    const allTrades = await prisma.trade.findMany({
      where: { userId },
      select: {
        netPnL: true,
        entryDate: true,
        status: true
      }
    });
    
    const tradesForFunction = allTrades.map(trade => ({
      netPnL: trade.netPnL,
      entryDate: trade.entryDate,
      status: trade.status
    }));
    
    const calculatedTodayPnL = getTodayPnL(tradesForFunction);
    
    console.log(`\n🔍 FUNCTION VERIFICATION:`);
    console.log('========================');
    console.log(`getTodayPnL() result: $${calculatedTodayPnL.toFixed(2)}`);
    console.log(`Manual calculation: $${totalPnL.toFixed(2)}`);
    console.log(`Match: ${Math.abs(calculatedTodayPnL - totalPnL) < 0.01 ? '✅ YES' : '❌ NO'}`);
    
  } catch (error) {
    console.error('❌ Error checking today\'s P&L:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTodaysPnL();