const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

// Function to parse CSV
function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n')
  const header = lines[0].split(',')
  
  return lines.slice(1).map(line => {
    const values = line.split(',')
    const row = {}
    header.forEach((key, index) => {
      row[key] = values[index]
    })
    return row
  })
}

// Function to parse date string
function parseDate(dateString) {
  // Parse date format: "06/09/2025 23:43:53"
  const [datePart, timePart] = dateString.split(' ')
  const [month, day, year] = datePart.split('/')
  const [hours, minutes, seconds] = timePart.split(':')
  
  return new Date(year, month - 1, day, hours, minutes, seconds)
}

// Function to parse P&L
function parsePnL(pnlString) {
  // Parse P&L format: "$19.00" or "$(5.00)"
  const cleanPnl = pnlString.replace(/[$()]/g, '')
  const isNegative = pnlString.includes('(')
  return isNegative ? -parseFloat(cleanPnl) : parseFloat(cleanPnl)
}

async function restoreTrades() {
  try {
    // First, create a test user if none exists
    let user = await prisma.user.findFirst()
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          password: 'hashed_password'
        }
      })
      console.log('Created test user')
    }

    // Read CSV file
    const csvPath = path.join(__dirname, 'June2025Performance.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    const trades = parseCSV(csvContent)
    
    console.log(`Found ${trades.length} trades in CSV`)

    // Import trades
    let importedCount = 0
    for (const trade of trades) {
      try {
        const entryDate = parseDate(trade.boughtTimestamp)
        const exitDate = parseDate(trade.soldTimestamp)
        const netPnL = parsePnL(trade.pnl)
        const entryPrice = parseFloat(trade.buyPrice)
        const exitPrice = parseFloat(trade.sellPrice)
        const quantity = parseInt(trade.qty)
        
        // Calculate gross P&L (assuming net P&L includes fees)
        const grossPnL = netPnL // For now, treating as same
        
        await prisma.trade.create({
          data: {
            userId: user.id,
            symbol: trade.symbol,
            side: 'LONG', // Assuming all are long trades based on CSV structure
            entryDate: entryDate,
            exitDate: exitDate,
            entryPrice: entryPrice,
            exitPrice: exitPrice,
            quantity: quantity,
            market: 'FUTURES',
            grossPnL: grossPnL,
            netPnL: netPnL,
            status: 'CLOSED',
            dataSource: 'csv_import',
            contractMultiplier: 2.0, // MNQU5 multiplier
            contractType: 'MICRO_FUTURES'
          }
        })
        
        importedCount++
      } catch (error) {
        console.error(`Error importing trade ${trade.symbol}:`, error.message)
      }
    }
    
    console.log(`Successfully imported ${importedCount} trades`)
    
    // Check final count
    const finalCount = await prisma.trade.count()
    console.log(`Total trades in database: ${finalCount}`)
    
  } catch (error) {
    console.error('Restore failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

restoreTrades()