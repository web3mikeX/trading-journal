const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixMNQU5Fees() {
  try {
    const userId = 'cmcwu8b5m0001m17ilm0triy8';
    const tradeId = 'cmdiwnwfk0001m1z8f07u9qxc'; // The $300 profit trade
    
    console.log('🔧 FIXING MNQU5 FEE CALCULATION');
    console.log('===============================');
    
    // Get the current trade data
    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
      select: {
        id: true,
        symbol: true,
        quantity: true,
        grossPnL: true,
        netPnL: true,
        commission: true,
        entryFees: true,
        exitFees: true
      }
    });
    
    if (!trade) {
      console.log('❌ Trade not found');
      return;
    }
    
    console.log('Current trade data:');
    console.log(`Symbol: ${trade.symbol}`);
    console.log(`Quantity: ${trade.quantity}`);
    console.log(`Gross P&L: $${trade.grossPnL}`);
    console.log(`Net P&L: $${trade.netPnL}`);
    console.log(`Commission: $${trade.commission}`);
    console.log(`Entry Fees: $${trade.entryFees}`);
    console.log(`Exit Fees: $${trade.exitFees}`);
    
    // Calculate correct fees
    const correctCommission = 1.34 * trade.quantity; // $1.34 per contract
    const correctNetPnL = trade.grossPnL - correctCommission;
    
    console.log();
    console.log('Corrected calculations:');
    console.log(`Correct Commission: $${correctCommission.toFixed(2)} (${trade.quantity} × $1.34)`);
    console.log(`Correct Net P&L: $${correctNetPnL.toFixed(2)} (${trade.grossPnL} - ${correctCommission.toFixed(2)})`);
    
    // Update the trade
    const updatedTrade = await prisma.trade.update({
      where: { id: tradeId },
      data: {
        commission: correctCommission,
        netPnL: correctNetPnL,
        entryFees: 0, // Clear any incorrect entry fees
        exitFees: 0   // Clear any incorrect exit fees
      }
    });
    
    console.log();
    console.log('✅ TRADE UPDATED SUCCESSFULLY');
    console.log(`New Commission: $${updatedTrade.commission}`);
    console.log(`New Net P&L: $${updatedTrade.netPnL}`);
    
    // Verify the fix
    console.log();
    console.log('🔍 VERIFICATION:');
    console.log('================');
    console.log(`Expected Net P&L: $295.98`);
    console.log(`Actual Net P&L: $${updatedTrade.netPnL}`);
    console.log(`Match: ${Math.abs(updatedTrade.netPnL - 295.98) < 0.01 ? '✅ YES' : '❌ NO'}`);
    
  } catch (error) {
    console.error('❌ Error fixing fees:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMNQU5Fees();