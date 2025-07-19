const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixJuly18Trades() {
  try {
    // Get user
    const user = await prisma.user.findFirst();
    console.log('Using user ID:', user.id);
    
    // Check July 18th trades
    const july18Start = new Date('2025-07-18T00:00:00.000Z');
    const july18End = new Date('2025-07-18T23:59:59.999Z');
    
    const trades = await prisma.trade.findMany({
      where: {
        userId: user.id,
        entryDate: {
          gte: july18Start,
          lte: july18End
        }
      },
      select: {
        id: true,
        symbol: true,
        side: true,
        entryDate: true,
        exitDate: true,
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
    
    console.log('=== Current July 18th Trades ===');
    console.log('Total trades found:', trades.length);
    
    trades.forEach((trade, index) => {
      console.log(`${index + 1}. ${trade.side} - ${trade.entryPrice} → ${trade.exitPrice} = $${trade.netPnL} (ID: ${trade.id})`);
    });
    
    // Expected trades from CSV
    const expectedTrades = [
      { entryPrice: 23219.25, exitPrice: 23269.75, pnl: 101.00 },
      { entryPrice: 23219.25, exitPrice: 23268.75, pnl: 99.00 }
    ];
    
    console.log('\n=== Expected Trades from CSV ===');
    expectedTrades.forEach((trade, index) => {
      console.log(`${index + 1}. ${trade.entryPrice} → ${trade.exitPrice} = +$${trade.pnl}`);
    });
    
    // Find incorrect trades
    const incorrectTrades = [];
    
    for (const trade of trades) {
      const isCorrect = expectedTrades.some(expected => 
        Math.abs(trade.entryPrice - expected.entryPrice) < 0.01 &&
        Math.abs(trade.exitPrice - expected.exitPrice) < 0.01 &&
        Math.abs(trade.netPnL - expected.pnl) < 0.01
      );
      
      if (!isCorrect) {
        incorrectTrades.push(trade);
      }
    }
    
    console.log(`\n=== Found ${incorrectTrades.length} Incorrect Trades ===`);
    
    // Delete all incorrect trades
    for (const trade of incorrectTrades) {
      console.log(`Deleting: ${trade.side} - ${trade.entryPrice} → ${trade.exitPrice} = $${trade.netPnL} (ID: ${trade.id})`);
      
      await prisma.trade.delete({
        where: { id: trade.id }
      });
      
      console.log('✅ Deleted');
    }
    
    // Check if we have the correct trades
    const remainingTrades = await prisma.trade.findMany({
      where: {
        userId: user.id,
        entryDate: {
          gte: july18Start,
          lte: july18End
        }
      },
      select: {
        id: true,
        entryPrice: true,
        exitPrice: true,
        netPnL: true
      }
    });
    
    console.log(`\n=== After Cleanup ===`);
    console.log(`Remaining trades: ${remainingTrades.length}`);
    
    // Add missing correct trades
    for (const expected of expectedTrades) {
      const exists = remainingTrades.some(trade => 
        Math.abs(trade.entryPrice - expected.entryPrice) < 0.01 &&
        Math.abs(trade.exitPrice - expected.exitPrice) < 0.01 &&
        Math.abs(trade.netPnL - expected.pnl) < 0.01
      );
      
      if (!exists) {
        console.log(`Adding missing trade: ${expected.entryPrice} → ${expected.exitPrice} = +$${expected.pnl}`);
        
        await prisma.trade.create({
          data: {
            userId: user.id,
            symbol: 'MNQU5',
            side: 'LONG',
            entryDate: new Date('2025-07-18T14:16:02.000Z'), // Corrected time based on CSV
            exitDate: new Date('2025-07-18T13:54:03.000Z'),   // Corrected time based on CSV
            entryPrice: expected.entryPrice,
            exitPrice: expected.exitPrice,
            quantity: 1,
            market: 'FUTURES',
            grossPnL: expected.pnl,
            netPnL: expected.pnl,
            status: 'CLOSED',
            dataSource: 'csv_corrected',
            contractMultiplier: 2.0,
            contractType: 'MICRO_FUTURES'
          }
        });
        
        console.log('✅ Added correct trade');
      }
    }
    
    // Final check
    const finalTrades = await prisma.trade.findMany({
      where: {
        userId: user.id,
        entryDate: {
          gte: july18Start,
          lte: july18End
        }
      },
      select: {
        id: true,
        side: true,
        entryPrice: true,
        exitPrice: true,
        netPnL: true
      },
      orderBy: {
        entryDate: 'asc'
      }
    });
    
    console.log(`\n=== Final Result ===`);
    console.log(`Total trades for July 18th: ${finalTrades.length}`);
    
    finalTrades.forEach((trade, index) => {
      console.log(`${index + 1}. ${trade.side} - ${trade.entryPrice} → ${trade.exitPrice} = +$${trade.netPnL}`);
    });
    
    const totalPnL = finalTrades.reduce((sum, trade) => sum + trade.netPnL, 0);
    console.log(`Total P&L: +$${totalPnL.toFixed(2)} (Expected: +$200.00)`);
    
    if (Math.abs(totalPnL - 200) < 0.01) {
      console.log('✅ SUCCESS: Trades now match your CSV file!');
    } else {
      console.log('❌ WARNING: Total P&L does not match expected $200.00');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixJuly18Trades();