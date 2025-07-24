const { PrismaClient } = require('@prisma/client')
const fs = require('fs')

const prisma = new PrismaClient()

async function validateCsvTrades() {
  try {
    console.log('🔍 Validating CSV trades against database...\n')
    
    // Read CSV file
    const csvContent = fs.readFileSync('/mnt/c/Users/nftmi/OneDrive/Desktop/TRADING/PerformanceJULY2025/JUL-23-7-25-Performance.csv', 'utf8')
    const lines = csvContent.split('\n').filter(line => line.trim())
    const headers = lines[0].split(',')
    
    console.log(`📊 CSV Analysis:`)
    console.log(`  Total rows: ${lines.length - 1}`)
    console.log(`  Headers: ${headers.join(', ')}\n`)
    
    // Parse CSV trades
    const csvTrades = []
    let totalCsvPnL = 0
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',')
      if (values.length < 10) continue // Skip incomplete rows
      
      const pnlString = values[9] // pnl column
      const pnlValue = parseFloat(pnlString.replace(/[$()]/g, ''))
      const isNegative = pnlString.includes('$(') || pnlString.includes('-')
      const finalPnL = isNegative ? -Math.abs(pnlValue) : pnlValue
      
      totalCsvPnL += finalPnL
      
      const trade = {
        symbol: values[0],
        buyPrice: parseFloat(values[7]),
        sellPrice: parseFloat(values[8]),
        pnl: finalPnL,
        buyTimestamp: values[10],
        sellTimestamp: values[11],
        quantity: parseInt(values[6])
      }
      
      csvTrades.push(trade)
    }
    
    console.log(`💰 CSV Totals:`)
    console.log(`  Total trades: ${csvTrades.length}`)
    console.log(`  Total P&L: $${totalCsvPnL.toFixed(2)}\n`)
    
    // Get trades from database for comparison
    const dbTrades = await prisma.trade.findMany({
      where: { 
        userId: 'cmcwu8b5m0001m17ilm0triy8',
        symbol: 'MNQU5'
      },
      select: {
        id: true,
        entryDate: true,
        exitDate: true,
        entryPrice: true,
        exitPrice: true,
        netPnL: true,
        quantity: true,
        status: true
      },
      orderBy: { entryDate: 'desc' }
    })
    
    const closedDbTrades = dbTrades.filter(t => t.status === 'CLOSED')
    const totalDbPnL = closedDbTrades.reduce((sum, trade) => sum + (trade.netPnL || 0), 0)
    
    console.log(`🗄️ Database Totals:`)
    console.log(`  Total MNQU5 trades: ${dbTrades.length}`)
    console.log(`  Closed trades: ${closedDbTrades.length}`)
    console.log(`  Total P&L: $${totalDbPnL.toFixed(2)}\n`)
    
    // Compare the two
    console.log(`🔍 Comparison:`)
    console.log(`  CSV P&L: $${totalCsvPnL.toFixed(2)}`)
    console.log(`  DB P&L:  $${totalDbPnL.toFixed(2)}`)
    console.log(`  Difference: $${(totalCsvPnL - totalDbPnL).toFixed(2)}\n`)
    
    // Check if CSV trades are in the database by date/price matching
    console.log(`📋 Trade Matching Analysis:`)
    let matchedTrades = 0
    let unmatchedCsvTrades = []
    
    for (const csvTrade of csvTrades) {
      // Try to find matching trade in DB
      const matched = closedDbTrades.find(dbTrade => {
        const entryMatch = Math.abs(dbTrade.entryPrice - csvTrade.buyPrice) < 0.01
        const exitMatch = Math.abs(dbTrade.exitPrice - csvTrade.sellPrice) < 0.01
        const pnlMatch = Math.abs((dbTrade.netPnL || 0) - csvTrade.pnl) < 0.01
        
        return entryMatch && exitMatch && pnlMatch
      })
      
      if (matched) {
        matchedTrades++
      } else {
        unmatchedCsvTrades.push(csvTrade)
      }
    }
    
    console.log(`  Matched trades: ${matchedTrades}/${csvTrades.length}`)
    console.log(`  Unmatched CSV trades: ${unmatchedCsvTrades.length}`)
    
    if (unmatchedCsvTrades.length > 0) {
      console.log(`\n❌ Unmatched CSV trades:`)
      unmatchedCsvTrades.forEach((trade, index) => {
        console.log(`  ${index + 1}. Buy: $${trade.buyPrice} | Sell: $${trade.sellPrice} | P&L: $${trade.pnl} | Date: ${trade.buyTimestamp}`)
      })
    }
    
    // Let's also check for recent database trades that might not be in CSV
    console.log(`\n📅 Recent DB trades (last 10):`)
    closedDbTrades.slice(0, 10).forEach((trade, index) => {
      console.log(`  ${index + 1}. Entry: $${trade.entryPrice} | Exit: $${trade.exitPrice} | P&L: $${trade.netPnL} | Date: ${trade.entryDate?.toLocaleDateString()}`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

validateCsvTrades()