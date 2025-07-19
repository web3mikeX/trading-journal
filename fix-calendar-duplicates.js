const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixCalendarDuplicates() {
  try {
    // First, get the user ID
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('No user found');
      return;
    }
    
    console.log('Using user ID:', user.id);
    
    // Get all calendar entries
    const allCalendarEntries = await prisma.calendarEntry.findMany({
      where: {
        userId: user.id
      },
      select: {
        id: true,
        date: true,
        tradesCount: true,
        dailyPnL: true,
        winningTrades: true,
        losingTrades: true,
        winRate: true,
        aiSummary: true,
        createdAt: true
      },
      orderBy: {
        date: 'asc'
      }
    });
    
    console.log('=== Calendar Entries Analysis ===');
    console.log('Total calendar entries:', allCalendarEntries.length);
    
    const entriesToDelete = [];
    
    for (const entry of allCalendarEntries) {
      const entryDate = entry.date.toISOString().split('T')[0];
      const dayStart = new Date(entryDate + 'T00:00:00.000Z');
      const dayEnd = new Date(entryDate + 'T23:59:59.999Z');
      
      const actualTrades = await prisma.trade.findMany({
        where: {
          userId: user.id,
          entryDate: {
            gte: dayStart,
            lte: dayEnd
          }
        },
        select: {
          id: true,
          symbol: true,
          netPnL: true
        }
      });
      
      const actualTradeCount = actualTrades.length;
      const actualPnL = actualTrades.reduce((sum, trade) => sum + (trade.netPnL || 0), 0);
      
      console.log(`\n${entryDate}:`);
      console.log(`  Calendar entry: ${entry.tradesCount} trades, $${entry.dailyPnL} P&L`);
      console.log(`  Actual trades: ${actualTradeCount} trades, $${actualPnL.toFixed(2)} P&L`);
      
      if (actualTradeCount === 0 && entry.tradesCount > 0) {
        console.log(`  ❌ ORPHANED ENTRY - No actual trades but calendar shows ${entry.tradesCount} trades`);
        entriesToDelete.push(entry);
      } else if (actualTradeCount !== entry.tradesCount) {
        console.log(`  ⚠️  MISMATCH - Trade count doesn't match`);
      } else {
        console.log(`  ✅ CORRECT`);
      }
    }
    
    if (entriesToDelete.length > 0) {
      console.log(`\n=== REMOVING ${entriesToDelete.length} ORPHANED CALENDAR ENTRIES ===`);
      
      for (const entry of entriesToDelete) {
        const entryDate = entry.date.toISOString().split('T')[0];
        console.log(`Deleting orphaned entry for ${entryDate} (${entry.tradesCount} phantom trades, $${entry.dailyPnL} P&L)`);
        
        await prisma.calendarEntry.delete({
          where: {
            id: entry.id
          }
        });
        
        console.log(`✅ Deleted entry ID: ${entry.id}`);
      }
      
      console.log(`\n🎉 Successfully removed ${entriesToDelete.length} orphaned calendar entries!`);
      console.log('Your calendar should now show the correct data.');
    } else {
      console.log('\n✅ No orphaned calendar entries found.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCalendarDuplicates();