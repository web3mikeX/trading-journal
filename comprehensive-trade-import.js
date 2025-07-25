const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

const userId = 'cmcwu8b5m0001m17ilm0triy8'

// CSV files to import (in chronological order)
const csvFiles = [
  'C:\\Users\\nftmi\\OneDrive\\Desktop\\TRADING\\MARCH-APRIL Performance.csv',
  'C:\\Users\\nftmi\\OneDrive\\Desktop\\TRADING\\APRIL-MAY Performance.csv', 
  'C:\\Users\\nftmi\\OneDrive\\Desktop\\TRADING\\June2025Performance.csv',
  'C:\\Users\\nftmi\\OneDrive\\Desktop\\TRADING\\PerformanceJULY2025\\JUL-23-7-25-Performance.csv'
]

// Contract specifications with correct multipliers
const contractSpecs = {
  'MNQH5': { multiplier: 2.0, tickValue: 0.5 },
  'MNQM5': { multiplier: 2.0, tickValue: 0.5 },
  'MNQU5': { multiplier: 2.0, tickValue: 0.5 },
  'MNQ': { multiplier: 2.0, tickValue: 0.5 },
  'MES': { multiplier: 5.0, tickValue: 1.25 },
  'MYM': { multiplier: 0.5, tickValue: 1.0 }
}

// TopStep fee structure
const TOPSTEP_COMMISSION = 1.34 // per round trip
const TOPSTEP_ENTRY_FEE = 0.05
const TOPSTEP_EXIT_FEE = 0.05

function getContractSpec(symbol) {
  // Check for exact match first
  if (contractSpecs[symbol]) {
    return contractSpecs[symbol]
  }
  
  // Check for base symbol (remove month codes)
  const baseSymbol = symbol.replace(/[HMUZ]\d+$/, '')
  if (contractSpecs[baseSymbol]) {
    return contractSpecs[baseSymbol]
  }
  
  // Default for futures
  return { multiplier: 1.0, tickValue: 1.0 }
}

function parsePnL(pnlString) {
  if (!pnlString || pnlString === '') return 0
  
  // Remove $ and parentheses, handle negative values
  const cleanString = pnlString.replace(/[$()]/g, '')
  const value = parseFloat(cleanString)
  
  // If original had parentheses or negative sign, make it negative
  const isNegative = pnlString.includes('$(') || pnlString.includes('-')
  return isNegative ? -Math.abs(value) : value
}

function parseTimestamp(timestampString) {
  // Convert MM/DD/YYYY HH:MM:SS to ISO format
  const [datePart, timePart] = timestampString.split(' ')
  const [month, day, year] = datePart.split('/')
  const [hours, minutes, seconds] = timePart.split(':')
  
  // Create date in UTC
  return new Date(Date.UTC(
    parseInt(year),
    parseInt(month) - 1, // Month is 0-indexed
    parseInt(day),
    parseInt(hours),
    parseInt(minutes),
    parseInt(seconds)
  ))
}

function calculateCorrectPnL(trade) {
  const spec = getContractSpec(trade.symbol)
  const pointDifference = trade.sellPrice - trade.buyPrice
  const grossPnL = pointDifference * trade.qty * spec.multiplier
  
  // Apply TopStep fees
  const commission = TOPSTEP_COMMISSION * trade.qty
  const entryFees = TOPSTEP_ENTRY_FEE * trade.qty
  const exitFees = TOPSTEP_EXIT_FEE * trade.qty
  const totalFees = commission + entryFees + exitFees
  
  const netPnL = grossPnL - totalFees
  
  return {
    grossPnL: parseFloat(grossPnL.toFixed(2)),
    netPnL: parseFloat(netPnL.toFixed(2)),
    commission: parseFloat(commission.toFixed(2)),
    entryFees: parseFloat(entryFees.toFixed(2)),
    exitFees: parseFloat(exitFees.toFixed(2)),
    contractMultiplier: spec.multiplier
  }
}

