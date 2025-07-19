const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllTrades() {
  try {
    // Check all trades in July 2025
    const julyStart = new Date('2025-07-01T00:00:00.000Z');
    const julyEnd = new Date('2025-07-31T23:59:59.999Z');
    
    const allTrades = await prisma.trade.findMany({
      where: {
        entryDate: {
          gte: julyStart,
          lte: julyEnd
        }
      },
      select: {
        id: true,
        symbol: true,
        side: true,
        entryDate: true,
        entryPrice: true,
        exitPrice: true,
        quantity: true,
        netPnL: true,
        dataSource: true,
        createdAt: true
      },
      orderBy: {
        entryDate: 'asc'
      }
    });
    
    console.log('=== All July 2025 Trades ===');
    console.log('Total trades found:', allTrades.length);
    
    // Group by date
    const tradesByDate = {};
    allTrades.forEach(trade => {
      const dateKey = trade.entryDate.toISOString().split('T')[0];
      if (!tradesByDate[dateKey]) {
        tradesByDate[dateKey] = [];
      }
      tradesByDate[dateKey].push(trade);
    });
    
    // Show trades by date
    Object.keys(tradesByDate).sort().forEach(date => {
      const trades = tradesByDate[date];
      console.log(`\n=== ${date} (${trades.length} trades) ===`);
      trades.forEach((trade, index) => {
        console.log(`  ${index + 1}. ${trade.symbol} ${trade.side} - ${trade.entryPrice} → ${trade.exitPrice} - P&L: $${trade.netPnL} - Source: ${trade.dataSource}`);
      });
    });
    
    // Look for potential duplicates across all dates
    console.log('\n=== CHECKING FOR DUPLICATES ===');
    const duplicateGroups = [];
    for (let i = 0; i < allTrades.length; i++) {
      const trade1 = allTrades[i];
      for (let j = i + 1; j < allTrades.length; j++) {
        const trade2 = allTrades[j];
        if (
          trade1.symbol === trade2.symbol &&
          trade1.side === trade2.side &&
          Math.abs(trade1.entryPrice - trade2.entryPrice) < 0.01 &&
          trade1.quantity === trade2.quantity &&
          Math.abs((trade1.netPnL || 0) - (trade2.netPnL || 0)) < 0.01
        ) {
          duplicateGroups.push([trade1, trade2]);
        }
      }
    }
    
    if (duplicateGroups.length > 0) {
      console.log(`\nFound ${duplicateGroups.length} duplicate groups:`);
      duplicateGroups.forEach((group, index) => {
        console.log(`\nDuplicate Group ${index + 1}:`);
        group.forEach((trade, i) => {
          const date = trade.entryDate.toISOString().split('T')[0];
          console.log(`  ${i + 1}. ID: ${trade.id} - ${date} - ${trade.symbol} ${trade.side} - P&L: $${trade.netPnL} - Source: ${trade.dataSource} - Created: ${trade.createdAt.toISOString()}`);
        });
      });
      
      // Create removal script for duplicates
      console.log('\n=== DUPLICATE REMOVAL SCRIPT ===');
      console.log('// Run this to remove duplicate trades:');
      duplicateGroups.forEach((group, index) => {
        // Keep the first trade (usually original), remove the rest
        for (let i = 1; i < group.length; i++) {
          console.log(`// Remove duplicate ${index + 1}.${i}: ${group[i].symbol} ${group[i].side} P&L: $${group[i].netPnL}`);
          console.log(`await prisma.trade.delete({ where: { id: "${group[i].id}" } });`);
        }
      });
    } else {
      console.log('✅ No duplicates found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllTrades();