const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Function to parse date string
function parseDate(dateString) {
  // Parse date format: "07/19/2025 00:35:24"
  const [datePart, timePart] = dateString.split(' ');
  const [month, day, year] = datePart.split('/');
  const [hours, minutes, seconds] = timePart.split(':');
  
  return new Date(year, month - 1, day, hours, minutes, seconds);
}

// Function to parse P&L
function parsePnL(pnlString) {
  // Parse P&L format: "$85.00" or "$(61.00)"
  const cleanPnl = pnlString.replace(/[$()]/g, '');
  const isNegative = pnlString.includes('(');
  return isNegative ? -parseFloat(cleanPnl) : parseFloat(cleanPnl);
}

async function importMissingTrade() {
  try {
    // Get user
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('No user found');
      return;
    }
    
    console.log('Using user ID:', user.id);
    
    // Define both trades from CSV
    const csvTrades = [
      {
        symbol: 'MNQU5',
        qty: '1',
        buyPrice: '22306.75',
        sellPrice: '22349.25',
        pnl: '$85.00',
        boughtTimestamp: '07/19/2025 00:35:24',
        soldTimestamp: '07/19/2025 00:37:36',
        duration: '2min 11sec'
      },
      {
        symbol: 'MNQU5',
        qty: '1',
        buyPrice: '22355.25',
        sellPrice: '22324.75',
        pnl: '$(61.00)',
        boughtTimestamp: '07/19/2025 00:38:06',
        soldTimestamp: '07/19/2025 00:39:25',
        duration: '1min 19sec'
      }
    ];
    
    console.log('=== Attempting to Import Both Trades ===');
    
    for (let i = 0; i < csvTrades.length; i++) {
      const trade = csvTrades[i];
      
      console.log(`\nTrade ${i + 1}:`);
      console.log(`  ${trade.symbol} ${trade.qty} contracts`);
      console.log(`  ${trade.buyPrice} → ${trade.sellPrice} = ${trade.pnl}`);
      console.log(`  ${trade.boughtTimestamp} → ${trade.soldTimestamp}`);
      
      try {
        const entryDate = parseDate(trade.boughtTimestamp);
        const exitDate = parseDate(trade.soldTimestamp);
        const netPnL = parsePnL(trade.pnl);
        const entryPrice = parseFloat(trade.buyPrice);
        const exitPrice = parseFloat(trade.sellPrice);
        const quantity = parseInt(trade.qty);
        
        console.log(`  Parsed entry date: ${entryDate.toISOString()}`);
        console.log(`  Parsed exit date: ${exitDate.toISOString()}`);
        console.log(`  Parsed P&L: ${netPnL}`);
        
        // Check if trade already exists
        const existingTrade = await prisma.trade.findFirst({
          where: {
            userId: user.id,
            symbol: trade.symbol,
            entryDate: entryDate,
            entryPrice: entryPrice,
            exitPrice: exitPrice,
            quantity: quantity
          }
        });
        
        if (existingTrade) {
          console.log(`  ✅ Trade already exists in database (ID: ${existingTrade.id})`);
          continue;
        }
        
        // Create trade hash for duplicate detection
        const tradeHash = `${trade.symbol}_${entryPrice}_${exitPrice}_${quantity}_${entryDate.getTime()}`;
        
        const newTrade = await prisma.trade.create({
          data: {
            userId: user.id,
            symbol: trade.symbol,
            side: 'LONG', // Assuming long based on CSV structure
            entryDate: entryDate,
            exitDate: exitDate,
            entryPrice: entryPrice,
            exitPrice: exitPrice,
            quantity: quantity,
            market: 'FUTURES',
            grossPnL: netPnL,
            netPnL: netPnL,
            status: 'CLOSED',
            dataSource: 'manual_import',
            contractMultiplier: 2.0,
            contractType: 'MICRO_FUTURES',
            tradeHash: tradeHash
          }
        });
        
        console.log(`  ✅ Successfully imported trade (ID: ${newTrade.id})`);
        
      } catch (error) {
        console.log(`  ❌ Failed to import trade: ${error.message}`);
        console.log(`  Full error:`, error);
      }
    }
    
    // Check final result
    const july19Trades = await prisma.trade.findMany({
      where: {
        userId: user.id,
        entryDate: {
          gte: new Date('2025-07-19T00:00:00.000Z'),
          lte: new Date('2025-07-19T23:59:59.999Z')
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
        dataSource: true
      },
      orderBy: {
        entryDate: 'asc'
      }
    });
    
    console.log(`\n=== Final Result ===`);
    console.log(`Total trades for July 19th: ${july19Trades.length}`);
    
    july19Trades.forEach((trade, index) => {
      console.log(`${index + 1}. ${trade.symbol} ${trade.side} - ${trade.entryPrice} → ${trade.exitPrice} - P&L: $${trade.netPnL} - Source: ${trade.dataSource}`);
    });
    
  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importMissingTrade();