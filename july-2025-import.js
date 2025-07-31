const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

const userId = 'cmcwu8b5m0001m17ilm0triy8'

// July 2025 CSV file path
const julyCsvFile = 'c:/Users/nftmi/OneDrive/Desktop/TRADING/PerformanceJULY2025/JULY_AS_OF_25th_Performance.csv'

// Contract specifications for MNQU5
const contractSpecs = {
  'MNQU5': { multiplier: 2.0, tickValue: 0.5 }
}

// TopStep fee structure (as of July 2025)
const TOPSTEP_COMMISSION = 1.34 // per round trip
const TOPSTEP_ENTRY_FEE = 0.05
const TOPSTEP_EXIT_FEE = 0.05

function getContractSpec(symbol) {
  return contractSpecs[symbol] || { multiplier: 1.0, tickValue: 1.0 }
}

function parsePnL(pnlString) {
  if (!pnlString || pnlString === '') return 0
  
  // Remove $ and parentheses, handle negative values
  const cleanString = pnlString.replace(/[$()]/g, '')
  const value = parseFloat(cleanString)
  
  // If original had parentheses, make it negative
  const isNegative = pnlString.includes('$(')
  return isNegative ? -Math.abs(value) : value
}

function parseTimestamp(timestampString) {
  // Convert MM/DD/YYYY HH:MM:SS to ISO format
  const [datePart, timePart] = timestampString.split(' ')
  const [month, day, year] = datePart.split('/')
  const [hours, minutes, seconds] = timePart.split(':')
  
  // Create date in UTC (July 2025)
  return new Date(Date.UTC(
    parseInt(year),
    parseInt(month) - 1, // Month is 0-indexed
    parseInt(day),
    parseInt(hours),
    parseInt(minutes),
    parseInt(seconds)
  ))
}

function calculateCorrectPnL(trade, csvNetPnL) {
  const spec = getContractSpec(trade.symbol)
  
  // CSV P&L is already NET (includes all fees deducted)
  // We need to back-calculate gross P&L by adding fees
  const commission = TOPSTEP_COMMISSION * trade.qty
  const entryFees = TOPSTEP_ENTRY_FEE * trade.qty
  const exitFees = TOPSTEP_EXIT_FEE * trade.qty
  const totalFees = commission + entryFees + exitFees
  
  // Use CSV net P&L directly (already includes fee deductions)
  const netPnL = csvNetPnL
  
  // Calculate gross P&L by adding fees back to net P&L
  const grossPnL = netPnL + totalFees
  
  return {
    grossPnL: parseFloat(grossPnL.toFixed(2)),
    netPnL: parseFloat(netPnL.toFixed(2)),
    commission: parseFloat(commission.toFixed(2)),
    entryFees: parseFloat(entryFees.toFixed(2)),
    exitFees: parseFloat(exitFees.toFixed(2)),
    contractMultiplier: spec.multiplier
  }
}

async function importJulyCSV() {
  console.log(`\n📥 Importing July 2025 trades from CSV...`)
  console.log(`📁 File: ${julyCsvFile}`)
  
  if (!fs.existsSync(julyCsvFile)) {
    console.log(`❌ File not found: ${julyCsvFile}`)
    return { imported: 0, errors: 0 }
  }

  const csvContent = fs.readFileSync(julyCsvFile, 'utf8')
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim())
  
  console.log(`  Found ${lines.length - 1} trades in CSV`)
  
  let imported = 0
  let errors = 0
  let totalGrossPnL = 0
  let totalNetPnL = 0
  let csvTotalPnL = 0

  for (let i = 1; i < lines.length; i++) {
    try {
      const values = lines[i].split(',')
      if (values.length < 12) continue

      // Parse CSV values (format: symbol,_priceFormat,_priceFormatType,_tickSize,buyFillId,sellFillId,qty,buyPrice,sellPrice,pnl,boughtTimestamp,soldTimestamp,duration)
      const symbol = values[0].trim()
      const quantity = parseInt(values[6])
      const buyPrice = parseFloat(values[7])
      const sellPrice = parseFloat(values[8])
      const csvPnL = parsePnL(values[9])
      const buyTimestamp = parseTimestamp(values[10])
      const sellTimestamp = parseTimestamp(values[11])

      // Calculate correct P&L using CSV net P&L (no double fee deduction)
      const calculatedPnL = calculateCorrectPnL({
        symbol,
        qty: quantity,
        buyPrice,
        sellPrice
      }, csvPnL)

      // Determine trade side
      const tradeSide = sellPrice > buyPrice ? 'LONG' : 'SHORT'

      // Prepare trade data
      const tradeData = {
        userId,
        symbol,
        side: tradeSide,
        entryDate: buyTimestamp,
        exitDate: sellTimestamp,
        entryPrice: buyPrice,
        exitPrice: sellPrice,
        quantity,
        market: 'FUTURES',
        grossPnL: calculatedPnL.grossPnL,
        netPnL: calculatedPnL.netPnL,
        commission: calculatedPnL.commission,
        entryFees: calculatedPnL.entryFees,
        exitFees: calculatedPnL.exitFees,
        swap: 0,
        contractMultiplier: calculatedPnL.contractMultiplier,
        status: 'CLOSED',
        dataSource: 'july_2025_csv_import'
      }

      // Create trade
      await prisma.trade.create({ data: tradeData })
      
      imported++
      totalGrossPnL += calculatedPnL.grossPnL
      totalNetPnL += calculatedPnL.netPnL
      csvTotalPnL += csvPnL

      console.log(`    ✅ Trade ${imported}: ${symbol} ${tradeSide} - Net P&L: $${calculatedPnL.netPnL} (CSV: $${csvPnL})`)

    } catch (error) {
      console.error(`    ❌ Error processing line ${i}:`, error.message)
      errors++
    }
  }

  console.log(`\n📊 JULY 2025 IMPORT SUMMARY`)
  console.log(`================================`)
  console.log(`  ✅ Trades imported: ${imported}`)
  console.log(`  📈 Calculated Gross P&L: $${totalGrossPnL.toFixed(2)}`)
  console.log(`  📈 Calculated Net P&L: $${totalNetPnL.toFixed(2)}`)
  console.log(`  📋 CSV Total P&L: $${csvTotalPnL.toFixed(2)}`)
  console.log(`  🎯 Difference: $${(totalNetPnL - csvTotalPnL).toFixed(2)}`)
  
  if (errors > 0) {
    console.log(`  ⚠️ Errors: ${errors}`)
  }

  return { imported, errors, totalGrossPnL, totalNetPnL, csvTotalPnL }
}

