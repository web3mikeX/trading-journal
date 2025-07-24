const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function importMissingTrades() {
  try {
    console.log('📥 Importing missing trades from CSV...\n')
    
    const userId = 'cmcwu8b5m0001m17ilm0triy8'
    
    // First, let's clear existing MNQU5 trades to avoid duplicates
    console.log('🗑️ Clearing existing MNQU5 trades...')
    const deletedTrades = await prisma.trade.deleteMany({
      where: {
        userId: userId,
        symbol: 'MNQU5'
      }
    })
    console.log(`  Deleted ${deletedTrades.count} existing MNQU5 trades\n`)
    
    // Read CSV file
    const csvPath = path.join(process.env.HOME || process.env.USERPROFILE || __dirname, 'OneDrive', 'Desktop', 'TRADING', 'PerformanceJULY2025', 'JUL-23-7-25-Performance.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf8')
    const lines = csvContent.split('\n').filter(line => line.trim())
    
    console.log('📊 Processing CSV trades...')
    
    const tradesToImport = []
    let totalCsvPnL = 0
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',')
      if (values.length < 12) continue
      
      // Parse CSV values
      const symbol = values[0].trim()
      const quantity = parseInt(values[6])
      const buyPrice = parseFloat(values[7])
      const sellPrice = parseFloat(values[8])
      const pnlString = values[9]
      const buyTimestamp = values[10]
      const sellTimestamp = values[11]
      
      // Parse P&L
      const pnlValue = parseFloat(pnlString.replace(/[$()]/g, ''))
      const isNegative = pnlString.includes('$(') || pnlString.includes('-')
      const csvPnL = isNegative ? -Math.abs(pnlValue) : pnlValue
      totalCsvPnL += csvPnL
      
      // Parse timestamps
      const entryDate = new Date(buyTimestamp)
      const exitDate = new Date(sellTimestamp)
      
      // Determine trade side based on timestamps and prices
      // If buy timestamp is before sell timestamp, it's a LONG trade
      // If sell timestamp is before buy timestamp, it's a SHORT trade
      const isLongTrade = entryDate <= exitDate
      
      const side = isLongTrade ? 'LONG' : 'SHORT'
      const entryPrice = isLongTrade ? buyPrice : sellPrice
      const exitPrice = isLongTrade ? sellPrice : buyPrice
      const actualEntryDate = isLongTrade ? entryDate : exitDate
      const actualExitDate = isLongTrade ? exitDate : entryDate
      
      // Calculate P&L using our formula to verify
      const contractMultiplier = 2.0
      const pointsDifference = side === 'LONG' 
        ? (exitPrice - entryPrice)
        : (entryPrice - exitPrice)
      const calculatedPnL = pointsDifference * quantity * contractMultiplier
      
      const trade = {
        userId,
        symbol,
        side,
        entryDate: actualEntryDate,
        exitDate: actualExitDate,
        entryPrice,
        exitPrice,
        quantity,
        market: 'FUTURES',
        status: 'CLOSED',
        grossPnL: calculatedPnL,
        netPnL: calculatedPnL, // No fees in CSV
        entryFees: 0,
        exitFees: 0,
        commission: 0,
        swap: 0,
        contractMultiplier: contractMultiplier,
        dataSource: 'tradovate_csv',
        notes: `Imported from Tradovate CSV. Original CSV P&L: $${csvPnL}`,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      tradesToImport.push(trade)
      
      console.log(`  ${i}. ${symbol} ${side} | Entry: $${entryPrice} | Exit: $${exitPrice} | Calc P&L: $${calculatedPnL.toFixed(2)} | CSV P&L: $${csvPnL.toFixed(2)}`)
    }
    
    console.log(`\n📋 Import Summary:`)
    console.log(`  Trades to import: ${tradesToImport.length}`)
    console.log(`  Total CSV P&L: $${totalCsvPnL.toFixed(2)}`)
    console.log(`  Total calculated P&L: $${tradesToImport.reduce((sum, t) => sum + t.netPnL, 0).toFixed(2)}\n`)
    
    // Import trades to database
    console.log('💾 Importing trades to database...')
    
    for (const trade of tradesToImport) {
      await prisma.trade.create({
        data: trade
      })
    }
    
    console.log(`✅ Successfully imported ${tradesToImport.length} trades!\n`)
    
    // Verify the import
    const importedTrades = await prisma.trade.findMany({
      where: {
        userId: userId,
        symbol: 'MNQU5'
      }
    })
    
    const importedPnL = importedTrades
      .filter(t => t.status === 'CLOSED')
      .reduce((sum, trade) => sum + (trade.netPnL || 0), 0)
    
    console.log('🔍 Verification:')
    console.log(`  Imported trades count: ${importedTrades.length}`)
    console.log(`  Imported total P&L: $${importedPnL.toFixed(2)}`)
    
    // Calculate new account balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { startingBalance: true }
    })
    
    if (user && user.startingBalance) {
      const newBalance = user.startingBalance + importedPnL
      console.log(`  Starting balance: $${user.startingBalance}`)
      console.log(`  New calculated balance: $${newBalance.toFixed(2)}`)
      console.log(`  Target TopStep balance: $51,284.14`)
      console.log(`  Difference: $${(51284.14 - newBalance).toFixed(2)}`)
    }
    
  } catch (error) {
    console.error('❌ Error importing trades:', error)
  } finally {
    await prisma.$disconnect()
  }
}

importMissingTrades()