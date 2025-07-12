const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkDatabase() {
  console.log('🔍 Checking database contents...\n')
  
  try {
    // Check users
    const users = await prisma.user.findMany()
    console.log(`👥 Total users in database: ${users.length}`)
    
    if (users.length > 0) {
      console.log('\nUsers:')
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.email}) - ID: ${user.id}`)
      })
    }
    
    // Check trades
    const trades = await prisma.trade.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`\n📊 Total trades in database: ${trades.length}`)
    
    if (trades.length > 0) {
      console.log('\nRecent trades:')
      trades.slice(0, 10).forEach((trade, index) => {
        const pnl = trade.netPnL ? `$${trade.netPnL.toFixed(2)}` : 'Open'
        console.log(`   ${index + 1}. ${trade.symbol} ${trade.side} ${trade.quantity}@$${trade.entryPrice} - ${pnl}`)
        console.log(`      User: ${trade.user?.name || 'Unknown'} | Date: ${trade.entryDate.toLocaleDateString()}`)
        console.log(`      ID: ${trade.id} | Hash: ${trade.tradeHash?.substring(0, 16)}...`)
      })
      
      if (trades.length > 10) {
        console.log(`   ... and ${trades.length - 10} more trades`)
      }
    } else {
      console.log('\n📝 No trades found in database')
      console.log('\nPossible reasons:')
      console.log('   1. No trades have been imported yet')
      console.log('   2. Trades were imported under a different user ID')
      console.log('   3. Database was cleared/reset')
    }
    
    // Check for any test data that might be lingering
    const testUsers = await prisma.user.findMany({
      where: {
        email: {
          contains: 'test'
        }
      }
    })
    
    if (testUsers.length > 0) {
      console.log(`\n🧪 Found ${testUsers.length} test users (these can be cleaned up)`)
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()