async function clearJulyTrades() {
  console.log('🗑️ Clearing existing July 2025 trades...')
  
  // Delete trades from July 2025
  const deleteResult = await prisma.trade.deleteMany({
    where: {
      userId,
      entryDate: {
        gte: new Date('2025-07-01T00:00:00.000Z'),
        lt: new Date('2025-08-01T00:00:00.000Z')
      }
    }
  })
  
  console.log(`  Deleted ${deleteResult.count} existing July trades\n`)
  return deleteResult.count
}

async function updateAccountForJuly() {
  console.log('⚙️ Updating account configuration for July start...')
  
  // Update user account for TopStep Evaluation 50K account
  await prisma.user.update({
    where: { id: userId },
    data: {
      accountStartDate: new Date('2025-07-01T00:00:00.000Z'),
      startingBalance: 50000.00, // TopStep 50K evaluation starting balance
      accountBalance: 50000.00, // Will be updated after import
      accountType: 'EVALUATION_50K', // Set proper account type
      dailyLossLimit: 1000.00, // TopStep 50K daily loss limit
      maxLossLimit: 2000.00, // TopStep 50K max loss limit (trailing drawdown)
      currentAccountHigh: 50000.00, // Will be updated after trades
      trailingDrawdownAmount: 2000.00 // TopStep 50K trailing drawdown
    }
  })
  
  console.log(`  ✅ Account type set to EVALUATION_50K`)
  console.log(`  ✅ Account start date set to July 1, 2025`)
  console.log(`  ✅ Starting balance set to $50,000.00`)
  console.log(`  ✅ Daily loss limit set to $1,000.00`)
  console.log(`  ✅ Max loss limit (trailing) set to $2,000.00\n`)
}

async function verifyImport() {
  console.log('🔍 Verifying import results...')
  
  // Get July trades from database
  const julyTrades = await prisma.trade.findMany({
    where: {
      userId,
      entryDate: {
        gte: new Date('2025-07-01T00:00:00.000Z'),
        lt: new Date('2025-08-01T00:00:00.000Z')
      }
    },
    orderBy: { entryDate: 'asc' }
  })
  
  const dbStats = await prisma.trade.aggregate({
    where: {
      userId,
      entryDate: {
        gte: new Date('2025-07-01T00:00:00.000Z'),
        lt: new Date('2025-08-01T00:00:00.000Z')
      },
      status: 'CLOSED'
    },
    _sum: {
      netPnL: true,
      grossPnL: true
    },
    _count: true
  })

  console.log(`\n✅ DATABASE VERIFICATION`)
  console.log(`========================`)
  console.log(`  Trades in DB: ${dbStats._count}`)
  console.log(`  DB Net P&L: $${(dbStats._sum.netPnL || 0).toFixed(2)}`)
  console.log(`  DB Gross P&L: $${(dbStats._sum.grossPnL || 0).toFixed(2)}`)
  console.log(`  Date range: ${julyTrades[0]?.entryDate.toISOString().split('T')[0]} to ${julyTrades[julyTrades.length - 1]?.entryDate.toISOString().split('T')[0]}`)

  return dbStats
}

async function julyImportMain() {
  try {
    console.log('🚀 JULY 2025 TRADING DATA IMPORT')
    console.log('=================================\n')

    // 1. Clear existing July trades
    await clearJulyTrades()

    // 2. Update account configuration
    await updateAccountForJuly()

    // 3. Import July CSV data
    const importResult = await importJulyCSV()

    // 4. Verify import
    await verifyImport()

    // Update final account balance and daily loss limit
    const finalBalance = 50000 + (importResult.totalNetPnL || 0)
    const dailyLossLimit = finalBalance - 1000
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        accountBalance: finalBalance,
        currentAccountHigh: Math.max(50000, finalBalance), // Track account high
      }
    })

    console.log('\n🎉 JULY 2025 IMPORT COMPLETE!')
    console.log('============================')
    console.log(`📊 Final Account Balance: $${finalBalance.toFixed(2)}`)
    console.log(`📊 Daily Loss Limit: $${dailyLossLimit.toFixed(2)} (balance - $1,000)`)
    console.log('Your trading journal is now updated with July 2025 data.')
    console.log('Dashboard will show July performance metrics only.')

  } catch (error) {
    console.error('❌ July import failed:', error)
    console.error('Stack trace:', error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

julyImportMain()