const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Check backup database
const backupPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./prisma/dev-nftmike.db'
    }
  }
})

async function checkDatabase() {
  try {
    // Check users
    const userCount = await prisma.user.count()
    console.log(`Users in database: ${userCount}`)
    
    // Check trades
    const tradeCount = await prisma.trade.count()
    console.log(`Trades in database: ${tradeCount}`)
    
    // Get recent trades if any exist
    if (tradeCount > 0) {
      const recentTrades = await prisma.trade.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          symbol: true,
          side: true,
          entryDate: true,
          status: true,
          aiSummary: true,
          createdAt: true
        }
      })
      
      console.log('\nRecent trades:')
      recentTrades.forEach(trade => {
        console.log(`- ${trade.symbol} ${trade.side} (${trade.status}) - ${trade.createdAt}`)
      })
    }
    
    // Check if there are any backup database files
    const fs = require('fs')
    const path = require('path')
    const prismaDir = path.join(__dirname, 'prisma')
    
    if (fs.existsSync(prismaDir)) {
      const files = fs.readdirSync(prismaDir)
      const dbFiles = files.filter(f => f.endsWith('.db'))
      console.log('\nDatabase files found:')
      dbFiles.forEach(file => {
        const stats = fs.statSync(path.join(prismaDir, file))
        console.log(`- ${file} (${stats.size} bytes, modified: ${stats.mtime})`)
      })
    }
    
    // Check backup database
    console.log('\n=== BACKUP DATABASE CHECK ===')
    try {
      const backupUserCount = await backupPrisma.user.count()
      console.log(`Backup users: ${backupUserCount}`)
      
      const backupTradeCount = await backupPrisma.trade.count()
      console.log(`Backup trades: ${backupTradeCount}`)
      
      if (backupTradeCount > 0) {
        const backupTrades = await backupPrisma.trade.findMany({
          take: 10,
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            id: true,
            symbol: true,
            side: true,
            entryDate: true,
            status: true,
            netPnL: true,
            createdAt: true
          }
        })
        
        console.log('\nBackup trades:')
        backupTrades.forEach(trade => {
          console.log(`- ${trade.symbol} ${trade.side} (${trade.status}) P&L: ${trade.netPnL} - ${trade.createdAt}`)
        })
      }
    } catch (backupError) {
      console.log('Backup database check failed:', backupError.message)
    }
    
  } catch (error) {
    console.error('Database check failed:', error)
  } finally {
    await prisma.$disconnect()
    await backupPrisma.$disconnect()
  }
}

checkDatabase()