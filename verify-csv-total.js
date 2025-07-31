const fs = require('fs')

const julyCsvFile = 'c:/Users/nftmi/OneDrive/Desktop/TRADING/PerformanceJULY2025/JULY_AS_OF_25th_Performance.csv'

function parsePnL(pnlString) {
  if (!pnlString || pnlString === '') return 0
  
  // Remove $ and parentheses, handle negative values
  const cleanString = pnlString.replace(/[$()]/g, '')
  const value = parseFloat(cleanString)
  
  // If original had parentheses, make it negative
  const isNegative = pnlString.includes('$(')
  return isNegative ? -Math.abs(value) : value
}

console.log('🔍 VERIFYING CSV TOTAL P&L')
console.log('==========================\n')

const csvContent = fs.readFileSync(julyCsvFile, 'utf8')
const lines = csvContent.split(/\r?\n/).filter(line => line.trim())

console.log(`Total lines: ${lines.length}`)
console.log(`Header: ${lines[0]}`)
console.log(`Trade lines: ${lines.length - 1}\n`)

let totalPnL = 0
let tradeCount = 0

console.log('INDIVIDUAL TRADE P&L:')
console.log('=====================')

for (let i = 1; i < lines.length; i++) {
  const values = lines[i].split(',')
  if (values.length < 10) {
    console.log(`Skipping incomplete line ${i}: ${lines[i]}`)
    continue
  }

  const symbol = values[0].trim()
  const quantity = parseInt(values[6])
  const csvPnL = parsePnL(values[9])
  
  console.log(`Trade ${tradeCount + 1}: ${symbol} (${quantity} contracts) - P&L: $${csvPnL}`)
  
  totalPnL += csvPnL
  tradeCount++
}

console.log('\n📊 SUMMARY:')
console.log('===========')
console.log(`Total trades processed: ${tradeCount}`)
console.log(`Total P&L from CSV: $${totalPnL.toFixed(2)}`)
console.log(`Expected TopStep P&L: $1177.92`)
console.log(`Difference: $${(totalPnL - 1177.92).toFixed(2)}`)

if (Math.abs(totalPnL - 1177.92) > 0.01) {
  console.log('\n⚠️ DISCREPANCY FOUND!')
  console.log('There is a difference between CSV total and expected TopStep total.')
  console.log('Please verify:')
  console.log('1. CSV file contains all July trades')
  console.log('2. No trades are missing or duplicated')
  console.log('3. TopStep account shows the correct total')
} else {
  console.log('\n✅ TOTALS MATCH!')
  console.log('CSV total matches expected TopStep total.')
}