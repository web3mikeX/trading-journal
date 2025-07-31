// TopStep daily data from screenshot analysis
const topstepDailyData = [
  // Date, Net P&L, P&L High, P&L Low, Contracts, Total Fees, Total Trades, Avg Winning, Avg Losing, Winning %, Max Consecutive
  { date: 'Jul 24', netPnL: -106.22, pnlHigh: -$94.02, pnlLow: -237.94, contracts: 16, totalFees: 310.72, totalTrades: 4, avgWinning: 505.68, avgLosing: -118.77, winningPct: 50.00, maxConsecutive: 2.72 },
  { date: 'Jul 22', netPnL: 595.98, pnlHigh: 595.98, pnlLow: 595.98, contracts: 6, totalFees: 54.02, totalTrades: 1, avgWinning: 595.98, avgLosing: null, winningPct: 100.00, maxConsecutive: 1.00 },
  { date: 'Jul 21', netPnL: 319.84, pnlHigh: 319.84, pnlLow: 319.84, contracts: 8, totalFees: 55.36, totalTrades: 2, avgWinning: 319.62, avgLosing: null, winningPct: 100.00, maxConsecutive: 2.00 },
  { date: 'Jul 18', netPnL: 197.32, pnlHigh: 197.32, pnlLow: 197.32, contracts: 4, totalFees: 52.08, totalTrades: 2, avgWinning: 598.06, avgLosing: null, winningPct: 100.00, maxConsecutive: 2.00 },
  { date: 'Jul 17', netPnL: 3.82, pnlHigh: 162.93, pnlLow: 23.86, contracts: 4, totalFees: 51.08, totalTrades: 2, avgWinning: 141.41, avgLosing: null, winningPct: 100.00, maxConsecutive: 2.00 },
  { date: 'Jul 15', netPnL: -226.02, pnlHigh: -91.94, pnlLow: -225.02, contracts: 6, totalFees: 54.02, totalTrades: 3, avgWinning: null, avgLosing: -75.01, winningPct: 0.00, maxConsecutive: 0.3 },
  { date: 'Jul 14', netPnL: 80.02, pnlHigh: 80.02, pnlLow: 38.94, contracts: 4, totalFees: 52.08, totalTrades: 2, avgWinning: 119.96, avgLosing: -38.94, winningPct: 50.00, maxConsecutive: 1.1 },
  { date: 'Jul 11', netPnL: 17.32, pnlHigh: 17.32, pnlLow: -63.34, contracts: 4, totalFees: 52.08, totalTrades: 2, avgWinning: 598.06, avgLosing: -63.34, winningPct: 50.00, maxConsecutive: 1.1 },
  { date: 'Jul 10', netPnL: 88.38, pnlHigh: 150.66, pnlLow: 64.64, contracts: 10, totalFees: 76.76, totalTrades: 5, avgWinning: 167.35, avgLosing: -124.67, winningPct: 40.00, maxConsecutive: 1.0 },
  { date: 'Jul 8', netPnL: 116.14, pnlHigh: 116.14, pnlLow: 67.66, contracts: 8, totalFees: 55.36, totalTrades: 4, avgWinning: 515.59, avgLosing: -49.34, winningPct: 75.00, maxConsecutive: 2.1 },
  { date: 'Jul 7', netPnL: -83.18, pnlHigh: -51.34, pnlLow: -83.18, contracts: 4, totalFees: 52.08, totalTrades: 2, avgWinning: null, avgLosing: -41.59, winningPct: 0.00, maxConsecutive: 0.2 }
]

console.log('🔍 TOPSTEP vs CSV ANALYSIS')
console.log('=========================\n')

// Calculate TopStep total
let topstepTotal = 0
let topstepTrades = 0
let topstepContracts = 0

console.log('TOPSTEP DAILY BREAKDOWN:')
console.log('========================')

topstepDailyData.forEach(day => {
  console.log(`${day.date}: $${day.netPnL.toFixed(2)} (${day.totalTrades} trades, ${day.contracts} contracts)`)
  topstepTotal += day.netPnL
  topstepTrades += day.totalTrades
  topstepContracts += day.contracts
})

console.log(`\n📊 TOPSTEP TOTALS:`)
console.log(`==================`)
console.log(`Total P&L: $${topstepTotal.toFixed(2)}`)
console.log(`Total Trades: ${topstepTrades}`)
console.log(`Total Contracts: ${topstepContracts}`)

// Load and analyze CSV data
const fs = require('fs')
const julyCsvFile = 'c:/Users/nftmi/OneDrive/Desktop/TRADING/PerformanceJULY2025/JULY_AS_OF_25th_Performance.csv'

function parsePnL(pnlString) {
  if (!pnlString || pnlString === '') return 0
  const cleanString = pnlString.replace(/[$()]/g, '')
  const value = parseFloat(cleanString)
  const isNegative = pnlString.includes('$(')
  return isNegative ? -Math.abs(value) : value
}

const csvContent = fs.readFileSync(julyCsvFile, 'utf8')
const lines = csvContent.split(/\r?\n/).filter(line => line.trim())

let csvTotal = 0
let csvTrades = 0
let csvContracts = 0

console.log(`\n📊 CSV TOTALS:`)
console.log(`==============`)

for (let i = 1; i < lines.length; i++) {
  const values = lines[i].split(',')
  if (values.length < 10) continue

  const quantity = parseInt(values[6])
  const csvPnL = parsePnL(values[9])
  
  csvTotal += csvPnL
  csvTrades++
  csvContracts += quantity
}

console.log(`Total P&L: $${csvTotal.toFixed(2)}`)
console.log(`Total Trades: ${csvTrades}`)
console.log(`Total Contracts: ${csvContracts}`)

console.log(`\n🎯 COMPARISON:`)
console.log(`==============`)
console.log(`TopStep P&L: $${topstepTotal.toFixed(2)}`)
console.log(`CSV P&L: $${csvTotal.toFixed(2)}`)
console.log(`Difference: $${(csvTotal - topstepTotal).toFixed(2)}`)
console.log(`Trade Count Match: ${topstepTrades === csvTrades ? '✅' : '❌'}`)
console.log(`Contract Count Match: ${topstepContracts === csvContracts ? '✅' : '❌'}`)

if (Math.abs(csvTotal - topstepTotal) > 0.01) {
  console.log(`\n⚠️ DISCREPANCY ANALYSIS:`)
  console.log(`========================`)
  console.log(`The difference suggests:`)
  console.log(`1. CSV may include trades not in TopStep summary`)
  console.log(`2. TopStep may have adjustments not in CSV`)
  console.log(`3. Different time periods or filtering`)
  console.log(`4. Fee calculation differences`)
}