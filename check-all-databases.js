const { PrismaClient } = require('@prisma/client')

async function checkDatabase(dbPath, name) {
  console.log(`\n=== Checking ${name} (${dbPath}) ===`)
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: `file:${dbPath}`
      }
    }
  })
  
  try {
    // Check users
    const users = await prisma.user.findMany()
    console.log(`👥 Users: ${users.length}`)
    
    if (users.length > 0) {
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name || 'No name'} (${user.email}) - ID: ${user.id}`)
      })
    }
    
    // Check trades
    const trades = await prisma.trade.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`📊 Trades: ${trades.length}`)
    
    if (trades.length > 0) {
      console.log('\nFirst 5 trades:')
      trades.slice(0, 5).forEach((trade, index) => {
        const pnl = trade.netPnL ? `$${trade.netPnL.toFixed(2)}` : 'Open'
        console.log(`   ${index + 1}. ${trade.symbol} ${trade.side} ${trade.quantity}@$${trade.entryPrice} - ${pnl}`)
        console.log(`      User: ${trade.userId} | Date: ${trade.entryDate.toLocaleDateString()}`)
      })
    }
    
  } catch (error) {
    console.error(`❌ Error checking ${name}:`, error.message)
  } finally {
    await prisma.$disconnect()
  }
}

async function main() {
  // Check all known database files
  await checkDatabase('./prisma/dev.db', 'Current dev.db')
  await checkDatabase('./prisma/dev-nftmike.db', 'Backup dev-nftmike.db')
  await checkDatabase('./prisma/prisma/dev.db', 'Nested dev.db')
}

main().catch(console.error)