async function importCSV(filePath, dataSource) {
  console.log(`\n📥 Importing ${filePath}...`)
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`)
    return { imported: 0, errors: 0 }
  }

  const csvContent = fs.readFileSync(filePath, 'utf8')
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim())
  
  console.log(`  Found ${lines.length - 1} trades in CSV`)
  
  let imported = 0
  let errors = 0
  let totalGrossPnL = 0
  let totalNetPnL = 0

  for (let i = 1; i < lines.length; i++) {
    try {
      const values = lines[i].split(',')
      if (values.length < 12) continue

      // Parse CSV values
      const symbol = values[0].trim()
      const quantity = parseInt(values[6])
      const buyPrice = parseFloat(values[7])
      const sellPrice = parseFloat(values[8])
      const csvPnL = parsePnL(values[9])
      const buyTimestamp = parseTimestamp(values[10])
      const sellTimestamp = parseTimestamp(values[11])

      // Calculate correct P&L with proper fees
      const calculatedPnL = calculateCorrectPnL({
        symbol,
        qty: quantity,
        buyPrice,
        sellPrice
      })

      // Prepare trade data
      const tradeData = {
        userId,
        symbol,
        side: sellPrice > buyPrice ? 'LONG' : 'SHORT',
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
        dataSource: dataSource
      }

      // Create trade
      await prisma.trade.create({ data: tradeData })
      
      imported++
      totalGrossPnL += calculatedPnL.grossPnL
      totalNetPnL += calculatedPnL.netPnL

      if (imported % 10 === 0) {
        console.log(`    Imported ${imported} trades...`)
      }

    } catch (error) {
      console.error(`    Error processing line ${i}:`, error.message)
      errors++
    }
  }

  console.log(`  ✅ Imported ${imported} trades`)
  console.log(`  📊 Gross P&L: $${totalGrossPnL.toFixed(2)}`)
  console.log(`  📊 Net P&L: $${totalNetPnL.toFixed(2)}`)
  if (errors > 0) {
    console.log(`  ⚠️ Errors: ${errors}`)
  }

  return { imported, errors, totalGrossPnL, totalNetPnL }
}

async function comprehensiveImport() {
  try {
    console.log('🔄 COMPREHENSIVE TRADE IMPORT STARTING...')
    console.log('==========================================\n')

    // 1. Clear existing trades
    console.log('🗑️ Clearing existing trades...')
    const deleteResult = await prisma.trade.deleteMany({
      where: { userId }
    })
    console.log(`  Deleted ${deleteResult.count} existing trades\n`)

    // 2. Import from all CSV files
    let totalImported = 0
    let totalErrors = 0
    let totalGross = 0
    let totalNet = 0

    for (const filePath of csvFiles) {
      const fileName = path.basename(filePath)
      const dataSource = `csv_comprehensive_${fileName.replace(/[^a-zA-Z0-9]/g, '_')}`
      
      const result = await importCSV(filePath, dataSource)
      totalImported += result.imported
      totalErrors += result.errors
      totalGross += result.totalGrossPnL || 0
      totalNet += result.totalNetPnL || 0
    }

    // 3. Final summary
    console.log('\n==========================================')
    console.log('🎉 IMPORT COMPLETE!')
    console.log(`📊 Total trades imported: ${totalImported}`)
    console.log(`📊 Total Gross P&L: $${totalGross.toFixed(2)}`)
    console.log(`📊 Total Net P&L: $${totalNet.toFixed(2)}`)
    console.log(`📊 Target P&L: $51,177.92`)
    console.log(`📊 Difference: $${(51177.92 - totalNet).toFixed(2)}`)
    
    if (totalErrors > 0) {
      console.log(`⚠️ Total errors: ${totalErrors}`)
    }

    // 4. Verify database state
    const dbStats = await prisma.trade.aggregate({
      where: { userId, status: 'CLOSED' },
      _sum: {
        netPnL: true,
        grossPnL: true
      },
      _count: true
    })

    console.log('\n🔍 DATABASE VERIFICATION:')
    console.log(`  Trades in DB: ${dbStats._count}`)
    console.log(`  DB Net P&L: $${(dbStats._sum.netPnL || 0).toFixed(2)}`)
    console.log(`  DB Gross P&L: $${(dbStats._sum.grossPnL || 0).toFixed(2)}`)

  } catch (error) {
    console.error('❌ Import failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

comprehensiveImport()