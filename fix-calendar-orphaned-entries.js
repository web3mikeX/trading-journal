const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixCalendarOrphanedEntries() {
  try {
    console.log('🔍 SCANNING FOR ORPHANED CALENDAR ENTRIES...\n');
    
    // Get the user ID
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('❌ No user found in database');
      return;
    }
    
    console.log(`👤 Using user ID: ${user.id}\n`);
    
    // Find all calendar entries that have trading statistics
    const suspiciousEntries = await prisma.calendarEntry.findMany({
      where: {
        userId: user.id,
        OR: [
          { dailyPnL: { not: null } },
          { tradesCount: { gt: 0 } },
          { winningTrades: { gt: 0 } },
          { losingTrades: { gt: 0 } },
          { winRate: { not: null } }
        ]
      },
      select: {
        id: true,
        date: true,
        dailyPnL: true,
        tradesCount: true,
        winningTrades: true,
        losingTrades: true,
        winRate: true,
        notes: true,
        mood: true,
        images: true,
        createdAt: true
      },
      orderBy: { date: 'asc' }
    });
    
    console.log(`📋 Found ${suspiciousEntries.length} calendar entries with trading statistics\n`);
    
    const orphanedEntries = [];
    const validEntries = [];
    const entriesToUpdate = [];
    
    for (const entry of suspiciousEntries) {
      const entryDateStr = entry.date.toISOString().split('T')[0];
      const dayStart = new Date(entryDateStr + 'T00:00:00.000Z');
      const dayEnd = new Date(entryDateStr + 'T23:59:59.999Z');
      
      // Check for actual trades on this date
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
          netPnL: true,
          status: true
        }
      });
      
      const actualTradeCount = actualTrades.length;
      const actualPnL = actualTrades.reduce((sum, trade) => sum + (trade.netPnL || 0), 0);
      const actualClosedTrades = actualTrades.filter(t => t.status === 'CLOSED');
      const actualWinningTrades = actualClosedTrades.filter(t => (t.netPnL || 0) > 0);
      const actualWinRate = actualClosedTrades.length > 0 ? (actualWinningTrades.length / actualClosedTrades.length) * 100 : 0;
      
      console.log(`📅 ${entryDateStr}:`);
      console.log(`   Stored: ${entry.tradesCount || 0} trades, $${(entry.dailyPnL || 0).toFixed(2)} P&L`);
      console.log(`   Actual: ${actualTradeCount} trades, $${actualPnL.toFixed(2)} P&L`);
      
      const hasValidDiaryData = entry.notes || entry.mood || entry.images;
      
      if (actualTradeCount === 0 && (entry.tradesCount > 0 || entry.dailyPnL !== 0)) {
        // This is an orphaned entry with phantom trading data
        if (hasValidDiaryData) {
          console.log(`   ⚠️  ORPHANED with diary data - will clean trading stats only`);
          entriesToUpdate.push({
            ...entry,
            actualTradeCount,
            actualPnL,
            actualWinRate
          });
        } else {
          console.log(`   ❌ FULLY ORPHANED - will delete completely`);
          orphanedEntries.push(entry);
        }
      } else if (actualTradeCount > 0 && (
        Math.abs((entry.dailyPnL || 0) - actualPnL) > 0.01 ||
        (entry.tradesCount || 0) !== actualTradeCount
      )) {
        console.log(`   🔧 INCONSISTENT - will update with correct values`);
        entriesToUpdate.push({
          ...entry,
          actualTradeCount,
          actualPnL,
          actualWinRate
        });
      } else {
        console.log(`   ✅ VALID`);
        validEntries.push(entry);
      }
      console.log('');
    }
    
    console.log('📊 SUMMARY:');
    console.log(`   ✅ Valid entries: ${validEntries.length}`);
    console.log(`   🔧 Entries to update: ${entriesToUpdate.length}`);
    console.log(`   ❌ Entries to delete: ${orphanedEntries.length}`);
    console.log('');
    
    // Show specific entries that will be affected
    if (orphanedEntries.length > 0) {
      console.log('🗑️  ENTRIES TO DELETE:');
      for (const entry of orphanedEntries) {
        const dateStr = entry.date.toISOString().split('T')[0];
        console.log(`   ${dateStr}: ${entry.tradesCount || 0} phantom trades, $${(entry.dailyPnL || 0).toFixed(2)} phantom P&L`);
      }
      console.log('');
    }
    
    if (entriesToUpdate.length > 0) {
      console.log('🔧 ENTRIES TO UPDATE:');
      for (const entry of entriesToUpdate) {
        const dateStr = entry.date.toISOString().split('T')[0];
        console.log(`   ${dateStr}: ${entry.tradesCount || 0} → ${entry.actualTradeCount} trades, $${(entry.dailyPnL || 0).toFixed(2)} → $${entry.actualPnL.toFixed(2)} P&L`);
      }
      console.log('');
    }
    
    // Perform the cleanup
    let deletedCount = 0;
    let updatedCount = 0;
    
    if (orphanedEntries.length > 0) {
      console.log('🗑️  DELETING FULLY ORPHANED ENTRIES...');
      for (const entry of orphanedEntries) {
        await prisma.calendarEntry.delete({
          where: { id: entry.id }
        });
        deletedCount++;
        const dateStr = entry.date.toISOString().split('T')[0];
        console.log(`   ✅ Deleted: ${dateStr}`);
      }
      console.log('');
    }
    
    if (entriesToUpdate.length > 0) {
      console.log('🔧 UPDATING INCONSISTENT ENTRIES...');
      for (const entry of entriesToUpdate) {
        await prisma.calendarEntry.update({
          where: { id: entry.id },
          data: {
            dailyPnL: entry.actualTradeCount > 0 ? entry.actualPnL : null,
            tradesCount: entry.actualTradeCount,
            winningTrades: entry.actualTradeCount > 0 ? entry.actualWinRate > 0 ? Math.round(entry.actualTradeCount * entry.actualWinRate / 100) : 0 : 0,
            losingTrades: entry.actualTradeCount > 0 ? entry.actualTradeCount - Math.round(entry.actualTradeCount * entry.actualWinRate / 100) : 0,
            winRate: entry.actualTradeCount > 0 ? entry.actualWinRate : null
          }
        });
        updatedCount++;
        const dateStr = entry.date.toISOString().split('T')[0];
        console.log(`   ✅ Updated: ${dateStr}`);
      }
      console.log('');
    }
    
    console.log('🎉 CLEANUP COMPLETED!');
    console.log(`   📊 Summary: ${deletedCount} deleted, ${updatedCount} updated, ${validEntries.length} already correct`);
    console.log(`   ✅ July 7th and July 10th should now show correct $0.00 P&L if they had no trades`);
    
    // Final verification for July 7th and July 10th specifically
    console.log('\n🔍 VERIFYING JULY 7TH AND 10TH...');
    
    const julyDates = ['2025-07-07', '2025-07-10'];
    for (const dateStr of julyDates) {
      const dayStart = new Date(dateStr + 'T00:00:00.000Z');
      const dayEnd = new Date(dateStr + 'T23:59:59.999Z');
      
      const trades = await prisma.trade.findMany({
        where: {
          userId: user.id,
          entryDate: { gte: dayStart, lte: dayEnd }
        }
      });
      
      const calendarEntry = await prisma.calendarEntry.findUnique({
        where: {
          userId_date: {
            userId: user.id,
            date: new Date(dateStr)
          }
        }
      });
      
      console.log(`📅 ${dateStr}:`);
      console.log(`   Actual trades: ${trades.length}`);
      console.log(`   Calendar entry: ${calendarEntry ? `${calendarEntry.tradesCount || 0} trades, $${(calendarEntry.dailyPnL || 0).toFixed(2)} P&L` : 'None'}`);
      
      if (trades.length === 0 && calendarEntry && (calendarEntry.dailyPnL !== 0 || calendarEntry.tradesCount > 0)) {
        console.log(`   ❌ Still showing phantom data!`);
      } else {
        console.log(`   ✅ Correct!`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
fixCalendarOrphanedEntries();